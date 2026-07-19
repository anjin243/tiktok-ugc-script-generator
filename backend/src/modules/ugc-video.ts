import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Router, type ErrorRequestHandler, type NextFunction, type Request, type RequestHandler, type Response } from 'express'
import multer, { MulterError } from 'multer'
import {
  captureVideoFrame,
  generateFreeMalayTts,
  getVideoCapabilities,
  renderVideo,
  validateAudioMedia,
  validateImageMedia,
  writeAssSubtitles,
} from '../services/ffmpeg-video'
import {
  createProductSlug,
  generateMalaysiaUgcScript,
  ugcProductInputSchema,
} from '../services/ugc-malaysia-script'
import type { UgcProductInput, VideoTaskRecord } from '../types/ugc-video.types'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_AUDIO_BYTES = 20 * 1024 * 1024
const TASK_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

class VideoRequestError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message)
  }
}

interface StoredTask extends VideoTaskRecord {
  absoluteOutputPath?: string
}

interface TaskFiles {
  images: string[]
  voiceover?: string
  music?: string
  taskDirectory: string
}

const tasks = new Map<string, StoredTask>()

const projectRoot = (): string => path.basename(process.cwd()).toLowerCase() === 'backend'
  ? path.resolve(process.cwd(), '..')
  : process.cwd()

export const getUgcOutputDirectory = (): string => process.env.UGC_OUTPUT_DIR
  ? path.resolve(process.env.UGC_OUTPUT_DIR)
  : path.join(projectRoot(), 'output')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 10, fields: 20, parts: 30 },
  fileFilter: (_request, file, callback) => {
    const allowedFields = new Set(['images', 'voiceover', 'music'])
    if (!allowedFields.has(file.fieldname)) {
      callback(new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
      return
    }
    callback(null, true)
  },
})

const parseUploads: RequestHandler = (request, response, next) => {
  upload.fields([
    { name: 'images', maxCount: 8 },
    { name: 'voiceover', maxCount: 1 },
    { name: 'music', maxCount: 1 },
  ])(request, response, error => {
    if (error instanceof MulterError) {
      next(new VideoRequestError(400, `Upload rejected: ${error.code}`))
      return
    }
    if (error) {
      next(new VideoRequestError(400, 'Upload could not be parsed'))
      return
    }
    next()
  })
}

const fileMap = (request: Request): Record<string, Express.Multer.File[]> =>
  (request.files ?? {}) as Record<string, Express.Multer.File[]>

const detectImageExtension = (buffer: Buffer): '.jpg' | '.png' | '.webp' | undefined => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png'
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp'
  return undefined
}

const detectAudioExtension = (buffer: Buffer): '.mp3' | '.wav' | '.m4a' | undefined => {
  if (buffer.length >= 3 && buffer.subarray(0, 3).toString('ascii') === 'ID3') return '.mp3'
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return '.mp3'
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE') return '.wav'
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') return '.m4a'
  return undefined
}

const validateUploads = (
  request: Request
): { input: UgcProductInput; images: Express.Multer.File[]; voiceover?: Express.Multer.File; music?: Express.Multer.File } => {
  let metadata: unknown
  try {
    metadata = JSON.parse(String(request.body.metadata ?? ''))
  } catch {
    throw new VideoRequestError(400, 'metadata must be valid JSON')
  }
  const parsedInput = ugcProductInputSchema.safeParse(metadata)
  if (!parsedInput.success) {
    throw new VideoRequestError(400, 'metadata does not match the required product schema')
  }
  const input = parsedInput.data
  const files = fileMap(request)
  const images = files.images ?? []
  if (images.length < 3 || images.length > 8) {
    throw new VideoRequestError(400, 'Upload between 3 and 8 product images')
  }
  for (const image of images) {
    if (image.size > MAX_IMAGE_BYTES) throw new VideoRequestError(400, 'Each image must be 8MB or smaller')
    if (!detectImageExtension(image.buffer)) throw new VideoRequestError(400, 'Images must be JPEG, PNG, or WebP files')
  }

  const voiceover = files.voiceover?.[0]
  const music = files.music?.[0]
  for (const audio of [voiceover, music]) {
    if (!audio) continue
    if (audio.size > MAX_AUDIO_BYTES) throw new VideoRequestError(400, 'Each audio file must be 20MB or smaller')
    if (!detectAudioExtension(audio.buffer)) throw new VideoRequestError(400, 'Audio must be MP3, WAV, or M4A')
  }
  return { input, images, voiceover, music }
}

