import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { SubtitleMode, UgcScene } from '../types/ugc-video.types'

const VIDEO_DURATION = 15
const FPS = 30
const MAX_PROCESS_OUTPUT = 32_000

export interface ProcessResult {
  stdout: string
  stderr: string
}

export interface RenderVideoRequest {
  images: string[]
  scenes: UgcScene[]
  subtitleMode: SubtitleMode
  subtitlePath: string
  outputPath: string
  voiceoverPath?: string
  musicPath?: string
}

export interface MediaProbe {
  duration?: number
  width?: number
  height?: number
  codec?: string
}

const commandFor = (name: 'ffmpeg' | 'ffprobe' | 'espeak-ng'): string => {
  const configured = name === 'ffmpeg'
    ? process.env.FFMPEG_PATH
    : name === 'ffprobe'
      ? process.env.FFPROBE_PATH
      : process.env.ESPEAK_NG_PATH
  return configured?.trim() || name
}

export const runProcess = async (
  command: string,
  args: string[],
  timeoutMs = 120_000
): Promise<ProcessResult> => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  let finished = false

  const finishWithError = (error: Error) => {
    if (finished) return
    finished = true
    clearTimeout(timer)
    reject(error)
  }

  const timer = setTimeout(() => {
    child.kill('SIGKILL')
    finishWithError(new Error(`${command} timed out after ${timeoutMs}ms`))
  }, timeoutMs)

  child.stdout.on('data', chunk => {
    stdout = (stdout + chunk.toString()).slice(-MAX_PROCESS_OUTPUT)
  })
  child.stderr.on('data', chunk => {
    stderr = (stderr + chunk.toString()).slice(-MAX_PROCESS_OUTPUT)
  })
  child.on('error', error => finishWithError(error))
  child.on('close', code => {
    if (finished) return
    finished = true
    clearTimeout(timer)
    if (code === 0) {
      resolve({ stdout, stderr })
      return
    }
    reject(new Error(`${command} exited with code ${code}: ${stderr.slice(-4000)}`))
  })
})

export const checkCommand = async (
  name: 'ffmpeg' | 'ffprobe' | 'espeak-ng'
): Promise<boolean> => {
  try {
    await runProcess(commandFor(name), [name === 'espeak-ng' ? '--version' : '-version'], 10_000)
    return true
  } catch {
    return false
  }
}

const hasMalayTtsVoice = async (): Promise<boolean> => {
  if (!(await checkCommand('espeak-ng'))) return false
  try {
    const result = await runProcess(commandFor('espeak-ng'), ['--voices=ms'], 10_000)
    return /\bms\b/i.test(result.stdout)
  } catch {
    return false
  }
}

export const getVideoCapabilities = async () => {
  const [ffmpeg, ffprobe, freeMalayTts] = await Promise.all([
    checkCommand('ffmpeg'),
    checkCommand('ffprobe'),
    hasMalayTtsVoice(),
  ])

  return {
    ffmpeg,
    ffprobe,
    freeMalayTts,
    voiceoverUploadSupported: true,
    musicUploadSupported: true,
  }
}

export const probeMedia = async (filePath: string): Promise<MediaProbe> => {
  const result = await runProcess(commandFor('ffprobe'), [
    '-v', 'error',
    '-show_entries', 'stream=codec_name,width,height:format=duration',
    '-of', 'json',
    filePath,
  ], 20_000)
  const parsed = JSON.parse(result.stdout) as {
    streams?: Array<{ codec_name?: string; width?: number; height?: number }>
    format?: { duration?: string }
  }
  const stream = parsed.streams?.[0]
  return {
    codec: stream?.codec_name,
    width: stream?.width,
    height: stream?.height,
    duration: parsed.format?.duration ? Number(parsed.format.duration) : undefined,
  }
}

export const validateImageMedia = async (filePath: string): Promise<void> => {
  const probe = await probeMedia(filePath)
  const allowedCodecs = new Set(['png', 'mjpeg', 'webp'])
  if (!probe.codec || !allowedCodecs.has(probe.codec)) {
    throw new Error('Unsupported or invalid image content')
  }
  if (!probe.width || !probe.height || probe.width < 64 || probe.height < 64) {
    throw new Error('Image dimensions must be at least 64x64')
  }
  if (probe.width > 12_000 || probe.height > 12_000) {
    throw new Error('Image dimensions exceed the 12000px safety limit')
  }
}

export const validateAudioMedia = async (filePath: string): Promise<void> => {
  const probe = await probeMedia(filePath)
  const allowedCodecs = new Set(['mp3', 'aac', 'pcm_s16le', 'pcm_s24le', 'flac', 'vorbis', 'opus'])
  if (!probe.codec || !allowedCodecs.has(probe.codec)) {
    throw new Error('Unsupported or invalid audio content')
  }
  if (probe.duration && probe.duration > 600) {
    throw new Error('Audio duration exceeds the 10 minute safety limit')
  }
}

