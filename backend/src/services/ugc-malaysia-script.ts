import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { UgcProductInput, UgcScene, UgcScriptResult } from '../types/ugc-video.types'

export const ugcProductInputSchema = z.object({
  productName: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(80),
  targetAudience: z.string().trim().min(3).max(300),
  sellingPoints: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  brandAuthorization: z.enum(['confirmed', 'unclear', 'unbranded']).default('unclear'),
  noUpfEvidence: z.boolean().default(false),
  noWaterproofEvidence: z.boolean().default(false),
  subtitleMode: z.enum(['malay', 'bilingual']).default('malay'),
  ttsMode: z.enum(['auto', 'upload', 'none']).default('auto'),
})

const sellingPointTranslations: Array<{ pattern: RegExp; malay: string }> = [
  { pattern: /轻便|轻量|ringan/i, malay: 'Ringan dan senang dibawa.' },
  { pattern: /折叠|折叠收纳|boleh dilipat|fold/i, malay: 'Boleh dilipat dan mudah disimpan.' },
  { pattern: /多种颜色|多色|颜色选择|pelbagai.*warna/i, malay: 'Ada pelbagai pilihan warna.' },
  { pattern: /户外|钓鱼|露营|徒步|outdoor|memancing|camping|hiking/i, malay: 'Sesuai untuk aktiviti luar.' },
  { pattern: /方便携带|便携|mudah dibawa|portable/i, malay: 'Mudah dibawa ke mana-mana.' },
]

const toMalaySellingPoint = (sellingPoint: string): string => {
  const match = sellingPointTranslations.find(item => item.pattern.test(sellingPoint))
  return match?.malay ?? 'Lihat butiran produk sebenar.'
}

const distributeFrames = (sceneCount: number): number[] => {
  const totalFrames = 15 * 30
  const base = Math.floor(totalFrames / sceneCount)
  const remainder = totalFrames - base * sceneCount
  return Array.from({ length: sceneCount }, (_, index) => base + (index < remainder ? 1 : 0))
}

export const createProductSlug = (value: string): string => {
  const ascii = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return ascii || `product-${createHash('sha256').update(value).digest('hex').slice(0, 8)}`
}

export const generateMalaysiaUgcScript = (
  input: UgcProductInput,
  imageCount: number
): UgcScriptResult => {
  if (!Number.isInteger(imageCount) || imageCount < 3 || imageCount > 8) {
    throw new Error('Image count must be between 3 and 8')
  }

  const frameCounts = distributeFrames(imageCount)
  const scenes: UgcScene[] = []
  let startFrame = 0

  for (let index = 0; index < imageCount; index += 1) {
    const endFrame = startFrame + frameCounts[index]
    const isFirst = index === 0
    const isLast = index === imageCount - 1
    const sellingPoint = input.sellingPoints[(Math.max(index, 1) - 1) % input.sellingPoints.length]

    let malay: string
    let chinese: string

    if (isFirst) {
      malay = 'Nak barang yang senang dibawa? Cuba tengok ini.'
      chinese = '想要方便携带的商品？看看这个。'
    } else if (isLast) {
      malay = 'Tekan pautan untuk semak butiran produk.'
      chinese = '点击链接查看商品详情。'
    } else {
      malay = toMalaySellingPoint(sellingPoint)
      chinese = sellingPoint
    }

    scenes.push({
      index: index + 1,
      imageIndex: index,
      start: startFrame / 30,
      end: endFrame / 30,
      duration: frameCounts[index] / 30,
      malay,
      chinese,
    })

    startFrame = endFrame
  }

  const risks: string[] = []
  if (input.noUpfEvidence) {
    risks.push('Tiada laporan UPF: jangan gunakan UPF50+ atau kadar perlindungan UV.')
  }
  if (input.noWaterproofEvidence) {
    risks.push('Tiada ujian kalis air penuh: jangan dakwa produk kalis air sepenuhnya.')
  }
  if (input.brandAuthorization === 'unclear') {
    risks.push('Kebenaran jenama dan ketulenan produk perlu disahkan sebelum diterbitkan.')
  }

  return {
    duration: 15,
    scenes,
    malayVoiceover: scenes.map(scene => scene.malay).join(' '),
    risks,
  }
}
