// UGC 视频生成工具类型定义

// UGC 风格基础类型（用于兼容）
export type UGCStyle = 'unboxing' | 'usage' | 'comparison' | 'story' | 'voiceover' | 'tutorial' | 'testimonial' | 'asmr';

// 风格选择模式
export type StyleMode = 
  | 'preset'       // 预设风格（经典风格）
  | 'ai-recommend' // AI推荐
  | 'custom'       // 自定义描述
  | 'random';      // 随机变换

// 风格标签分类
export interface StyleTag {
  id: string;
  name: string;
  icon: string;
}

// 风格标签配置
export const STYLE_TAGS: StyleTag[] = [
  // 叙事风格
  { id: 'story', name: '叙事', icon: '📖' },
  { id: 'humor', name: '幽默', icon: '😄' },
  { id: 'emotional', name: '情感', icon: '💕' },
  { id: 'inspiring', name: '励志', icon: '💪' },
  { id: 'mystery', name: '悬疑', icon: '🔮' },
  { id: 'warm', name: '温情', icon: '🌡️' },
  
  // 表现风格
  { id: 'direct', name: '口播', icon: '🎤' },
  { id: 'showcase', name: '展示', icon: '👁️' },
  { id: 'compare', name: '对比', icon: '⚖️' },
  { id: 'review', name: '评测', icon: '📊' },
  { id: 'tutorial', name: '教程', icon: '📚' },
  { id: 'immerse', name: '沉浸', icon: '🎭' },
  
  // 视觉风格
  { id: 'premium', name: '高级感', icon: '✨' },
  { id: 'casual', name: '接地气', icon: '🏡' },
  { id: 'aesthetic', name: '唯美', icon: '🌸' },
  { id: 'authentic', name: '真实', icon: '📷' },
  { id: 'tech', name: '科技感', icon: '🤖' },
  { id: 'vintage', name: '复古', icon: '📼' },
  
  // 节奏风格
  { id: 'fast', name: '快节奏', icon: '⚡' },
  { id: 'slow', name: '慢节奏', icon: '🐢' },
  { id: 'rhythmic', name: '律动', icon: '🎵' },
  { id: 'calm', name: '舒缓', icon: '🧘' },
  { id: 'intense', name: '紧张', icon: '🔥' },
  { id: 'relaxed', name: '轻松', icon: '☁️' },
  
  // 场景风格
  { id: 'lifestyle', name: '生活化', icon: '🏠' },
  { id: 'studio', name: '棚拍', icon: '🎬' },
  { id: 'outdoor', name: '户外', icon: '🏔️' },
  { id: 'indoor', name: '室内', icon: '🛋️' },
  { id: 'workplace', name: '职场', icon: '💼' },
  { id: 'festival', name: '节日', icon: '🎉' },
];

// 预设风格配置
export interface StylePreset {
  value: string;
  label: string;
  description: string;
  icon: string;
  tags: string[];     // 关联的标签
  color: string;     // 渐变色
  prompt: string;     // 默认提示词
  category: string;   // 分类
}

