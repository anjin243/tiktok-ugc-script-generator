import { z } from 'zod';

// UGC 风格类型
export const UGCStyleSchema = z.enum([
  'unboxing',    // 开箱测评
  'usage',       // 使用分享
  'comparison',  // 对比测评
  'story',       // 剧情植入
  'voiceover',   // 口播讲解
]);

export type UGCStyle = z.infer<typeof UGCStyleSchema>;

// 视频比例类型
export const AspectRatioSchema = z.enum([
  '9:16',   // 竖屏 - TikTok/Reels/Shorts
  '16:9',   // 横屏 - YouTube
  '1:1',    // 方形 - Instagram Feed
  '4:5',    // 竖向方形 - Instagram Feed
]);

export type AspectRatio = z.infer<typeof AspectRatioSchema>;

// 目标语言类型（跨境电商常用语言）
export const LanguageSchema = z.enum([
  'zh-CN',  // 中文（中国）
  'zh-TW',  // 中文（台湾）
  'en-US',  // 英语（美国）
  'en-GB',  // 英语（英国）
  'es-ES',  // 西班牙语
  'pt-BR',  // 葡萄牙语（巴西）
  'id-ID',  // 印尼语
  'th-TH',  // 泰语
  'vi-VN',  // 越南语
  'fil-PH', // 菲律宾语
  'ms-MY',  // 马来语
  'ar-SA',  // 阿拉伯语
  'ja-JP',  // 日语
  'ko-KR',  // 韩语
  'fr-FR',  // 法语
  'de-DE',  // 德语
]);

export type Language = z.infer<typeof LanguageSchema>;

// 创建商品 Schema
export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  category: z.string().min(1).max(100),
  sellingPoints: z.array(z.string()).min(1).max(10),
  images: z.array(z.string()).optional().default([]),
  videos: z.array(z.string()).optional().default([]),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

// 创建项目 Schema
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  productId: z.string().optional(),
  style: UGCStyleSchema,
  duration: z.number().int().positive().refine(v => [15, 30, 60].includes(v), {
    message: 'Duration must be 15, 30, or 60 seconds',
  }),
  language: LanguageSchema.optional().default('zh-CN'),
  aspectRatio: AspectRatioSchema.optional().default('9:16'),
  referenceImages: z.array(z.string()).max(5).optional().default([]),
  // 可选：直接提供商品信息（不关联已有商品）
  product: CreateProductSchema.optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// 生成脚本 Schema
export const GenerateScriptSchema = z.object({
  projectId: z.string(),
  productName: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  sellingPoints: z.array(z.string()).min(1).max(10),
  style: UGCStyleSchema,
  duration: z.number().int().positive(),
  language: LanguageSchema.optional().default('zh-CN'),
  aspectRatio: AspectRatioSchema.optional().default('9:16'),
  price: z.number().positive().optional(),
  referenceImages: z.array(z.string()).max(5).optional().default([]),
  config: z.object({
    provider: z.string(),
    keys: z.record(z.string()),
  }).optional(),
});

export type GenerateScriptInput = z.infer<typeof GenerateScriptSchema>;

// 场景 Schema
export const SceneSchema = z.object({
  order: z.number().int().positive(),
  duration: z.number().int().positive(),
  description: z.string(),
  voiceover: z.string(),
  cameraAngle: z.string().optional(),
  notes: z.string().optional(),
});

export type SceneInput = z.infer<typeof SceneSchema>;

// 生成素材 Schema
export const GenerateMaterialSchema = z.object({
  projectId: z.string(),
  type: z.enum(['image', 'text']),
  prompt: z.string().min(1).max(1000),
});

export type GenerateMaterialInput = z.infer<typeof GenerateMaterialSchema>;
