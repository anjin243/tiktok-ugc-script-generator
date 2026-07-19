import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Router, type ErrorRequestHandler, type NextFunction, type Request, type RequestHandler, type Response } from 'express'
import multer, { MulterError } from 'multer'
import { estimateAiVideoCost, aiVideoInputSchema, planAiVideoScenes } from '../services/ai-video-planner'
import { createProductSlug } from '../services/ugc-malaysia-script'
import { OpenAiVideoClient, type OpenAiVideoClientContract } from '../services/openai-video-client'
import type { AiSceneReview, AiVideoTask } from '../types/ai-video.types'

const MAX_REFERENCE_IMAGE_BYTES = 12 * 1024 * 1024
const TASK_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{3,200}$/
const CONFIRMATION_PHRASE = '确认付费生成'

class AiVideoRequestError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message)
  }
}

interface StoredAiVideoTask extends AiVideoTask {
  taskDirectory: string
  referenceImagePaths: string[]
  sceneVideoPaths: Record<number, string>
}

export interface AiVideoRouterOptions {
  client?: OpenAiVideoClientContract
  apiKeyConfigured?: () => boolean
  storageRoot?: string
  pollIntervalMs?: number
  maxPollAttempts?: number
}

const projectRoot = (): string => path.basename(process.cwd()).toLowerCase() === 'backend'
  ? path.resolve(process.cwd(), '..')
  : process.cwd()

const detectImage = (buffer: Buffer): { extension: '.jpg' | '.png' | '.webp'; mime: string } | undefined => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { extension: '.jpg', mime: 'image/jpeg' }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: '.png', mime: 'image/png' }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return { extension: '.webp', mime: 'image/webp' }
  return undefined
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_REFERENCE_IMAGE_BYTES, files: 4, fields: 10, parts: 16 },
  fileFilter: (_request, file, callback) => {
    if (file.fieldname !== 'images') {
      callback(new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
      return
    }
    callback(null, true)
  },
})

const parseUploads: RequestHandler = (request, response, next) => {
  upload.array('images', 4)(request, response, error => {
    if (error instanceof MulterError) {
      next(new AiVideoRequestError(400, `Upload rejected: ${error.code}`))
      return
    }
    if (error) {
      next(new AiVideoRequestError(400, 'Reference images could not be parsed'))
      return
    }
    next()
  })
}

const delay = (milliseconds: number): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds))