// 预设风格选项（50+种，覆盖各种场景）
export const STYLE_PRESETS: StylePreset[] = [
  // ============ 经典风格 ============
  { 
    value: 'unboxing', 
    label: '开箱测评', 
    description: '从拆快递开始的沉浸式体验',
    icon: '📦',
    tags: ['story', 'showcase', 'authentic', 'immerse'],
    color: 'from-amber-500 to-orange-600',
    prompt: '开箱展示产品外观，介绍包装细节，分享第一感受',
    category: 'classic'
  },
  { 
    value: 'usage', 
    label: '使用分享', 
    description: '真实使用场景展示',
    icon: '🎯',
    tags: ['showcase', 'authentic', 'lifestyle'],
    color: 'from-blue-500 to-cyan-600',
    prompt: '展示产品在真实场景中的使用过程，突出实用性和便捷性',
    category: 'classic'
  },
  { 
    value: 'comparison', 
    label: '对比测评', 
    description: '多产品对比分析',
    icon: '⚖️',
    tags: ['compare', 'review', 'authentic', 'tech'],
    color: 'from-purple-500 to-violet-600',
    prompt: '对比多个产品或新旧版本，突出差异和优劣',
    category: 'classic'
  },
  { 
    value: 'story', 
    label: '剧情植入', 
    description: '融入生活故事场景',
    icon: '🎬',
    tags: ['story', 'emotional', 'warm', 'lifestyle'],
    color: 'from-pink-500 to-rose-600',
    prompt: '将产品自然融入生活场景，通过故事传递产品价值',
    category: 'classic'
  },
  { 
    value: 'voiceover', 
    label: '口播讲解', 
    description: '类似直播带货风格',
    icon: '🎤',
    tags: ['direct', 'fast', 'rhythmic'],
    color: 'from-red-500 to-pink-600',
    prompt: '直接面对镜头讲解产品卖点，语气热情有感染力',
    category: 'classic'
  },
  { 
    value: 'tutorial', 
    label: '教程教学', 
    description: 'step by step详细讲解',
    icon: '📚',
    tags: ['tutorial', 'slow', 'calm', 'studio'],
    color: 'from-emerald-500 to-teal-600',
    prompt: '分步骤详细讲解，从入门到精通，适合复杂产品',
    category: 'classic'
  },
  { 
    value: 'testimonial', 
    label: '买家秀/评价', 
    description: '真实用户反馈展示',
    icon: '💬',
    tags: ['authentic', 'warm', 'lifestyle'],
    color: 'from-indigo-500 to-blue-600',
    prompt: '展示真实用户的使用反馈和评价，增强可信度',
    category: 'classic'
  },
  { 
    value: 'asmr', 
    label: 'ASMR感官', 
    description: '沉浸式感官体验',
    icon: '✨',
    tags: ['immerse', 'slow', 'calm', 'aesthetic'],
    color: 'from-violet-500 to-purple-600',
    prompt: '通过声音和画面营造沉浸式感官体验，突出产品细节',
    category: 'classic'
  },
  
  // ============ 热门风格 ============
  { 
    value: 'day-in-life', 
    label: '一天生活', 
    description: '记录一整天的产品使用',
    icon: '🌅',
    tags: ['story', 'lifestyle', 'authentic', 'slow'],
    color: 'from-sky-500 to-blue-600',
    prompt: '跟随镜头记录一整天中产品带来的改变和体验',
    category: 'hot'
  },
  { 
    value: 'transformation', 
    label: '前后对比', 
    description: '使用前后的明显变化',
    icon: '🔄',
    tags: ['compare', 'story', 'intense', 'fast'],
    color: 'from-green-500 to-emerald-600',
    prompt: '展示使用产品前后的明显对比变化，直击痛点',
    category: 'hot'
  },
  { 
    value: 'challenge', 
    label: '挑战/测评', 
    description: '趣味挑战或极限测试',
    icon: '🏆',
    tags: ['humor', 'story', 'intense', 'fast'],
    color: 'from-orange-500 to-red-600',
    prompt: '通过趣味挑战或极限测试展示产品性能',
    category: 'hot'
  },
  { 
    value: 'q&a', 
    label: '问答解惑', 
    description: '解答常见问题',
    icon: '❓',
    tags: ['direct', 'tutorial', 'relaxed'],
    color: 'from-teal-500 to-cyan-600',
    prompt: '以问答形式解答用户最关心的产品问题',
    category: 'hot'
  },
  { 
    value: 'behind-scenes', 
    label: '幕后揭秘', 
    description: '展示产品背后的故事',
    icon: '🎥',
    tags: ['story', 'authentic', 'premium'],
    color: 'from-gray-600 to-gray-800',
    prompt: '揭秘产品生产过程或设计理念，增加产品价值感',
    category: 'hot'
  },
  { 
    value: 'couple', 
    label: '情侣/闺蜜', 
    description: '双人或多人出镜',
    icon: '👫',
    tags: ['humor', 'warm', 'story', 'lifestyle'],
    color: 'from-pink-400 to-rose-500',
    prompt: '情侣或闺蜜互动形式，增加亲和力和趣味性',
    category: 'hot'
  },
  { 
    value: 'family', 
    label: '家庭场景', 
    description: '全家适用的温馨感',
    icon: '👨‍👩‍👧‍👦',
    tags: ['warm', 'story', 'lifestyle', 'authentic'],
    color: 'from-yellow-500 to-amber-600',
    prompt: '展示产品适合全家使用的温馨场景',
    category: 'hot'
  },
  { 
    value: 'product-focus', 
    label: '产品特写', 
    description: '精致的产品展示',
    icon: '🔍',
    tags: ['showcase', 'premium', 'aesthetic', 'slow'],
    color: 'from-zinc-500 to-stone-600',
    prompt: '通过精致特写和运镜展示产品的每一个细节',
    category: 'hot'
  },
  
  // ============ 叙事风格 ============
  { 
    value: 'vlog', 
    label: 'Vlog风格', 
    description: '第一视角生活记录',
    icon: '📹',
    tags: ['story', 'authentic', 'lifestyle', 'relaxed'],
    color: 'from-blue-400 to-indigo-600',
    prompt: '以第一视角记录生活，产品自然融入vlog场景',
    category: 'narrative'
  },
  { 
    value: 'documentary', 
    label: '纪录片', 
    description: '有深度的内容讲述',
    icon: '🎙️',
    tags: ['story', 'authentic', 'slow', 'tech'],
    color: 'from-slate-600 to-zinc-700',
    prompt: '以纪录片风格深入讲述产品背后的故事和价值',
    category: 'narrative'
  },
  { 
    value: 'talk-show', 
    label: '访谈/分享', 
    description: '个人经验分享',
    icon: '🗣️',
    tags: ['direct', 'authentic', 'warm', 'relaxed'],
    color: 'from-amber-500 to-yellow-600',
    prompt: '以过来人身份分享真实使用经验和心得',
    category: 'narrative'
  },
  { 
    value: 'mini-drama', 
    label: '迷你短剧', 
    description: '有剧情的短故事',
    icon: '🎭',
    tags: ['story', 'humor', 'intense', 'mystery'],
    color: 'from-purple-600 to-pink-600',
    prompt: '通过小剧情展示产品如何解决生活中的问题',
    category: 'narrative'
  },
  { 
    value: 'testimonial-story', 
    label: '用户故事', 
    description: '真实用户的改变故事',
    icon: '📝',
    tags: ['story', 'emotional', 'warm', 'authentic'],
    color: 'from-rose-500 to-red-600',
    prompt: '讲述真实用户使用产品后带来的积极改变',
    category: 'narrative'
  },
  
  // ============ 视觉风格 ============
  { 
    value: 'cinematic', 
    label: '电影感', 
    description: '电影级画面质感',
    icon: '🎬',
    tags: ['premium', 'slow', 'aesthetic', 'studio'],
    color: 'from-gray-700 to-gray-900',
    prompt: '电影级构图和色调，营造高级视觉体验',
    category: 'visual'
  },
  { 
    value: 'clean-minimal', 
    label: '简约干净', 
    description: '简洁的白色系背景',
    icon: '⬜',
    tags: ['premium', 'slow', 'showcase', 'studio'],
    color: 'from-gray-200 to-gray-400',
    prompt: '简洁干净的画面，突出产品本身的质感',
    category: 'visual'
  },
  { 
    value: 'vibrant', 
    label: '活力色彩', 
    description: '高饱和度明亮色调',
    icon: '🌈',
    tags: ['humor', 'fast', 'rhythmic', 'premium'],
    color: 'from-pink-500 to-orange-500',
    prompt: '高饱和度明亮色调，充满活力和青春感',
    category: 'visual'
  },
  { 
    value: 'moody', 
    label: '氛围感', 
    description: '暗色调有氛围',
    icon: '🌙',
    tags: ['premium', 'slow', 'aesthetic', 'mystery'],
    color: 'from-gray-800 to-purple-900',
    prompt: '暗色调营造神秘高级氛围，增强产品神秘感',
    category: 'visual'
  },
  { 
    value: 'warm-light', 
    label: '暖光风格', 
    description: '温暖的暖色调',
    icon: '☀️',
    tags: ['warm', 'slow', 'authentic', 'lifestyle'],
    color: 'from-orange-400 to-yellow-500',
    prompt: '温暖的暖色调营造舒适亲切的氛围',
    category: 'visual'
  },
  { 
    value: 'cool-tone', 
    label: '冷色调', 
    description: '清爽的冷色调',
    icon: '❄️',
    tags: ['tech', 'premium', 'slow', 'aesthetic'],
    color: 'from-blue-400 to-cyan-500',
    prompt: '清爽冷色调营造科技感和专业感',
    category: 'visual'
  },
  { 
    value: 'nature', 
    label: '自然清新', 
    description: '户外自然环境',
    icon: '🌿',
    tags: ['authentic', 'slow', 'relaxed', 'outdoor'],
    color: 'from-green-400 to-emerald-500',
    prompt: '在自然环境中展示产品，清新自然的感觉',
    category: 'visual'
  },
  { 
    value: 'retro', 
    label: '复古怀旧', 
    description: '80s/90s复古风格',
    icon: '📼',
    tags: ['vintage', 'humor', 'story', 'relaxed'],
    color: 'from-amber-600 to-orange-700',
    prompt: '复古滤镜和配乐，唤起怀旧情感',
    category: 'visual'
  },
  
  // ============ 节奏风格 ============
  { 
    value: 'action-packed', 
    label: '快节奏剪辑', 
    description: '快速切换高能剪辑',
    icon: '⚡',
    tags: ['fast', 'intense', 'rhythmic', 'humor'],
    color: 'from-red-600 to-orange-600',
    prompt: '快节奏剪辑，配合动感音乐，保持高能输出',
    category: 'rhythm'
  },
  { 
    value: 'meditation', 
    label: '慢冥想式', 
    description: '极慢节奏舒缓放松',
    icon: '🧘',
    tags: ['slow', 'calm', 'relaxed', 'aesthetic'],
    color: 'from-purple-300 to-indigo-400',
    prompt: '极慢的节奏，配合舒缓音乐，放松治愈感',
    category: 'rhythm'
  },
  { 
    value: 'asmr-detail', 
    label: 'ASMR细节', 
    description: '声音和触感的极致',
    icon: '👂',
    tags: ['immerse', 'slow', 'calm', 'showcase'],
    color: 'from-cyan-400 to-blue-500',
    prompt: '通过高质量的音效和特写展示产品细节质感',
    category: 'rhythm'
  },
  { 
    value: 'beat-sync', 
    label: '卡点节奏', 
    description: '跟音乐节拍同步',
    icon: '🎵',
    tags: ['rhythmic', 'fast', 'intense', 'humor'],
    color: 'from-fuchsia-500 to-pink-600',
    prompt: '所有画面和转场与音乐节拍完美同步',
    category: 'rhythm'
  },
  
  // ============ 专业风格 ============
  { 
    value: 'professional', 
    label: '专业评测', 
    description: '专业客观的评测',
    icon: '📋',
    tags: ['review', 'compare', 'tech', 'authentic'],
    color: 'from-slate-600 to-blue-700',
    prompt: '专业客观的数据评测，建立权威可信形象',
    category: 'professional'
  },
  { 
    value: 'expert-tips', 
    label: '专家支招', 
    description: '专业人士的建议',
    icon: '🎓',
    tags: ['tutorial', 'direct', 'relaxed', 'tech'],
    color: 'from-emerald-600 to-teal-700',
    prompt: '以行业专家身份分享专业知识和选购建议',
    category: 'professional'
  },
  { 
    value: 'unboxing-pro', 
    label: '专业开箱', 
    description: '详尽的产品介绍',
    icon: '🔦',
    tags: ['unboxing', 'showcase', 'tutorial', 'slow'],
    color: 'from-yellow-600 to-amber-700',
    prompt: '从开箱到深度体验，全面详尽的产品介绍',
    category: 'professional'
  },
  { 
    value: 'haul', 
    label: '购物分享', 
    description: '购物成果展示',
    icon: '🛍️',
    tags: ['humor', 'story', 'fast', 'lifestyle'],
    color: 'from-rose-400 to-pink-500',
    prompt: '分享购物心得和成果，推荐值得买的好物',
    category: 'professional'
  },
  
  // ============ 特色风格 ============
  { 
    value: 'asmr-cozy', 
    label: '治愈生活', 
    description: '舒适温馨的生活感',
    icon: '🏡',
    tags: ['calm', 'relaxed', 'lifestyle', 'warm'],
    color: 'from-amber-300 to-yellow-400',
    prompt: '营造舒适温馨的生活氛围，治愈感满满',
    category: 'special'
  },
  { 
    value: 'mukbang', 
    label: '吃播风格', 
    description: '食品类专用风格',
    icon: '🍽️',
    tags: ['showcase', 'humor', 'authentic', 'fast'],
    color: 'from-red-500 to-orange-500',
    prompt: '以吃播形式展示食品的色香味',
    category: 'special'
  },
  { 
    value: 'try-on', 
    label: '试穿试戴', 
    description: '穿戴类展示',
    icon: '👗',
    tags: ['showcase', 'story', 'fast', 'lifestyle'],
    color: 'from-pink-500 to-rose-500',
    prompt: '多角度展示穿戴效果，搭配建议',
    category: 'special'
  },
  { 
    value: 'before-after', 
    label: '前后反差', 
    description: '强烈的前后对比',
    icon: '🔀',
    tags: ['compare', 'intense', 'story', 'fast'],
    color: 'from-green-600 to-emerald-700',
    prompt: '强烈的视觉对比，展示惊人改变效果',
    category: 'special'
  },
  { 
    value: 'day-1-vs-day-30', 
    label: '30天挑战', 
    description: '长期使用记录',
    icon: '📅',
    tags: ['story', 'authentic', 'slow', 'review'],
    color: 'from-blue-600 to-indigo-700',
    prompt: '记录30天持续使用产品的变化过程',
    category: 'special'
  },
  { 
    value: 'unpopular-opinion', 
    label: '反常识观点', 
    description: '颠覆认知的内容',
    icon: '🤯',
    tags: ['humor', 'direct', 'intense', 'tech'],
    color: 'from-violet-600 to-purple-700',
    prompt: '以反常识的观点吸引眼球，再给出合理解释',
    category: 'special'
  },
  { 
    value: 'sibling-teasing', 
    label: '闺蜜吐槽', 
    description: '闺蜜互怼风格',
    icon: '😜',
    tags: ['humor', 'story', 'fast', 'warm'],
    color: 'from-pink-300 to-rose-400',
    prompt: '闺蜜互怼的有趣互动，自然植入产品',
    category: 'special'
  },
  { 
    value: 'minimal-text', 
    label: '极简文字', 
    description: '字幕为主画面为辅',
    icon: '💬',
    tags: ['premium', 'slow', 'showcase', 'aesthetic'],
    color: 'from-gray-300 to-gray-500',
    prompt: '以字幕为主要信息，画面简洁有力',
    category: 'special'
  },
  
  // ============ 场景风格 ============
  { 
    value: 'office-lunch', 
    label: '办公室午休', 
    description: '办公场景生活化',
    icon: '💼',
    tags: ['lifestyle', 'humor', 'relaxed', 'authentic'],
    color: 'from-sky-400 to-blue-500',
    prompt: '在办公室场景中展示产品融入日常工作',
    category: 'scene'
  },
  { 
    value: 'travel', 
    label: '旅行必备', 
    description: '旅行中的好物',
    icon: '✈️',
    tags: ['lifestyle', 'story', 'outdoor', 'relaxed'],
    color: 'from-teal-400 to-cyan-500',
    prompt: '旅行场景中展示产品的便携和实用',
    category: 'scene'
  },
  { 
    value: 'festival-gift', 
    label: '节日送礼', 
    description: '节日礼品推荐',
    icon: '🎁',
    tags: ['warm', 'story', 'lifestyle', 'premium'],
    color: 'from-red-500 to-pink-600',
    prompt: '节日送礼场景，强调礼物的心意和价值',
    category: 'scene'
  },
  { 
    value: 'fitness', 
    label: '健身运动', 
    description: '运动健身场景',
    icon: '💪',
    tags: ['intense', 'fast', 'lifestyle', 'authentic'],
    color: 'from-orange-600 to-red-600',
    prompt: '运动健身场景，展示产品性能',
    category: 'scene'
  },
  { 
    value: 'cooking', 
    label: '下厨做饭', 
    description: '厨房烹饪场景',
    icon: '🍳',
    tags: ['lifestyle', 'showcase', 'relaxed', 'authentic'],
    color: 'from-yellow-500 to-orange-500',
    prompt: '烹饪场景中展示产品的实用便捷',
    category: 'scene'
  },
  { 
    value: 'skincare-routine', 
    label: '护肤routine', 
    description: '护肤步骤展示',
    icon: '🧴',
    tags: ['tutorial', 'slow', 'relaxed', 'showcase'],
    color: 'from-pink-400 to-rose-500',
    prompt: '展示完整的护肤步骤和使用方法',
    category: 'scene'
  },
  { 
    value: 'study-work', 
    label: '学习工作', 
    description: '效率工具推荐',
    icon: '📚',
    tags: ['tutorial', 'relaxed', 'lifestyle', 'tech'],
    color: 'from-blue-500 to-indigo-600',
    prompt: '学习工作场景，提升效率的好物推荐',
    category: 'scene'
  },
  { 
    value: 'pet-life', 
    label: '萌宠日常', 
    description: '宠物相关好物',
    icon: '🐾',
    tags: ['humor', 'story', 'warm', 'lifestyle'],
    color: 'from-amber-400 to-yellow-500',
    prompt: '萌宠互动中自然植入宠物用品',
    category: 'scene'
  },
  
  // ============ 新兴风格 ============
  { 
    value: 'ai-generated', 
    label: 'AI生成风', 
    description: 'AI风格化特效',
    icon: '🤖',
    tags: ['tech', 'fast', 'premium', 'mystery'],
    color: 'from-cyan-500 to-blue-600',
    prompt: 'AI生成的视觉特效，科幻未来感',
    category: 'trending'
  },
  { 
    value: 'lo-fi', 
    label: 'Lo-Fi风格', 
    description: '低保真复古感',
    icon: '📻',
    tags: ['vintage', 'relaxed', 'slow', 'humor'],
    color: 'from-stone-500 to-amber-600',
    prompt: 'Lo-Fi音乐和画面，轻松随意的感觉',
    category: 'trending'
  },
  { 
    value: 'handwritten', 
    label: '手写涂鸦', 
    description: '手写风格字幕',
    icon: '✍️',
    tags: ['casual', 'relaxed', 'humor', 'authentic'],
    color: 'from-pink-300 to-purple-400',
    prompt: '手写涂鸦字幕，亲切随意接地气',
    category: 'trending'
  },
  { 
    value: 'green-screen', 
    label: '抠像特效', 
    description: '创意抠像场景',
    icon: '🟢',
    tags: ['tech', 'humor', 'fast', 'premium'],
    color: 'from-lime-500 to-green-600',
    prompt: '创意绿幕特效，天马行空的想象力',
    category: 'trending'
  },
  { 
    value: 'duet-react', 
    label: 'reaction', 
    description: '反应类视频',
    icon: '😮',
    tags: ['humor', 'story', 'fast', 'authentic'],
    color: 'from-yellow-400 to-orange-500',
    prompt: '对产品或现象的真实反应，有感染力',
    category: 'trending'
  },
  { 
    value: 'day-in-my-bag', 
    label: '包中好物', 
    description: '随身物品展示',
    icon: '🎒',
    tags: ['showcase', 'lifestyle', 'relaxed', 'authentic'],
    color: 'from-rose-300 to-pink-400',
    prompt: '展示随身携带的好物，贴近生活',
    category: 'trending'
  },
  { 
    value: 'sensory', 
    label: '五感体验', 
    description: '调动五感的体验',
    icon: '👅',
    tags: ['immerse', 'slow', 'calm', 'showcase'],
    color: 'from-violet-400 to-purple-500',
    prompt: '通过视觉听觉嗅觉味觉触觉全面展示产品',
    category: 'trending'
  },
  { 
    value: 'hypnothic', 
    label: '催眠ASMR', 
    description: '助眠放松风格',
    icon: '😴',
    tags: ['calm', 'relaxed', 'slow', 'aesthetic'],
    color: 'from-indigo-300 to-purple-400',
    prompt: '轻柔的语速和画面，帮助放松助眠',
    category: 'trending'
  },
];

