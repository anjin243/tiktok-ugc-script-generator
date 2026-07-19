export type SubtitleMode = 'malay' | 'bilingual'
export type BrandAuthorization = 'confirmed' | 'unclear' | 'unbranded'
export type TtsMode = 'auto' | 'upload' | 'none'

export interface UgcProductInput {
  productName: string
  category: string
  targetAudience: string
  sellingPoints: string[]
  brandAuthorization: BrandAuthorization
  noUpfEvidence: boolean
  noWaterproofEvidence: boolean
  subtitleMode: SubtitleMode
  ttsMode: TtsMode
}

export interface UgcScene {
  index: number
  imageIndex: number
  start: number
  end: number
  duration: number
  malay: string
  chinese: string
}

export interface UgcScriptResult {
  duration: 15
  scenes: UgcScene[]
  malayVoiceover: string
  risks: string[]
}

export type VideoTaskStatus = 'queued' | 'rendering' | 'completed' | 'failed'

export interface VideoTaskRecord {
  id: string
  status: VideoTaskStatus
  productSlug: string
  createdAt: string
  updatedAt: string
  progress: number
  outputPath?: string
  outputUrl?: string
  downloadUrl?: string
  screenshotPath?: string
  script?: UgcScriptResult
  warnings: string[]
  error?: string
}