const assTime = (seconds: number): string => {
  const centiseconds = Math.round(seconds * 100)
  const hours = Math.floor(centiseconds / 360_000)
  const minutes = Math.floor((centiseconds % 360_000) / 6_000)
  const secs = Math.floor((centiseconds % 6_000) / 100)
  const cs = centiseconds % 100
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

const escapeAssText = (value: string): string => value
  .replace(/\\/g, '\\\\')
  .replace(/\{/g, '\\{')
  .replace(/\}/g, '\\}')
  .replace(/\r?\n/g, '\\N')

export const writeAssSubtitles = async (
  filePath: string,
  scenes: UgcScene[],
  mode: SubtitleMode
): Promise<void> => {
  const events = scenes.map(scene => {
    const malay = escapeAssText(scene.malay)
    const chinese = escapeAssText(scene.chinese)
    const text = mode === 'bilingual' ? `${malay}\\N{\\fs40}${chinese}` : malay
    return `Dialogue: 0,${assTime(scene.start)},${assTime(scene.end)},Default,,0,0,0,,${text}`
  })

  const content = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Microsoft YaHei,58,&H00FFFFFF,&H000000FF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,70,70,190,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`
  await fs.writeFile(filePath, content, 'utf8')
}

const escapeSubtitlePath = (filePath: string): string => filePath
  .replace(/\\/g, '/')
  .replace(/:/g, '\\:')
  .replace(/'/g, "\\'")

const buildVideoFilters = (request: RenderVideoRequest): string[] => {
  const filters: string[] = []
  request.scenes.forEach((scene, index) => {
    const frames = Math.max(1, Math.round(scene.duration * FPS))
    const zoom = `1+0.06*on/${Math.max(1, frames - 1)}`
    const panX = index % 3 === 1
      ? `(on/${frames})*(iw-iw/zoom)`
      : index % 3 === 2
        ? `(iw-iw/zoom)-(on/${frames})*(iw-iw/zoom)`
        : 'iw/2-(iw/zoom/2)'
    const panY = index % 2 === 0 ? 'ih/2-(ih/zoom/2)' : `(on/${frames})*(ih-ih/zoom)`
    const fadeOutStart = Math.max(0, scene.duration - 0.22).toFixed(3)
    filters.push(
      `[${index}:v]scale=1200:2134:force_original_aspect_ratio=increase,` +
      `crop=1200:2134,zoompan=z='${zoom}':x='${panX}':y='${panY}':` +
      `d=${frames}:s=1080x1920:fps=${FPS},trim=duration=${scene.duration.toFixed(3)},` +
      `setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.18,fade=t=out:st=${fadeOutStart}:d=0.18,setsar=1[v${index}]`
    )
  })

  const inputs = request.images.map((_, index) => `[v${index}]`).join('')
  filters.push(`${inputs}concat=n=${request.images.length}:v=1:a=0[joined]`)
  filters.push(`[joined]subtitles=filename='${escapeSubtitlePath(request.subtitlePath)}'[vout]`)
  return filters
}

export const renderVideo = async (request: RenderVideoRequest): Promise<void> => {
  if (request.images.length !== request.scenes.length) {
    throw new Error('Each scene must have exactly one image')
  }

  await fs.mkdir(path.dirname(request.outputPath), { recursive: true })
  const args: string[] = ['-hide_banner', '-loglevel', 'warning']

  request.images.forEach((image, index) => {
    args.push('-loop', '1', '-framerate', String(FPS), '-t', request.scenes[index].duration.toFixed(3), '-i', image)
  })

  let voiceIndex: number | undefined
  let musicIndex: number | undefined
  let silenceIndex: number | undefined
  let nextInputIndex = request.images.length

  if (request.voiceoverPath) {
    voiceIndex = nextInputIndex
    nextInputIndex += 1
    args.push('-i', request.voiceoverPath)
  }
  if (request.musicPath) {
    musicIndex = nextInputIndex
    nextInputIndex += 1
    args.push('-stream_loop', '-1', '-i', request.musicPath)
  }
  if (voiceIndex === undefined && musicIndex === undefined) {
    silenceIndex = nextInputIndex
    args.push('-f', 'lavfi', '-t', String(VIDEO_DURATION), '-i', 'anullsrc=r=44100:cl=stereo')
  }

  const filters = buildVideoFilters(request)
  if (voiceIndex !== undefined && musicIndex !== undefined) {
    filters.push(`[${voiceIndex}:a]aresample=44100,apad,atrim=0:${VIDEO_DURATION},volume=1.0[voice]`)
    filters.push(`[${musicIndex}:a]aresample=44100,atrim=0:${VIDEO_DURATION},volume=0.18[music]`)
    filters.push('[voice][music]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[aout]')
  } else if (voiceIndex !== undefined) {
    filters.push(`[${voiceIndex}:a]aresample=44100,apad,atrim=0:${VIDEO_DURATION},volume=1.0[aout]`)
  } else if (musicIndex !== undefined) {
    filters.push(`[${musicIndex}:a]aresample=44100,atrim=0:${VIDEO_DURATION},volume=0.18[aout]`)
  } else {
    filters.push(`[${silenceIndex}:a]atrim=0:${VIDEO_DURATION}[aout]`)
  }

  args.push(
    '-filter_complex', filters.join(';'),
    '-map', '[vout]',
    '-map', '[aout]',
    '-t', String(VIDEO_DURATION),
    '-r', String(FPS),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y', request.outputPath
  )

  await runProcess(commandFor('ffmpeg'), args, 300_000)
}

export const generateFreeMalayTts = async (
  text: string,
  outputPath: string
): Promise<boolean> => {
  if (!(await hasMalayTtsVoice())) return false
  try {
    await runProcess(commandFor('espeak-ng'), ['-v', 'ms', '-s', '165', '-w', outputPath, text], 60_000)
    return true
  } catch {
    return false
  }
}

export const captureVideoFrame = async (
  videoPath: string,
  outputPath: string,
  timestamp = 6.25
): Promise<void> => {
  await runProcess(commandFor('ffmpeg'), [
    '-hide_banner', '-loglevel', 'error',
    '-ss', String(timestamp),
    '-i', videoPath,
    '-frames:v', '1',
    '-y', outputPath,
  ], 60_000)
}