// 按分类获取预设风格
export const getStylesByCategory = (category: string): StylePreset[] => {
  return STYLE_PRESETS.filter(s => s.category === category);
};

// 获取分类列表
export const STYLE_CATEGORIES = [
  { id: 'classic', name: '经典风格', icon: '⭐' },
  { id: 'hot', name: '热门风格', icon: '🔥' },
  { id: 'narrative', name: '叙事风格', icon: '📖' },
  { id: 'visual', name: '视觉风格', icon: '🎨' },
  { id: 'rhythm', name: '节奏风格', icon: '🎵' },
  { id: 'professional', name: '专业风格', icon: '📋' },
  { id: 'special', name: '特色风格', icon: '💡' },
  { id: 'scene', name: '场景风格', icon: '🏠' },
  { id: 'trending', name: '新兴风格', icon: '🚀' },
];

// 视频比例
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

// 视频生成模型
export type VideoModel = 
  | 'veo3'           // Google Veo 3.1
  | 'jimeng'         // 即梦
  | 'seedance'       // Seedance
  | 'kling'          // 可灵
  | 'runway'         // Runway Gen-3
  | 'pika'           // Pika
  | 'sora'           // Sora
  | 'luma'           // Luma Dream Machine
  | 'stable_video'   // Stable Video
  | 'cogvideo'       // CogVideoX
  | 'minimax'        // Minimax
  | '逐梦';           // 逐梦