const persistUploads = async (
  taskId: string,
  images: Express.Multer.File[],
  voiceover?: Express.Multer.File,
  music?: Express.Multer.File
): Promise<TaskFiles> => {
  const taskDirectory = path.join(os.tmpdir(), 'tiktok-ugc-video', taskId)
  await fs.mkdir(taskDirectory, { recursive: true })
  const imagePaths: string[] = []
  for (let index = 0; index < images.length; index += 1) {
    const extension = detectImageExtension(images[index].buffer)
    if (!extension) throw new VideoRequestError(400, 'Invalid image signature')
    const destination = path.join(taskDirectory, `image-${index + 1}${extension}`)
    await fs.writeFile(destination, images[index].buffer, { flag: 'wx' })
    imagePaths.push(destination)
  }

  const saveAudio = async (file: Express.Multer.File | undefined, label: string) => {
    if (!file) return undefined
    const extension = detectAudioExtension(file.buffer)
    if (!extension) throw new VideoRequestError(400, 'Invalid audio signature')
    const destination = path.join(taskDirectory, `${label}${extension}`)
    await fs.writeFile(destination, file.buffer, { flag: 'wx' })
    return destination
  }
  return {
    images: imagePaths,
    voiceover: await saveAudio(voiceover, 'voiceover'),
    music: await saveAudio(music, 'music'),
    taskDirectory,
  }
}

const updateTask = (taskId: string, update: Partial<StoredTask>) => {
  const current = tasks.get(taskId)
  if (!current) return
  tasks.set(taskId, { ...current, ...update, updatedAt: new Date().toISOString() })
}

const runTask = async (taskId: string, input: UgcProductInput, files: TaskFiles): Promise<void> => {
  try {
    updateTask(taskId, { status: 'rendering', progress: 10 })
    await Promise.all(files.images.map(validateImageMedia))
    if (files.voiceover) await validateAudioMedia(files.voiceover)
    if (files.music) await validateAudioMedia(files.music)

    const script = generateMalaysiaUgcScript(input, files.images.length)
    updateTask(taskId, { script, progress: 30 })
    const subtitlePath = path.join(files.taskDirectory, 'captions.ass')
    await writeAssSubtitles(subtitlePath, script.scenes, input.subtitleMode)

    const warnings = [...script.risks]
    let voiceoverPath = files.voiceover
    if (!voiceoverPath && input.ttsMode === 'auto') {
      const generatedPath = path.join(files.taskDirectory, 'voiceover.wav')
      if (await generateFreeMalayTts(script.malayVoiceover, generatedPath)) {
        voiceoverPath = generatedPath
      } else {
        warnings.push('Free local Malay TTS is unavailable; upload a voiceover file to include narration.')
      }
    }
    if (!voiceoverPath && input.ttsMode === 'upload') {
      warnings.push('No voiceover file was supplied; the video was created without narration.')
    }

    const slug = createProductSlug(input.productName)
    const outputDirectory = getUgcOutputDirectory()
    await fs.mkdir(outputDirectory, { recursive: true })
    const outputPath = path.join(outputDirectory, `${slug}-ugc-my.mp4`)
    const screenshotPath = path.join(outputDirectory, `${slug}-ugc-my-preview.jpg`)
    updateTask(taskId, { progress: 45, warnings })
    await renderVideo({
      images: files.images,
      scenes: script.scenes,
      subtitleMode: input.subtitleMode,
      subtitlePath,
      outputPath,
      voiceoverPath,
      musicPath: files.music,
    })
    updateTask(taskId, { progress: 90 })
    await captureVideoFrame(outputPath, screenshotPath)

    const fileName = path.basename(outputPath)
    updateTask(taskId, {
      status: 'completed',
      progress: 100,
      outputPath: `output/${fileName}`,
      outputUrl: `/api/ugc-video/tasks/${taskId}/video`,
      downloadUrl: `/api/ugc-video/tasks/${taskId}/download`,
      screenshotPath: `output/${path.basename(screenshotPath)}`,
      absoluteOutputPath: outputPath,
      warnings,
    })
  } catch (error) {
    updateTask(taskId, {
      status: 'failed',
      progress: 100,
      error: error instanceof Error ? error.message : 'Video rendering failed',
    })
  } finally {
    await fs.rm(files.taskDirectory, { recursive: true, force: true }).catch(() => undefined)
  }
}

