import type { AiClipSeconds, AiVideoModel, AiVideoSize, OpenAiVideoJob } from '../types/ai-video.types'

const OPENAI_API_BASE_URL = 'https://api.openai.com/v1'
const MAX_VIDEO_DOWNLOAD_BYTES = 150 * 1024 * 1024

export interface CreateOpenAiVideoRequest {
  model: AiVideoModel
  prompt: string
  seconds: AiClipSeconds
  size: AiVideoSize
  inputReferenceDataUrl: string
}

export interface OpenAiVideoClientContract {
  createVideo(request: CreateOpenAiVideoRequest): Promise<OpenAiVideoJob>
  retrieveVideo(videoId: string): Promise<OpenAiVideoJob>
  downloadVideo(videoId: string): Promise<Buffer>
}

export class OpenAiVideoClient implements OpenAiVideoClientContract {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly apiKeyProvider: () => string | undefined = () => process.env.OPENAI_API_KEY
  ) {}

  private apiKey(): string {
    const key = this.apiKeyProvider()?.trim()
    if (!key) throw new Error('OPENAI_API_KEY is not configured on the backend')
    return key
  }

  private async requestJson(url: string, init: RequestInit): Promise<OpenAiVideoJob> {
    const response = await this.fetchImpl(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey()}`,
        ...(init.headers ?? {}),
      },
    })
    const payload = await response.json().catch(() => ({})) as OpenAiVideoJob & { error?: { message?: string } }
    if (!response.ok) throw new Error(`OpenAI Videos API request failed (${response.status}): ${payload.error?.message ?? 'unknown error'}`)
    return payload
  }

  createVideo(request: CreateOpenAiVideoRequest): Promise<OpenAiVideoJob> {
    return this.requestJson(`${OPENAI_API_BASE_URL}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        seconds: String(request.seconds),
        size: request.size,
        input_reference: { image_url: request.inputReferenceDataUrl },
      }),
    })
  }

  retrieveVideo(videoId: string): Promise<OpenAiVideoJob> {
    return this.requestJson(`${OPENAI_API_BASE_URL}/videos/${encodeURIComponent(videoId)}`, { method: 'GET' })
  }

  async downloadVideo(videoId: string): Promise<Buffer> {
    const response = await this.fetchImpl(`${OPENAI_API_BASE_URL}/videos/${encodeURIComponent(videoId)}/content`, {
      headers: { Authorization: `Bearer ${this.apiKey()}` },
    })
    if (!response.ok) throw new Error(`OpenAI video download failed (${response.status})`)
    const declaredLength = Number(response.headers.get('content-length') ?? 0)
    if (declaredLength > MAX_VIDEO_DOWNLOAD_BYTES) throw new Error('Generated video exceeds the 150MB safety limit')
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > MAX_VIDEO_DOWNLOAD_BYTES) throw new Error('Generated video exceeds the 150MB safety limit')
    return buffer
  }
}
