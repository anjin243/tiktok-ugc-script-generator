export type AiVideoModel = 'sora-2' | 'sora-2-pro'
export type AiVideoSize = '720x1280' | '1024x1792'
export type AiClipSeconds = 4 | 8
export type AiSceneStatus =
  | 'planned'
  | 'queued'
  | 'in_progress'
  | 'awaiting_review'
  | 'approved'
  | 'rejected'
  | 'failed'
  | 'cancelled'

export interface AiVideoInput {
  productName: string
  sellingPoints: string[]
  targetMarket: string
  modelDescription: string
  usageScene: string
  videoStyle: string
  immutableDetails: string[]
  videoLanguage: string
  subtitleMode: 'malay' | 'bilingual'
  model: AiVideoModel
  size: AiVideoSize
  clipSeconds: AiClipSeconds
  sceneCount: 3 | 4
}

export interface AiVideoEstimate {
  model: AiVideoModel
  size: AiVideoSize
  callCount: number
  secondsPerCall: AiClipSeconds
  totalBillableSeconds: number
  pricePerSecondUsd: number
  estimatedTotalUsd: number
  currency: 'USD'
  priceReferenceDate: string
  disclaimer: string
}

export interface AiSceneReview {
  productColorCorrect: boolean
  structureCorrect: boolean
  logoAcceptable: boolean
  quantityCorrect: boolean
  accessoriesCorrect: boolean
  notes?: string
}

export interface AiVideoScene {
  index: number
  kind: 'model_showcase' | 'product_use' | 'lifestyle' | 'closeup_cta'
  title: string
  duration: AiClipSeconds
  referenceImageIndex: number
  prompt: string
  status: AiSceneStatus
  progress: number
  remoteVideoId?: string
  previewUrl?: string
  review?: AiSceneReview
  publishable?: boolean
  error?: string
}

export type AiVideoTaskStatus =
  | 'draft'
  | 'authorized'
  | 'generating'
  | 'awaiting_review'
  | 'ready_to_finalize'
  | 'cancelled'
  | 'failed'

export interface AiVideoTask {
  id: string
  status: AiVideoTaskStatus
  productSlug: string
  input: AiVideoInput
  estimate: AiVideoEstimate
  scenes: AiVideoScene[]
  createdAt: string
  updatedAt: string
  costAuthorizedAt?: string
  costAuthorizedUsd?: number
  stopFutureScenes: boolean
  warnings: string[]
}

export interface OpenAiVideoJob {
  id: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed'
  progress?: number
  error?: { code?: string; message?: string }
}