const publicTask = (task: StoredTask): VideoTaskRecord => {
  const { absoluteOutputPath: _output, ...record } = task
  return record
}

const requireTask = (request: Request): StoredTask => {
  const taskId = String(request.params.taskId)
  if (!TASK_ID_PATTERN.test(taskId)) throw new VideoRequestError(400, 'Invalid task id')
  const task = tasks.get(taskId)
  if (!task) throw new VideoRequestError(404, 'Video task not found')
  return task
}

export const ugcVideoRouter: Router = Router()

ugcVideoRouter.get('/ugc-video/capabilities', async (_request: Request, response: Response) => {
  response.json({ success: true, data: await getVideoCapabilities() })
})

ugcVideoRouter.post('/ugc-video/tasks', parseUploads, async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { input, images, voiceover, music } = validateUploads(request)
    const taskId = randomUUID()
    const files = await persistUploads(taskId, images, voiceover, music)
    const now = new Date().toISOString()
    const task: StoredTask = {
      id: taskId,
      status: 'queued',
      productSlug: createProductSlug(input.productName),
      createdAt: now,
      updatedAt: now,
      progress: 0,
      warnings: [],
    }
    tasks.set(taskId, task)
    setImmediate(() => void runTask(taskId, input, files))
    response.status(202).json({ success: true, data: publicTask(task) })
  } catch (error) {
    next(error)
  }
})

ugcVideoRouter.get('/ugc-video/tasks/:taskId', (request: Request, response: Response) => {
  response.json({ success: true, data: publicTask(requireTask(request)) })
})

ugcVideoRouter.get('/ugc-video/tasks/:taskId/video', (request: Request, response: Response, next: NextFunction) => {
  const task = requireTask(request)
  if (task.status !== 'completed' || !task.absoluteOutputPath) {
    next(new VideoRequestError(409, 'Video is not ready'))
    return
  }
  response.sendFile(task.absoluteOutputPath, error => {
    if (error) next(error)
  })
})

ugcVideoRouter.get('/ugc-video/tasks/:taskId/download', (request: Request, response: Response, next: NextFunction) => {
  const task = requireTask(request)
  if (task.status !== 'completed' || !task.absoluteOutputPath) {
    next(new VideoRequestError(409, 'Video is not ready'))
    return
  }
  response.download(task.absoluteOutputPath, path.basename(task.absoluteOutputPath), error => {
    if (error) next(error)
  })
})

const videoErrorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof VideoRequestError) {
    response.status(error.statusCode).json({ status: 'error', message: error.message })
    return
  }
  response.status(500).json({ status: 'error', message: 'Video task failed' })
}

ugcVideoRouter.use(videoErrorHandler)

export const getVideoTaskForTesting = (taskId: string): VideoTaskRecord | undefined => {
  const task = tasks.get(taskId)
  return task ? publicTask(task) : undefined
}
