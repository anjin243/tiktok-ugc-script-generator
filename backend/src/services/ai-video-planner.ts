import { z } from 'zod'
import type {
  AiVideoEstimate,
  AiVideoInput,
  AiVideoModel,
  AiVideoScene,
  AiVideoSize,
} from '../types/ai-video.types'

export const aiVideoInputSchema = z.object({
  productName: z.string().trim().min(2).max(100),
  sellingPoints: z.array(z.string().trim().min(1).max(140)).min(1).max(8),
  targetMarket: z.string().trim().min(2).max(80),
  modelDescription: z.string().trim().min(3).max(500),
  usageScene: z.string().trim().min(3).max(500),
  videoStyle: z.string().trim().min(2).max(120),
  immutableDetails: z.array(z.string().trim().min(1).max(160)).min(1).max(12),
  videoLanguage: z.string().trim().min(2).max(50),
  subtitleMode: z.enum(['malay', 'bilingual']).default('malay'),
  model: z.enum(['sora-2', 'sora-2-pro']).default('sora-2'),
  size: z.enum(['720x1280', '1024x1792']).default('720x1280'),
  clipSeconds: z.union([z.literal(4), z.literal(8)]).default(4),
  sceneCount: z.union([z.literal(3), z.literal(4)]).default(4),
}).superRefine((value, context) => {
  if (value.model === 'sora-2' && value.size !== '720x1280') {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['size'], message: 'sora-2 supports the priced portrait size 720x1280' })
  }
})

const PRICE_PER_SECOND: Record<AiVideoModel, Partial<Record<AiVideoSize, number>>> = {
  'sora-2': { '720x1280': 0.10 },
  'sora-2-pro': { '720x1280': 0.30, '1024x1792': 0.50 },
}

export const estimateAiVideoCost = (input: Pick<AiVideoInput, 'model' | 'size' | 'clipSeconds' | 'sceneCount'>): AiVideoEstimate => {
  const pricePerSecondUsd = PRICE_PER_SECOND[input.model][input.size]
  if (pricePerSecondUsd === undefined) throw new Error('Unsupported model and size combination')
  const totalBillableSeconds = input.clipSeconds * input.sceneCount
  return {
    model: input.model,
    size: input.size,
    callCount: input.sceneCount,
    secondsPerCall: input.clipSeconds,
    totalBillableSeconds,
    pricePerSecondUsd,
    estimatedTotalUsd: Number((totalBillableSeconds * pricePerSecondUsd).toFixed(2)),
    currency: 'USD',
    priceReferenceDate: '2026-07-19',
    disclaimer: 'Estimate only. Confirm current OpenAI pricing and account availability before generation; taxes and failed-job billing behavior may vary.',
  }
}

const sceneDefinitions: Array<Pick<AiVideoScene, 'kind' | 'title'>> = [
  { kind: 'model_showcase', title: '模特拿起并展示商品' },
  { kind: 'product_use', title: '商品细节与真实使用动作' },
  { kind: 'lifestyle', title: '生活或户外使用场景' },
  { kind: 'closeup_cta', title: '商品特写与CTA' },
]

const actionFor = (kind: AiVideoScene['kind']): string => {
  if (kind === 'model_showcase') return 'A fictional adult model naturally reaches for the product, picks it up, turns toward camera, and presents it with believable hand and body motion.'
  if (kind === 'product_use') return 'The adult model demonstrates the product in a realistic use action while the camera makes a gentle handheld push-in toward verified product details.'
  if (kind === 'lifestyle') return 'The adult model uses the product naturally in the requested lifestyle setting while walking or changing posture; use genuine parallax and camera tracking.'
  return 'Finish with a clean moving product close-up in the model’s hands and a confident gesture toward the product; leave safe lower-frame space for a later CTA subtitle.'
}

export const planAiVideoScenes = (input: AiVideoInput, imageCount: number): AiVideoScene[] => {
  const details = input.immutableDetails.join('; ')
  const claims = input.sellingPoints.join('; ')
  return sceneDefinitions.slice(0, input.sceneCount).map((definition, index) => ({
    index: index + 1,
    ...definition,
    duration: input.clipSeconds,
    referenceImageIndex: index % imageCount,
    status: 'planned',
    progress: 0,
    prompt: [
      `Create a photorealistic vertical TikTok Shop UGC shot for ${input.targetMarket}.`,
      `Product: ${input.productName}. Verified selling points only: ${claims}.`,
      `Fictional adult model: ${input.modelDescription}. Setting: ${input.usageScene}. Style: ${input.videoStyle}.`,
      actionFor(definition.kind),
      `Product identity lock: preserve exactly these details from the input reference image: ${details}.`,
      'Do not change the main color, structure, quantity, logo placement, accessories, proportions, closure, handle, or strap. Do not invent certification, food-grade status, waterproofing, UPF, polarization, official branding, authorization, or extra accessories.',
      'Real human movement and real camera movement are required. Do not create a slideshow, still-photo zoom, morphing product, duplicate product, floating object, or text baked into the generated video.',
      `Spoken language context: ${input.videoLanguage}. No on-screen text; subtitles will be added later in post-production.`,
    ].join(' '),
  }))
}