// 目标语言（128种，覆盖全球主要语言和地区变体）
export type Language = 
  // 中文变体
  | 'zh-CN' | 'zh-TW' | 'zh-HK' | 'zh-SG' | 'zh-MO' | 'yue-CN'
  // 英语变体
  | 'en-US' | 'en-GB' | 'en-AU' | 'en-CA' | 'en-IN' | 'en-NZ' | 'en-SG' | 'en-IE' | 'en-ZA' | 'en-NG' | 'en-KENYA' | 'en-GHANA'
  // 西班牙语变体
  | 'es-ES' | 'es-MX' | 'es-AR' | 'es-CO' | 'es-CL' | 'es-PE' | 'es-VE' | 'es-BO' | 'es-CU' | 'es-DO' | 'es-EC' | 'es-GT' | 'es-HN' | 'es-NI' | 'es-PA' | 'es-PY' | 'es-SV' | 'es-UY' | 'es-PR' | 'es-CR'
  // 葡萄牙语变体
  | 'pt-BR' | 'pt-PT' | 'pt-AO' | 'pt-MZ' | 'pt-CaboVerde' | 'pt-GuineaBissau' | 'pt-Macau' | 'pt-Timor'
  // 法语变体
  | 'fr-FR' | 'fr-CA' | 'fr-BE' | 'fr-CH' | 'fr-LU' | 'fr-MC' | 'fr-AO' | 'fr-SN' | 'fr-CI' | 'fr-Mali' | 'fr-BurkinaFaso' | 'fr-Benin' | 'fr-Togo' | 'fr-Niger' | 'fr-Cameroon' | 'fr-Congo' | 'fr-Gabon' | 'fr-Madagascar' | 'fr-Haiti' | 'fr-BurkinaFaso'
  // 德语变体
  | 'de-DE' | 'de-AT' | 'de-CH' | 'de-LU' | 'de-LI'
  // 意大利语变体
  | 'it-IT' | 'it-CH' | 'it-SM'
  // 俄语变体
  | 'ru-RU' | 'ru-BY' | 'ru-KZ' | 'ru-KG' | 'ru-TJ' | 'ru-UA'
  // 阿拉伯语变体
  | 'ar-SA' | 'ar-AE' | 'ar-EG' | 'ar-MA' | 'ar-IQ' | 'ar-JO' | 'ar-LB' | 'ar-SY' | 'ar-DZ' | 'ar-TN' | 'ar-LY' | 'ar-YE' | 'ar-SD' | 'ar-SO' | 'ar-KW' | 'ar-QA' | 'ar-BH' | 'ar-OM' | 'ar-PS' | 'ar-MR' | 'ar-DJ' | 'ar-ER' | 'ar-SS' | 'ar-TD' | 'ar-LBY'
  // 日韩语言
  | 'ja-JP' | 'ko-KR'
  // 东南亚语言
  | 'vi-VN' | 'th-TH' | 'ms-MY' | 'id-ID' | 'fil-PH' | 'km-KH' | 'lo-LA' | 'my-MM'
  // 南亚语言
  | 'bn-BD' | 'hi-IN' | 'ta-IN' | 'te-IN' | 'mr-IN' | 'gu-IN' | 'pa-IN' | 'ml-IN' | 'kn-IN' | 'or-IN' | 'as-IN' | 'ne-NP' | 'si-LK' | 'dz-BT'
  // 中西亚语言
  | 'ur-PK' | 'ps-AF' | 'fa-IR' | 'ku-TR' | 'he-IL' | 'tr-TR' | 'az-AZ' | 'kk-KZ' | 'uz-UZ' | 'tk-TM' | 'ky-KG' | 'tg-TJ'
  // 欧洲语言
  | 'nl-NL' | 'nl-BE' | 'sv-SE' | 'no-NO' | 'da-DK' | 'fi-FI' | 'el-GR' | 'cs-CZ' | 'sk-SK' | 'hu-HU' | 'ro-RO' | 'bg-BG' | 'hr-HR' | 'sl-SI' | 'sr-RS' | 'bs-BA' | 'mk-MK' | 'sq-AL' | 'et-EE' | 'lv-LV' | 'lt-LT' | 'is-IS' | 'mt-MT' | 'cy-GB' | 'ga-IE' | 'gd-GB'
  // 非洲语言
  | 'sw-TZ' | 'sw-KE' | 'sw-UG' | 'yo-NG' | 'ig-NG' | 'ha-NG' | 'zu-ZA' | 'xh-ZA' | 'af-ZA' | 'am-ET' | 'sn-ZW' | 'rw-RW' | 'ln-CD' | 'ti-ER' | 'ff-NE' | 'so-SO'
  // 大洋洲语言
  | 'mi-NZ' | 'sm-WS' | 'to-TO' | 'fj-FJ'
  // 美洲语言
  | 'qu-PE' | 'qu-BO' | 'ay-BO' | 'gn-PY'
  // 辅助语言
  | 'la-VA' | 'eo-UN' | 'ia-UN' | 'ht-HT';

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
  style: StylePreset | null;
  styleMode: StyleMode;
  styleCustomPrompt?: string;
  styleTags?: string[];
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
  style?: StylePreset;
  styleMode?: StyleMode;
  styleCustomPrompt?: string;
  styleTags?: string[];
  duration: number;
  videoModel?: VideoModel;
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
  style?: StylePreset;
  styleMode: StyleMode;
  styleCustomPrompt?: string;
  styleTags?: string[];
  duration: number;
  videoModel?: VideoModel;
  language?: Language;
  aspectRatio?: AspectRatio;
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

