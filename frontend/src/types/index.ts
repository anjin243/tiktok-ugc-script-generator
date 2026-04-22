// UGC 视频生成工具类型定义

// UGC 风格
export type UGCStyle = 'unboxing' | 'usage' | 'comparison' | 'story' | 'voiceover';

// 视频比例
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

// 目标语言
export type Language = 
  | 'zh-CN'  // 中文（中国）
  | 'zh-TW'  // 中文（台湾）
  | 'en-US'  // 英语（美国）
  | 'en-GB'  // 英语（英国）
  | 'es-ES'  // 西班牙语
  | 'pt-BR'  // 葡萄牙语（巴西）
  | 'id-ID'  // 印尼语
  | 'th-TH'  // 泰语
  | 'vi-VN'  // 越南语
  | 'fil-PH' // 菲律宾语
  | 'ms-MY'  // 马来语
  | 'ar-SA'  // 阿拉伯语
  | 'ja-JP'  // 日语
  | 'ko-KR'  // 韩语
  | 'fr-FR'  // 法语
  | 'de-DE'; // 德语

// 商品
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sellingPoints: string[];
  images: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
}

// 分镜
export interface Scene {
  id: string;
  order: number;
  duration: number;
  description: string;
  voiceover: string;
  cameraAngle?: string;
  notes?: string;
}

// 素材
export interface Material {
  id: string;
  type: 'image' | 'text';
  content: string;
  prompt?: string;
}

// 项目
export interface Project {
  id: string;
  name: string;
  style: UGCStyle;
  duration: number;
  status: 'draft' | 'completed';
  language: Language;
  aspectRatio: AspectRatio;
  referenceImages: string[];
  scriptContent?: string;
  voiceover?: string;
  musicStyle?: string;
  product?: Product;
  productId?: string;
  scenes: Scene[];
  materials: Material[];
  createdAt: string;
  updatedAt: string;
}

// 创建商品输入
export interface CreateProductInput {
  name: string;
  price: number;
  category: string;
  sellingPoints: string[];
  images?: string[];
  videos?: string[];
}

// 创建项目输入
export interface CreateProjectInput {
  name: string;
  productId?: string;
  style: UGCStyle;
  duration: 15 | 30 | 60;
  language?: Language;
  aspectRatio?: AspectRatio;
  referenceImages?: string[];
  product?: CreateProductInput;
}

// 生成脚本输入
export interface GenerateScriptInput {
  projectId: string;
  productName: string;
  category: string;
  sellingPoints: string[];
  style: UGCStyle;
  duration: number;
  language?: Language;
  aspectRatio?: AspectRatio;
  price?: number;
  referenceImages?: string[];
  config?: {
    provider: string;
    keys: Record<string, string>;
  };
}

// API 响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  message?: string;
}

// UGC 风格选项
export const UGC_STYLE_OPTIONS: { value: UGCStyle; label: string; description: string; icon: string }[] = [
  { 
    value: 'unboxing', 
    label: '开箱测评', 
    description: '从拆快递开始的沉浸式体验',
    icon: '📦',
  },
  { 
    value: 'usage', 
    label: '使用分享', 
    description: '真实使用场景展示',
    icon: '🎯',
  },
  { 
    value: 'comparison', 
    label: '对比测评', 
    description: '多产品对比分析',
    icon: '⚖️',
  },
  { 
    value: 'story', 
    label: '剧情植入', 
    description: '融入生活故事场景',
    icon: '🎬',
  },
  { 
    value: 'voiceover', 
    label: '口播讲解', 
    description: '类似直播带货风格',
    icon: '🎤',
  },
];

// 时长选项
export const DURATION_OPTIONS: { value: 15 | 30 | 60; label: string }[] = [
  { value: 15, label: '15秒' },
  { value: 30, label: '30秒' },
  { value: 60, label: '60秒' },
];

// 视频比例选项
export const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; description: string }[] = [
  { value: '9:16', label: '9:16 竖屏', description: 'TikTok / Reels / Shorts' },
  { value: '16:9', label: '16:9 横屏', description: 'YouTube / 网站' },
  { value: '1:1', label: '1:1 方形', description: 'Instagram Feed' },
  { value: '4:5', label: '4:5 竖向', description: 'Instagram Feed' },
];

// 语言选项（跨境电商常用）
export const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'zh-CN', label: '中文（简体）', flag: '🇨🇳' },
  { value: 'zh-TW', label: '中文（繁体）', flag: '🇹🇼' },
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { value: 'es-ES', label: 'Español', flag: '🇪🇸' },
  { value: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { value: 'id-ID', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { value: 'th-TH', label: 'ไทย', flag: '🇹🇭' },
  { value: 'vi-VN', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'fil-PH', label: 'Filipino', flag: '🇵🇭' },
  { value: 'ms-MY', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { value: 'ar-SA', label: 'العربية', flag: '🇸🇦' },
  { value: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { value: 'ko-KR', label: '한국어', flag: '🇰🇷' },
  { value: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { value: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
];

// 商品类目
export const CATEGORY_OPTIONS = [
  '美妆护肤',
  '服饰鞋包',
  '数码电子',
  '食品零食',
  '家居日用',
  '母婴用品',
  '运动户外',
  '图书文具',
  '珠宝饰品',
  '汽配工具',
  '其他',
];