export const createAiVideoRouter = (options: AiVideoRouterOptions = {}): Router => {
  const router = Router()
  const tasks = new Map<string, StoredAiVideoTask>()
  const client = options.client ?? new OpenAiVideoClient()
  const keyConfigured = options.apiKeyConfigured ?? (() => Boolean(process.env.OPENAI_API_KEY?.trim()))
  const storageRoot = options.storageRoot ?? path.join(projectRoot(), 'output', 'ai-video-tasks')
  const pollIntervalMs = options.pollIntervalMs ?? 10_000
  const maxPollAttempts = options.maxPollAttempts ?? 180

  const publicTask = (task: StoredAiVideoTask): AiVideoTask => {
    const { taskDirectory: _taskDirectory, referenceImagePaths: _referenceImagePaths, sceneVideoPaths: _sceneVideoPaths, ...record } = task
    return record
  }

  const persistTask = async (task: StoredAiVideoTask): Promise<void> => {
    task.updatedAt = new Date().toISOString()
    await fs.mkdir(task.taskDirectory, { recursive: true })
    await fs.writeFile(path.join(task.taskDirectory, 'task.json'), JSON.stringify(publicTask(task), null, 2), 'utf8')
  }

  const requireTask = (request: Request): StoredAiVideoTask => {
    const taskId = String(request.params.taskId)
    if (!TASK_ID_PATTERN.test(taskId)) throw new AiVideoRequestError(400, 'Invalid AI video task id')
    const task = tasks.get(taskId)
    if (!task) throw new AiVideoRequestError(404, 'AI video task not found in this server session')
    return task
  }

  const updateSceneTaskStatus = (task: StoredAiVideoTask): void => {
    if (task.scenes.every(scene => scene.status === 'approved')) {
      task.status = 'ready_to_finalize'
    } else if (task.stopFutureScenes) {
      task.status = 'cancelled'
    } else if (task.scenes.some(scene => scene.status === 'awaiting_review')) {
      task.status = 'awaiting_review'
    } else if (task.scenes.some(scene => ['queued', 'in_progress'].includes(scene.status))) {
      task.status = 'generating'
    }
  }

  const generateScene = async (task: StoredAiVideoTask, sceneIndex: number): Promise<void> => {
    const scene = task.scenes[sceneIndex - 1]
    try {
      const referencePath = task.referenceImagePaths[scene.referenceImageIndex]
      const referenceBytes = await fs.readFile(referencePath)
      const detected = detectImage(referenceBytes)
      if (!detected) throw new Error('Stored reference image is invalid')
      const inputReferenceDataUrl = `data:${detected.mime};base64,${referenceBytes.toString('base64')}`

      // This is the only paid create call. It is deliberately executed once and never retried automatically.
      const created = await client.createVideo({
        model: task.input.model,
        prompt: scene.prompt,
        seconds: scene.duration,
        size: task.input.size,
        inputReferenceDataUrl,
      })
      if (!VIDEO_ID_PATTERN.test(created.id)) throw new Error('OpenAI returned an invalid video id')
      scene.remoteVideoId = created.id
      scene.status = created.status === 'in_progress' ? 'in_progress' : 'queued'
      scene.progress = created.progress ?? 0
      await persistTask(task)

      let job = created
      for (let attempt = 0; attempt < maxPollAttempts && ['queued', 'in_progress'].includes(job.status); attempt += 1) {
        await delay(pollIntervalMs)
        job = await client.retrieveVideo(created.id)
        scene.status = job.status === 'in_progress' ? 'in_progress' : job.status === 'queued' ? 'queued' : scene.status
        scene.progress = job.progress ?? scene.progress
        await persistTask(task)
      }

      if (job.status === 'failed') throw new Error(job.error?.message ?? 'OpenAI video generation failed')
      if (job.status !== 'completed') throw new Error('OpenAI video generation polling timed out; no retry was attempted')

      const video = await client.downloadVideo(created.id)
      const videoPath = path.join(task.taskDirectory, `scene-${scene.index}.mp4`)
      await fs.writeFile(videoPath, video, { flag: 'wx' })
      task.sceneVideoPaths[scene.index] = videoPath
      scene.status = 'awaiting_review'
      scene.progress = 100
      scene.previewUrl = `/api/ai-video/tasks/${task.id}/scenes/${scene.index}/video`
      task.status = 'awaiting_review'
      await persistTask(task)
    } catch (error) {
      scene.status = 'failed'
      scene.progress = 100
      scene.error = error instanceof Error ? error.message : 'AI scene generation failed'
      task.status = 'failed'
      await persistTask(task)
    }
  }

  router.get('/ai-video/capabilities', (_request: Request, response: Response) => {
    response.json({
      success: true,
      data: {
        apiKeyConfigured: keyConfigured(),
        defaultModel: 'sora-2',
        models: ['sora-2', 'sora-2-pro'],
        durations: [4, 8],
        sizes: ['720x1280', '1024x1792'],
        explicitConfirmationPhrase: CONFIRMATION_PHRASE,
        autoRetryPaidGeneration: false,
        modelLifecycleNotice: 'OpenAI currently labels the Sora 2 model pages as Legacy; availability depends on your API project.',
      },
    })
  })

  router.get('/ai-video/openai-status', async (_request: Request, response: Response, next: NextFunction) => {
    try {
      if (!keyConfigured()) {
        throw new AiVideoRequestError(409, 'OPENAI_API_KEY is not configured on the backend')
      }
      const status = await client.checkModelAccess('sora-2')
      response.json({ success: true, data: status })
    } catch (error) {
      next(error)
    }
  })

  router.post('/ai-video/estimate', (request: Request, response: Response, next: NextFunction) => {
    try {
      const parsed = aiVideoInputSchema.safeParse(request.body)
      if (!parsed.success) throw new AiVideoRequestError(400, 'AI video input does not match the required schema')
      response.json({ success: true, data: estimateAiVideoCost(parsed.data) })
    } catch (error) {
      next(error)
    }
  })

  router.post('/ai-video/tasks', parseUploads, async (request: Request, response: Response, next: NextFunction) => {
    let taskDirectory: string | undefined
    try {
      let metadata: unknown
      try {
        metadata = JSON.parse(String(request.body.metadata ?? ''))
      } catch {
        throw new AiVideoRequestError(400, 'metadata must be valid JSON')
      }
      const parsed = aiVideoInputSchema.safeParse(metadata)
      if (!parsed.success) throw new AiVideoRequestError(400, 'AI video metadata does not match the required schema')
      const files = (request.files ?? []) as Express.Multer.File[]
      if (files.length < 1 || files.length > 4) throw new AiVideoRequestError(400, 'Upload between 1 and 4 reference images')
      files.forEach(file => {
        if (!detectImage(file.buffer)) throw new AiVideoRequestError(400, 'Reference images must be JPEG, PNG, or WebP content')
      })

      const taskId = randomUUID()
      taskDirectory = path.join(storageRoot, taskId)
      await fs.mkdir(taskDirectory, { recursive: true })
      const referenceImagePaths: string[] = []
      for (let index = 0; index < files.length; index += 1) {
        const detected = detectImage(files[index].buffer)
        if (!detected) throw new AiVideoRequestError(400, 'Invalid image signature')
        const imagePath = path.join(taskDirectory, `reference-${index + 1}${detected.extension}`)
        await fs.writeFile(imagePath, files[index].buffer, { flag: 'wx' })
        referenceImagePaths.push(imagePath)
      }

      const now = new Date().toISOString()
      const task: StoredAiVideoTask = {
        id: taskId,
        status: 'draft',
        productSlug: createProductSlug(parsed.data.productName),
        input: parsed.data,
        estimate: estimateAiVideoCost(parsed.data),
        scenes: planAiVideoScenes(parsed.data, files.length),
        createdAt: now,
        updatedAt: now,
        stopFutureScenes: false,
        warnings: [
          'No paid API call has been made. Cost authorization and scene generation are separate actions.',
          'Each OpenAI request accepts one input_reference; uploaded images are assigned across scenes.',
          'Every generated scene requires product-truth review before final assembly.',
        ],
        taskDirectory,
        referenceImagePaths,
        sceneVideoPaths: {},
      }
      tasks.set(taskId, task)
      await persistTask(task)
      response.status(201).json({ success: true, data: publicTask(task) })
    } catch (error) {
      if (taskDirectory) await fs.rm(taskDirectory, { recursive: true, force: true }).catch(() => undefined)
      next(error)
    }
  })

  router.get('/ai-video/tasks/:taskId', (request: Request, response: Response, next: NextFunction) => {
    try {
      response.json({ success: true, data: publicTask(requireTask(request)) })
    } catch (error) {
      next(error)
    }
  })

  router.post('/ai-video/tasks/:taskId/authorize-cost', async (request: Request, response: Response, next: NextFunction) => {
    try {
      const task = requireTask(request)
      const acceptedCost = Number(request.body?.acceptedEstimatedCostUsd)
      if (request.body?.confirmed !== true || request.body?.confirmationPhrase !== CONFIRMATION_PHRASE) {
        throw new AiVideoRequestError(400, `Type the exact phrase: ${CONFIRMATION_PHRASE}`)
      }
      if (acceptedCost !== task.estimate.estimatedTotalUsd) throw new AiVideoRequestError(409, 'Estimated cost changed; review the estimate again')
      if (!keyConfigured()) throw new AiVideoRequestError(409, 'OPENAI_API_KEY is not configured on the backend')
      task.costAuthorizedAt = new Date().toISOString()
      task.costAuthorizedUsd = acceptedCost
      task.status = 'authorized'
      await persistTask(task)
      response.json({ success: true, data: publicTask(task) })
    } catch (error) {
      next(error)
    }
  })

  router.post('/ai-video/tasks/:taskId/scenes/:sceneIndex/generate', async (request: Request, response: Response, next: NextFunction) => {
    try {
      const task = requireTask(request)
      const sceneIndex = Number(request.params.sceneIndex)
      const scene = task.scenes[sceneIndex - 1]
      if (!scene || !Number.isInteger(sceneIndex)) throw new AiVideoRequestError(404, 'AI video scene not found')
      if (!task.costAuthorizedAt || task.costAuthorizedUsd !== task.estimate.estimatedTotalUsd) throw new AiVideoRequestError(403, 'Explicit cost authorization is required')
      if (task.stopFutureScenes) throw new AiVideoRequestError(409, 'Future scene generation was cancelled')
      if (scene.status !== 'planned') throw new AiVideoRequestError(409, 'This scene has already been submitted; paid generation is never retried automatically')
      if (sceneIndex > 1 && task.scenes.slice(0, sceneIndex - 1).some(previous => previous.status !== 'approved')) {
        throw new AiVideoRequestError(409, 'Approve every earlier scene before generating the next paid scene')
      }
      scene.status = 'queued'
      task.status = 'generating'
      await persistTask(task)
      setImmediate(() => void generateScene(task, sceneIndex))
      response.status(202).json({ success: true, data: publicTask(task) })
    } catch (error) {
      next(error)
    }
  })

  router.post('/ai-video/tasks/:taskId/scenes/:sceneIndex/review', async (request: Request, response: Response, next: NextFunction) => {
    try {
      const task = requireTask(request)
      const scene = task.scenes[Number(request.params.sceneIndex) - 1]
      if (!scene) throw new AiVideoRequestError(404, 'AI video scene not found')
      if (scene.status !== 'awaiting_review') throw new AiVideoRequestError(409, 'Only a completed, unreviewed scene can be reviewed')
      const review = request.body?.review as AiSceneReview | undefined
      if (!review) throw new AiVideoRequestError(400, 'Product-truth review checklist is required')
      const checklistPassed = review.productColorCorrect === true
        && review.structureCorrect === true
        && review.logoAcceptable === true
        && review.quantityCorrect === true
        && review.accessoriesCorrect === true
      const publishable = request.body?.approved === true && checklistPassed
      if (!publishable && !review.notes?.trim()) throw new AiVideoRequestError(400, 'Explain the product mismatch before rejecting a scene')
      scene.review = review
      scene.publishable = publishable
      scene.status = scene.publishable ? 'approved' : 'rejected'
      updateSceneTaskStatus(task)
      await persistTask(task)
      response.json({ success: true, data: publicTask(task) })
    } catch (error) {
      next(error)
    }
  })

  router.post('/ai-video/tasks/:taskId/cancel-future-scenes', async (request: Request, response: Response, next: NextFunction) => {
    try {
      const task = requireTask(request)
      task.stopFutureScenes = true
      task.scenes.forEach(scene => {
        if (scene.status === 'planned') scene.status = 'cancelled'
      })
      task.warnings.push('Future scenes were cancelled. A scene already submitted to OpenAI may still complete and may still be billed.')
      updateSceneTaskStatus(task)
      await persistTask(task)
      response.json({ success: true, data: publicTask(task) })
    } catch (error) {
      next(error)
    }
  })

  router.get('/ai-video/tasks/:taskId/scenes/:sceneIndex/video', (request: Request, response: Response, next: NextFunction) => {
    try {
      const task = requireTask(request)
      const sceneIndex = Number(request.params.sceneIndex)
      const videoPath = task.sceneVideoPaths[sceneIndex]
      if (!videoPath) throw new AiVideoRequestError(404, 'Generated scene video is not available')
      response.sendFile(videoPath, error => { if (error) next(error) })
    } catch (error) {
      next(error)
    }
  })

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error instanceof AiVideoRequestError) {
      response.status(error.statusCode).json({ status: 'error', message: error.message })
      return
    }
    response.status(500).json({ status: 'error', message: 'AI video task failed safely; no automatic paid retry was attempted' })
  }
  router.use(errorHandler)
  return router
}

export const aiVideoRouter = createAiVideoRouter()