// UGC 风格选项（兼容旧代码）
export const UGC_STYLE_OPTIONS: { value: UGCStyle; label: string; description: string; icon: string; color: string }[] = [
  { value: 'unboxing', label: '开箱测评', description: '从拆快递开始的沉浸式体验', icon: '📦', color: 'from-amber-500 to-orange-600' },
  { value: 'usage', label: '使用分享', description: '真实使用场景展示', icon: '🎯', color: 'from-blue-500 to-cyan-600' },
  { value: 'comparison', label: '对比测评', description: '多产品对比分析', icon: '⚖️', color: 'from-purple-500 to-violet-600' },
  { value: 'story', label: '剧情植入', description: '融入生活故事场景', icon: '🎬', color: 'from-pink-500 to-rose-600' },
  { value: 'voiceover', label: '口播讲解', description: '类似直播带货风格', icon: '🎤', color: 'from-red-500 to-pink-600' },
  { value: 'tutorial', label: '教程教学', description: 'step by step详细讲解', icon: '📚', color: 'from-emerald-500 to-teal-600' },
  { value: 'testimonial', label: '买家秀/评价', description: '真实用户反馈展示', icon: '💬', color: 'from-indigo-500 to-blue-600' },
  { value: 'asmr', label: 'ASMR感官', description: '沉浸式感官体验', icon: '✨', color: 'from-violet-500 to-purple-600' },
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

// 语言选项（128种语言，覆盖全球主要语言和地区变体）
export const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  // 🇨🇳 中文变体
  { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { value: 'zh-TW', label: '繁體中文（台灣）', flag: '🇹🇼' },
  { value: 'zh-HK', label: '繁體中文（香港）', flag: '🇭🇰' },
  { value: 'zh-SG', label: '简体中文（新加坡）', flag: '🇸🇬' },
  { value: 'zh-MO', label: '繁體中文（澳門）', flag: '🇲🇴' },
  { value: 'yue-CN', label: '粵語', flag: '🇭🇰' },
  
  // 🇺🇸🇬🇧🇦🇺🇨🇦🇮🇳 英语变体
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { value: 'en-AU', label: 'English (Australia)', flag: '🇦🇺' },
  { value: 'en-CA', label: 'English (Canada)', flag: '🇨🇦' },
  { value: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { value: 'en-NZ', label: 'English (New Zealand)', flag: '🇳🇿' },
  { value: 'en-SG', label: 'English (Singapore)', flag: '🇸🇬' },
  { value: 'en-IE', label: 'English (Ireland)', flag: '🇮🇪' },
  { value: 'en-ZA', label: 'English (South Africa)', flag: '🇿🇦' },
  { value: 'en-NG', label: 'English (Nigeria)', flag: '🇳🇬' },
  { value: 'en-KENYA', label: 'English (Kenya)', flag: '🇰🇪' },
  { value: 'en-GHANA', label: 'English (Ghana)', flag: '🇬🇭' },
  
  // 🇪🇸🇲🇽🇦🇷 西班牙语变体
  { value: 'es-ES', label: 'Español (España)', flag: '🇪🇸' },
  { value: 'es-MX', label: 'Español (México)', flag: '🇲🇽' },
  { value: 'es-AR', label: 'Español (Argentina)', flag: '🇦🇷' },
  { value: 'es-CO', label: 'Español (Colombia)', flag: '🇨🇴' },
  { value: 'es-CL', label: 'Español (Chile)', flag: '🇨🇱' },
  { value: 'es-PE', label: 'Español (Perú)', flag: '🇵🇪' },
  { value: 'es-VE', label: 'Español (Venezuela)', flag: '🇻🇪' },
  { value: 'es-BO', label: 'Español (Bolivia)', flag: '🇧🇴' },
  { value: 'es-CU', label: 'Español (Cuba)', flag: '🇨🇺' },
  { value: 'es-DO', label: 'Español (Rep. Dominicana)', flag: '🇩🇴' },
  { value: 'es-EC', label: 'Español (Ecuador)', flag: '🇪🇨' },
  { value: 'es-GT', label: 'Español (Guatemala)', flag: '🇬🇹' },
  { value: 'es-HN', label: 'Español (Honduras)', flag: '🇭🇳' },
  { value: 'es-NI', label: 'Español (Nicaragua)', flag: '🇳🇮' },
  { value: 'es-PA', label: 'Español (Panamá)', flag: '🇵🇦' },
  { value: 'es-PY', label: 'Español (Paraguay)', flag: '🇵🇾' },
  { value: 'es-SV', label: 'Español (El Salvador)', flag: '🇸🇻' },
  { value: 'es-UY', label: 'Español (Uruguay)', flag: '🇺🇾' },
  { value: 'es-PR', label: 'Español (Puerto Rico)', flag: '🇵🇷' },
  { value: 'es-CR', label: 'Español (Costa Rica)', flag: '🇨🇷' },
  
  // 🇧🇷🇵🇹🇦🇴🇲🇿 葡萄牙语变体
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'pt-PT', label: 'Português (Portugal)', flag: '🇵🇹' },
  { value: 'pt-AO', label: 'Português (Angola)', flag: '🇦🇴' },
  { value: 'pt-MZ', label: 'Português (Moçambique)', flag: '🇲🇿' },
  { value: 'pt-CaboVerde', label: 'Português (Cabo Verde)', flag: '🇨🇻' },
  { value: 'pt-GuineaBissau', label: 'Português (Guiné-Bissau)', flag: '🇬🇼' },
  { value: 'pt-Macau', label: 'Português (Macau)', flag: '🇲🇴' },
  { value: 'pt-Timor', label: 'Português (Timor-Leste)', flag: '🇹🇱' },
  
  // 🇫🇷🇨🇦🇧🇪🇨🇭🇱🇺 法语变体
  { value: 'fr-FR', label: 'Français (France)', flag: '🇫🇷' },
  { value: 'fr-CA', label: 'Français (Canada)', flag: '🇨🇦' },
  { value: 'fr-BE', label: 'Français (Belgique)', flag: '🇧🇪' },
  { value: 'fr-CH', label: 'Français (Suisse)', flag: '🇨🇭' },
  { value: 'fr-LU', label: 'Français (Luxembourg)', flag: '🇱🇺' },
  { value: 'fr-MC', label: 'Français (Monaco)', flag: '🇲🇨' },
  { value: 'fr-AO', label: 'Français (Angola)', flag: '🇦🇴' },
  { value: 'fr-SN', label: 'Français (Sénégal)', flag: '🇸🇳' },
  { value: 'fr-CI', label: 'Français (Côte d\'Ivoire)', flag: '🇨🇮' },
  { value: 'fr-Mali', label: 'Français (Mali)', flag: '🇲🇱' },
  { value: 'fr-BurkinaFaso', label: 'Français (Burkina Faso)', flag: '🇧🇫' },
  { value: 'fr-Benin', label: 'Français (Bénin)', flag: '🇧🇯' },
  { value: 'fr-Togo', label: 'Français (Togo)', flag: '🇹🇬' },
  { value: 'fr-Niger', label: 'Français (Niger)', flag: '🇳🇪' },
  { value: 'fr-Cameroon', label: 'Français (Cameroun)', flag: '🇨🇲' },
  { value: 'fr-Congo', label: 'Français (Congo)', flag: '🇨🇬' },
  { value: 'fr-Gabon', label: 'Français (Gabon)', flag: '🇬🇦' },
  { value: 'fr-Madagascar', label: 'Français (Madagascar)', flag: '🇲🇬' },
  { value: 'fr-Haiti', label: 'Français (Haïti)', flag: '🇭🇹' },
  
  // 🇩🇪🇦🇹🇨🇭🇱🇺 德语变体
  { value: 'de-DE', label: 'Deutsch (Deutschland)', flag: '🇩🇪' },
  { value: 'de-AT', label: 'Deutsch (Österreich)', flag: '🇦🇹' },
  { value: 'de-CH', label: 'Deutsch (Schweiz)', flag: '🇨🇭' },
  { value: 'de-LU', label: 'Deutsch (Luxemburg)', flag: '🇱🇺' },
  { value: 'de-LI', label: 'Deutsch (Liechtenstein)', flag: '🇱🇮' },
  
  // 🇮🇹🇨🇭🇸🇲 意大利语变体
  { value: 'it-IT', label: 'Italiano (Italia)', flag: '🇮🇹' },
  { value: 'it-CH', label: 'Italiano (Svizzera)', flag: '🇨🇭' },
  { value: 'it-SM', label: 'Italiano (San Marino)', flag: '🇸🇲' },
  
  // 🇷🇺🇺🇦🇧🇾🇰🇿🇰🇬 俄语变体
  { value: 'ru-RU', label: 'Русский (Россия)', flag: '🇷🇺' },
  { value: 'ru-BY', label: 'Русский (Беларусь)', flag: '🇧🇾' },
  { value: 'ru-KZ', label: 'Русский (Казахстан)', flag: '🇰🇿' },
  { value: 'ru-KG', label: 'Русский (Кыргызстан)', flag: '🇰🇬' },
  { value: 'ru-TJ', label: 'Русский (Таджикистан)', flag: '🇹🇯' },
  { value: 'ru-UA', label: 'Русский (Украина)', flag: '🇺🇦' },
  
  // 🇸🇦🇦🇪🇪🇬🇲🇦🇮🇶🇯🇧 阿拉伯语变体
  { value: 'ar-SA', label: 'العربية (السعودية)', flag: '🇸🇦' },
  { value: 'ar-AE', label: 'العربية (الإمارات)', flag: '🇦🇪' },
  { value: 'ar-EG', label: 'العربية (مصر)', flag: '🇪🇬' },
  { value: 'ar-MA', label: 'العربية (المغرب)', flag: '🇲🇦' },
  { value: 'ar-IQ', label: 'العربية (العراق)', flag: '🇮🇶' },
  { value: 'ar-JO', label: 'العربية (الأردن)', flag: '🇯🇴' },
  { value: 'ar-LB', label: 'العربية (لبنان)', flag: '🇱🇧' },
  { value: 'ar-SY', label: 'العربية (سوريا)', flag: '🇸🇾' },
  { value: 'ar-DZ', label: 'العربية (الجزائر)', flag: '🇩🇿' },
  { value: 'ar-TN', label: 'العربية (تونس)', flag: '🇹🇳' },
  { value: 'ar-LY', label: 'العربية (ليبيا)', flag: '🇱🇾' },
  { value: 'ar-YE', label: 'العربية (اليمن)', flag: '🇾🇪' },
  { value: 'ar-SD', label: 'العربية (السودان)', flag: '🇸🇩' },
  { value: 'ar-SO', label: 'العربية (الصومال)', flag: '🇸🇴' },
  { value: 'ar-KW', label: 'العربية (الكويت)', flag: '🇰🇼' },
  { value: 'ar-QA', label: 'العربية (قطر)', flag: '🇶🇦' },
  { value: 'ar-BH', label: 'العربية (البحرين)', flag: '🇧🇭' },
  { value: 'ar-OM', label: 'العربية (عُمان)', flag: '🇴🇲' },
  { value: 'ar-PS', label: 'العربية (فلسطين)', flag: '🇵🇸' },
  { value: 'ar-MR', label: 'العربية (موريتانيا)', flag: '🇲🇷' },
  { value: 'ar-DJ', label: 'العربية (جيبوتي)', flag: '🇩🇯' },
  { value: 'ar-ER', label: 'العربية (إريتريا)', flag: '🇪🇷' },
  { value: 'ar-SS', label: 'العربية (جنوب السودان)', flag: '🇸🇸' },
  { value: 'ar-TD', label: 'العربية (تشاد)', flag: '🇹🇩' },
  { value: 'ar-LBY', label: 'العربية (ليبيا)', flag: '🇱🇾' },
  
  // 🇯🇵🇰🇷 日韩语言
  { value: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { value: 'ko-KR', label: '한국어', flag: '🇰🇷' },
  
  // 🇻🇳🇹🇭🇲🇾🇮🇩🇵🇭🇰🇭🇱🇦🇲🇲 东南亚语言
  { value: 'vi-VN', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'th-TH', label: 'ภาษาไทย', flag: '🇹🇭' },
  { value: 'ms-MY', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { value: 'id-ID', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { value: 'fil-PH', label: 'Filipino', flag: '🇵🇭' },
  { value: 'km-KH', label: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { value: 'lo-LA', label: 'ເພື່ອເຮັ່ງ', flag: '🇱🇦' },
  { value: 'my-MM', label: 'မြန်မာစာ', flag: '🇲🇲' },
  
  // 🇧🇩🇮🇳🇱🇰🇳🇵🇸🇱🇰🇧🇹 南亚语言
  { value: 'bn-BD', label: 'বাংলা', flag: '🇧🇩' },
  { value: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
  { value: 'ta-IN', label: 'தமிழ்', flag: '🇮🇳' },
  { value: 'te-IN', label: 'తెలుగు', flag: '🇮🇳' },
  { value: 'mr-IN', label: 'मराठी', flag: '🇮🇳' },
  { value: 'gu-IN', label: 'ગુજરાતી', flag: '🇮🇳' },
  { value: 'pa-IN', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { value: 'ml-IN', label: 'മലയാളം', flag: '🇮🇳' },
  { value: 'kn-IN', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { value: 'or-IN', label: 'ଓଡିଆ', flag: '🇮🇳' },
  { value: 'as-IN', label: 'অসমীয়া', flag: '🇮🇳' },
  { value: 'ne-NP', label: 'नेपाली', flag: '🇳🇵' },
  { value: 'si-LK', label: 'සිංහල', flag: '🇱🇰' },
  { value: 'dz-BT', label: 'རྫོང་ཁ', flag: '🇧🇹' },
  
  // 🇵🇰🇦🇫🇮🇷🇹🇷🇹🇱🇮🇱 中西亚语言
  { value: 'ur-PK', label: 'اردو', flag: '🇵🇰' },
  { value: 'ps-AF', label: 'پښتو', flag: '🇦🇫' },
  { value: 'fa-IR', label: 'فارسی', flag: '🇮🇷' },
  { value: 'ku-TR', label: 'Kurdî', flag: '🇹🇷' },
  { value: 'he-IL', label: 'עברית', flag: '🇮🇱' },
  { value: 'tr-TR', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'az-AZ', label: 'Azərbaycan dili', flag: '🇦🇿' },
  { value: 'kk-KZ', label: 'Қазақ тілі', flag: '🇰🇿' },
  { value: 'uz-UZ', label: 'O\'zbekcha', flag: '🇺🇿' },
  { value: 'tk-TM', label: 'Türkmen dili', flag: '🇹🇲' },
  { value: 'ky-KG', label: 'Кыргызча', flag: '🇰🇬' },
  { value: 'tg-TJ', label: 'Тоҷикӣ', flag: '🇹🇯' },
  
  // 🇳🇱🇸🇪🇳🇴🇩🇰🇫🇮🇬🇷🇨🇿🇵🇱🇭🇺🇷🇴🇧🇬🇭🇷 欧洲语言
  { value: 'nl-NL', label: 'Nederlands (Nederland)', flag: '🇳🇱' },
  { value: 'nl-BE', label: 'Nederlands (België)', flag: '🇧🇪' },
  { value: 'sv-SE', label: 'Svenska', flag: '🇸🇪' },
  { value: 'no-NO', label: 'Norsk', flag: '🇳🇴' },
  { value: 'da-DK', label: 'Dansk', flag: '🇩🇰' },
  { value: 'fi-FI', label: 'Suomi', flag: '🇫🇮' },
  { value: 'el-GR', label: 'Ελληνικά', flag: '🇬🇷' },
  { value: 'cs-CZ', label: 'Čeština', flag: '🇨🇿' },
  { value: 'sk-SK', label: 'Slovenčina', flag: '🇸🇰' },
  { value: 'hu-HU', label: 'Magyar', flag: '🇭🇺' },
  { value: 'ro-RO', label: 'Română', flag: '🇷🇴' },
  { value: 'bg-BG', label: 'Български', flag: '🇧🇬' },
  { value: 'hr-HR', label: 'Hrvatski', flag: '🇭🇷' },
  { value: 'sl-SI', label: 'Slovenščina', flag: '🇸🇮' },
  { value: 'sr-RS', label: 'Сrpски', flag: '🇷🇸' },
  { value: 'bs-BA', label: 'Bosanski', flag: '🇧🇦' },
  { value: 'mk-MK', label: 'Македонски', flag: '🇲🇰' },
  { value: 'sq-AL', label: 'Shqip', flag: '🇦🇱' },
  { value: 'et-EE', label: 'Eesti', flag: '🇪🇪' },
  { value: 'lv-LV', label: 'Latviešu', flag: '🇱🇻' },
  { value: 'lt-LT', label: 'Lietuvių', flag: '🇱🇹' },
  { value: 'is-IS', label: 'Íslenska', flag: '🇮🇸' },
  { value: 'mt-MT', label: 'Malti', flag: '🇲🇹' },
  { value: 'cy-GB', label: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { value: 'ga-IE', label: 'Gaeilge', flag: '🇮🇪' },
  { value: 'gd-GB', label: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  
  // 🇹🇿🇳🇬🇳🇦🇿🇦🇪🇹 非洲语言
  { value: 'sw-TZ', label: 'Kiswahili (Tanzania)', flag: '🇹🇿' },
  { value: 'sw-KE', label: 'Kiswahili (Kenya)', flag: '🇰🇪' },
  { value: 'sw-UG', label: 'Kiswahili (Uganda)', flag: '🇺🇬' },
  { value: 'yo-NG', label: 'Yorùbá', flag: '🇳🇬' },
  { value: 'ig-NG', label: 'Igbo', flag: '🇳🇬' },
  { value: 'ha-NG', label: 'Hausa', flag: '🇳🇬' },
  { value: 'zu-ZA', label: 'isiZulu', flag: '🇿🇦' },
  { value: 'xh-ZA', label: 'isiXhosa', flag: '🇿🇦' },
  { value: 'af-ZA', label: 'Afrikaans', flag: '🇿🇦' },
  { value: 'am-ET', label: 'አማርኛ', flag: '🇪🇹' },
  { value: 'sn-ZW', label: 'Shona', flag: '🇿🇼' },
  { value: 'rw-RW', label: 'Kinyarwanda', flag: '🇷🇼' },
  { value: 'ln-CD', label: 'Lingala', flag: '🇨🇩' },
  { value: 'ti-ER', label: 'ትግርኛ', flag: '🇪🇷' },
  { value: 'ff-NE', label: 'Fulfulde', flag: '🇳🇪' },
  { value: 'so-SO', label: 'Soomaali', flag: '🇸🇴' },
  
  // 🇳🇿🇼🇸🇹🇴🇫🇯 大洋洲语言
  { value: 'mi-NZ', label: 'Māori', flag: '🇳🇿' },
  { value: 'sm-WS', label: 'Gagana Samoa', flag: '🇼🇸' },
  { value: 'to-TO', label: 'Lea Faka-Tonga', flag: '🇹🇴' },
  { value: 'fj-FJ', label: 'Na Vosa Vakaviti', flag: '🇫🇯' },
  
  // 🇵🇪🇧🇴🇵🇾🇬🇾 美洲原住民语言
  { value: 'qu-PE', label: 'Quechua (Perú)', flag: '🇵🇪' },
  { value: 'qu-BO', label: 'Quechua (Bolivia)', flag: '🇧🇴' },
  { value: 'ay-BO', label: 'Aymara', flag: '🇧🇴' },
  { value: 'gn-PY', label: 'Guaraní', flag: '🇵🇾' },
  
  // 🏛️ 辅助语言
  { value: 'la-VA', label: 'Latina', flag: '🇻🇦' },
  { value: 'eo-UN', label: 'Esperanto', flag: '🌍' },
  { value: 'ia-UN', label: 'Interlingua', flag: '🌍' },
  { value: 'ht-HT', label: 'Kreyòl Ayisyen', flag: '🇭🇹' },
];

// 视频生成模型配置
export interface VideoModelConfig {
  value: VideoModel;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  minDuration: number;
  durationStep: number;
  durations: number[];
  supportedRatios: AspectRatio[];
  promptLanguage: 'en' | 'cn' | 'both';
  provider: string;
}

export const VIDEO_MODEL_OPTIONS: VideoModelConfig[] = [
  { value: 'veo3', name: 'Veo 3.1', nameEn: 'Google Veo 3.1', icon: '🎬', description: 'Google 最新AI视频生成模型，画质优秀', minDuration: 8, durationStep: 8, durations: [8, 16, 24, 32, 40, 48, 56, 60, 120, 180, 240, 300], supportedRatios: ['9:16', '16:9', '1:1'], promptLanguage: 'en', provider: 'Google' },
  { value: 'jimeng', name: '即梦', nameEn: 'JiMeng', icon: '🎨', description: '字节跳动AI视频生成，支持中文提示词', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['9:16', '16:9', '1:1', '4:5'], promptLanguage: 'cn', provider: '字节跳动' },
  { value: 'seedance', name: 'Seedance', nameEn: 'Seedance', icon: '🌟', description: '字节跳动高清视频生成，画质细腻', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['9:16', '16:9', '1:1'], promptLanguage: 'both', provider: '字节跳动' },
  { value: 'kling', name: '可灵', nameEn: 'KLing', icon: '⚡', description: '快手AI视频生成，运动幅度大', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['9:16', '16:9', '1:1'], promptLanguage: 'both', provider: '快手' },
  { value: 'runway', name: 'Runway Gen-3', nameEn: 'Runway Gen-3', icon: '🎥', description: '好莱坞级AI视频生成，专业影视级', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['16:9', '9:16', '1:1'], promptLanguage: 'en', provider: 'Runway' },
  { value: 'pika', name: 'Pika', nameEn: 'Pika', icon: '🎞️', description: '轻量级AI视频生成，简单易用', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['16:9', '9:16', '1:1'], promptLanguage: 'en', provider: 'Pika Labs' },
  { value: 'sora', name: 'Sora', nameEn: 'OpenAI Sora', icon: '🌐', description: 'OpenAI视频生成模型，想象力丰富', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['16:9', '9:16', '1:1'], promptLanguage: 'en', provider: 'OpenAI' },
  { value: 'luma', name: 'Dream Machine', nameEn: 'Luma Dream Machine', icon: '💭', description: 'Luma AI视频生成，创意无限', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['16:9', '9:16', '1:1', '4:5'], promptLanguage: 'en', provider: 'Luma AI' },
  { value: 'stable_video', name: 'Stable Video', nameEn: 'Stable Video', icon: '🎬', description: 'Stability AI视频生成，稳定可控', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['16:9', '9:16', '1:1'], promptLanguage: 'en', provider: 'Stability AI' },
  { value: 'cogvideo', name: 'CogVideoX', nameEn: 'CogVideoX', icon: '🧠', description: '国产开源视频生成模型，支持中文', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['16:9', '9:16'], promptLanguage: 'cn', provider: 'Zhipu AI' },
  { value: 'minimax', name: '海螺AI', nameEn: 'Hailuo AI', icon: '🐚', description: 'MiniMax视频生成，国产优质选择', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['9:16', '16:9', '1:1'], promptLanguage: 'cn', provider: 'MiniMax' },
  { value: '逐梦', name: '逐梦', nameEn: 'Dreamina', icon: '🚀', description: '剪映旗下AI视频生成，简单高效', minDuration: 5, durationStep: 5, durations: [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], supportedRatios: ['9:16', '16:9', '1:1'], promptLanguage: 'cn', provider: '字节跳动' },
];

// 默认视频模型
export const DEFAULT_VIDEO_MODEL: VideoModel = 'jimeng';

// 获取模型配置
export const getVideoModelConfig = (model: VideoModel): VideoModelConfig | undefined => {
  return VIDEO_MODEL_OPTIONS.find(m => m.value === model);
};

// 获取模型的默认时长
export const getModelDefaultDuration = (model: VideoModel): number => {
  const config = getVideoModelConfig(model);
  return config?.minDuration || 5;
};

// 格式化时长显示
export const formatDuration = (seconds: number): string => {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}分钟`;
    }
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${seconds}秒`;
};

// TikTok Shop 官方商品类目
export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  children: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'fashion', name: '时尚', icon: '👗', children: ['女装与连衣裙', '上衣与衬衫', '裤装与牛仔裤', '裙装', '外套与夹克', '运动服与健身服', '泳装', '睡衣与家居服', '情侣装与亲子装', '女士内衣与袜子', '男士服装', '童裝', '鞋靴', '箱包与配饰', '珠宝首饰', '手表', '眼镜/太阳镜'] },
  { id: 'beauty', name: '美妆', icon: '💄', children: ['护肤', '彩妆', '香水', '美甲与美睫', '美容工具', '头发护理', '护发产品'] },
  { id: 'electronics', name: '电子产品', icon: '📱', children: ['手机与配件', '电脑与配件', '平板电脑与配件', '耳机与音响', '相机与照片', '智能穿戴设备', '游戏设备', '存储设备', '充电器与线缆'] },
  { id: 'home', name: '家居生活', icon: '🏠', children: ['家具', '灯饰与照明', '厨房用品', '床上用品', '浴室用品', '收纳与整理', '装饰品', '园艺与户外'] },
  { id: 'food', name: '食品', icon: '🍎', children: ['零食', '饮料', '咖啡与茶', '保健品', '方便食品', '调味料'] },
  { id: 'mother-baby', name: '母婴', icon: '👶', children: ['奶粉', '纸尿裤', '婴儿洗护', '婴儿食品', '婴儿车与安全座椅', '玩具', '童装与配饰'] },
  { id: 'sports', name: '运动户外', icon: '🏃', children: ['运动鞋', '健身器材', '户外装备', '骑行装备', '球类运动', '游泳用品'] },
  { id: 'auto', name: '汽车摩托', icon: '🚗', children: ['汽车配件', '摩托车配件', '工具套装', '五金工具'] },
  { id: 'pet', name: '宠物', icon: '🐾', children: ['狗粮与狗用品', '猫粮与猫用品', '宠物玩具', '宠物清洁护理'] },
  { id: 'health', name: '健康', icon: '💊', children: ['营养保健', '医疗用品', '成人用品'] },
  { id: 'other', name: '其他', icon: '📦', children: ['办公文具', '图书', '乐器', '虚拟商品'] },
];

// 扁平类目列表
export const CATEGORY_OPTIONS = CATEGORY_GROUPS.flatMap(g => g.children);
