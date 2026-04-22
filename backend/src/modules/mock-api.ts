import { Router, Request, Response } from 'express';

const router = Router();

// 内存存储（模拟数据库）
const projects: Map<string, any> = new Map();
const products: Map<string, any> = new Map();

// ============ 产品接口 ============

// 获取商品列表
router.get('/products', (req, res) => {
  res.json({
    success: true,
    data: Array.from(products.values()),
  });
});

// 获取单个商品
router.get('/products/:id', (req, res) => {
  const product = products.get(req.params.id);
  if (!product) {
    res.status(404).json({ success: false, error: 'Product not found' });
    return;
  }
  res.json({ success: true, data: product });
});

// 创建商品
router.post('/products', (req, res) => {
  const id = `prod_${Date.now()}`;
  const product = {
    id,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products.set(id, product);
  res.json({ success: true, data: product });
});

// 删除商品
router.delete('/products/:id', (req, res) => {
  products.delete(req.params.id);
  res.json({ success: true });
});

// ============ 项目接口 ============

// 获取项目列表
router.get('/projects', (req, res) => {
  res.json({
    success: true,
    data: Array.from(projects.values()),
  });
});

// 获取单个项目
router.get('/projects/:id', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  res.json({ success: true, data: project });
});

// 创建项目
router.post('/projects', (req, res) => {
  const id = `proj_${Date.now()}`;
  const project = {
    id,
    ...req.body,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.set(id, project);
  res.json({ success: true, data: project });
});

// 更新项目
router.put('/projects/:id', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  const updated = {
    ...project,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  projects.set(req.params.id, updated);
  res.json({ success: true, data: updated });
});

// 删除项目
router.delete('/projects/:id', (req, res) => {
  projects.delete(req.params.id);
  res.json({ success: true });
});

// ============ 生成接口 ============

// 增强的 UGC 风格信息
const VIDEO_STYLE_INFO: Record<string, { name: string; description: string; scenes: string[]; prompts: string[] }> = {
  unboxing: {
    name: '开箱测评',
    description: '沉浸式开箱体验',
    scenes: [
      '特写镜头展示快递包裹神秘感',
      '手部动作拆开包装，营造期待感',
      '产品首次亮相，慢镜头展示',
      '细节特写，突出做工和质感',
      '使用展示，体现真实效果',
      '总结推荐，给出购买建议',
    ],
    prompts: [
      'Close-up shot of hands unwrapping an elegant package, soft ambient lighting, cinematic slow motion, product reveal anticipation',
      'Wide establishing shot of premium packaging in a clean minimalist setting, natural light streaming through window',
      'Product hero shot rotating slowly on marble surface, dramatic lighting highlighting premium materials and craftsmanship',
      'Macro detail shots capturing intricate product design, golden hour lighting, shallow depth of field',
      'Lifestyle shot of person using product with genuine smile, warm natural tones, authentic atmosphere',
      'Close-up of product with confetti or sparkle effects, celebration mood, promotional energy',
    ],
  },
  usage: {
    name: '使用分享',
    description: '真实场景使用展示',
    scenes: [
      '问题导入，展示使用前状态',
      '产品介绍，突出核心卖点',
      '使用过程，详细展示使用方法',
      '效果对比，展示使用后改善',
      '心得分享，真实用户体验',
    ],
    prompts: [
      'Person showing their skin/before state with subtle concern, relatable home setting, natural soft lighting',
      'Product introduction with clean background, professional lighting, floating product animation',
      'Hands demonstrating product application technique, close-up follow shots, satisfying ASMR-like quality',
      'Split-screen or side-by-side comparison, dramatic transformation reveal, clean modern aesthetic',
      'Person giving genuine testimonial with warm smile, cozy home environment, authentic conversational tone',
    ],
  },
  comparison: {
    name: '对比测评',
    description: '产品对比分析',
    scenes: [
      '开场介绍对比主题',
      'A产品展示与测评',
      'B产品展示与测评',
      '多维度对比分析',
      '综合推荐与总结',
    ],
    prompts: [
      'Dynamic split-screen introduction with two products side by side, modern tech aesthetic, energetic music beat',
      'Product A floating in center frame, professional studio lighting, rotating 360-degree showcase',
      'Product B on minimalist white surface, clean white background, detailed macro shots of features',
      'Multi-panel comparison grid layout, charts and graphs appearing, data visualization style',
      'Final recommendation with both products, balanced composition, trustworthy expert energy',
    ],
  },
  story: {
    name: '剧情植入',
    description: '故事化场景演绎',
    scenes: [
      '生活场景铺垫，引出需求',
      '问题/冲突的戏剧化呈现',
      '产品自然融入解决方案',
      '情感高潮与产品价值',
      '温馨结局与品牌印记',
    ],
    prompts: [
      'Cinematic lifestyle scene at golden hour, relatable everyday moment, warm nostalgic color grading',
      'Dramatic tension shot with subtle problem visualization, moody lighting, narrative storytelling',
      'Product naturally appearing in scene as solution, seamless integration, product as hero moment',
      'Emotional climax with soft focus background, tender moment captured, uplifting music swell',
      'Warm ending scene with brand subtle placement, group laughter or satisfied expression, cozy atmosphere',
    ],
  },
  voiceover: {
    name: '口播讲解',
    description: '直播带货风格',
    scenes: [
      '吸睛开场白，引发关注',
      '痛点放大，引发共鸣',
      '产品介绍与卖点讲解',
      '效果展示与证明',
      '限时优惠，促进行动',
    ],
    prompts: [
      'Energetic host directly addressing camera with excited expression, bright studio lighting, attention-grabbing pose',
      'Over-the-shoulder shot showing relatable problem situation, dramatic music build-up',
      'Product showcase with floating arrows highlighting features, professional broadcast quality',
      'Before/after transformation montage with satisfying music, proof and credibility shots',
      'Countdown timer with urgency effects, special offer graphics, call-to-action screen overlay',
    ],
  },
  tutorial: {
    name: '教程教学',
    description: 'Step by Step详细讲解',
    scenes: [
      '教程标题页，介绍学习目标',
      '准备工具和材料',
      'Step 1：基础操作演示',
      'Step 2：进阶技巧展示',
      'Step 3：常见问题解答',
      '成果展示与总结',
      '互动引导与关注提醒',
    ],
    prompts: [
      'Clean tutorial intro card with title text, educational setting, bright professional lighting',
      'Flat lay of tools and materials on clean surface, organized and labeled, minimal aesthetic',
      'Hands following step one instructions, clear close-up demonstration, educational diagram overlay',
      'Advanced technique showcase, before and after comparison, professional tutorial quality',
      'Common mistakes and corrections, split-screen demonstration, helpful tips on screen',
      'Final result showcase with celebration, satisfied learner energy, achievement unlocked feeling',
      'Subscribe and follow prompts, engaging end card, community call-to-action',
    ],
  },
  testimonial: {
    name: '买家秀/评价',
    description: '真实用户反馈展示',
    scenes: [
      '真实用户开头自我介绍',
      '使用产品前的问题或需求',
      '选择产品的原因',
      '使用过程分享',
      '效果展示和真实感受',
      '对其他用户的建议',
    ],
    prompts: [
      'Real person looking directly at camera with friendly smile, natural home lighting, authentic vlog energy',
      'Before state showing the problem, relatable scenario, empathetic understanding shot',
      'Excited product unboxing or reveal, genuine enthusiasm, natural genuine reaction',
      'Person actively using product in daily life, lifestyle integration, authentic moments captured',
      'Satisfied result showcase, confident expressions, transformation confidence shot',
      'Direct camera address with recommendation, trustworthy testimonial energy, genuine smile',
    ],
  },
  asmr: {
    name: 'ASMR感官',
    description: '沉浸式感官体验',
    scenes: [
      '特写镜头开始，营造沉浸氛围',
      '触感/听觉元素展示',
      '产品细节感官特写',
      '舒缓的使用过程',
      '满足感高潮',
      '平静结尾',
    ],
    prompts: [
      'Extreme close-up macro shot, shallow depth of field, immersive visual entry, soft ambient glow',
      'Satisfying textures and sounds captured, slow motion details, tactile visual representation',
      'Product texture and material showcase, sensory detail shots, premium quality emphasis',
      'Calm and relaxing usage demonstration, meditative pace, peaceful atmosphere',
      'Satisfaction climax moment, fulfilling visual payoff, ASMR trigger satisfaction',
      'Peaceful ending, calm atmosphere restoration, tranquil conclusion',
    ],
  },
};

// 增强的相机运动和灯光选项
const CAMERA_MOVEMENTS = [
  'slow push in', 'slow pull out', 'tracking shot left', 'tracking shot right',
  'dolly in', 'dolly out', 'handheld subtle movement', 'static shot',
  'orbit around product', 'crane shot up', 'top-down reveal', 'tilt up',
];

const CAMERA_ANGLES = [
  'extreme close-up', 'close-up', 'medium close-up', 'medium shot',
  'wide shot', 'cowboy shot', "hero's shot", 'bird eye view',
  "worm's eye view", 'over the shoulder', 'profile', 'three-quarter view',
];

const LIGHTING_STYLES = [
  'soft natural lighting', 'dramatic rim lighting', 'high key bright',
  'low key moody', 'golden hour warmth', 'blue hour cool', 'neon glow',
  'practical lighting', 'Rembrandt lighting', 'flat front lighting',
];

const MOODS = [
  'professional', 'playful', 'elegant', 'energetic', 'calm', 'dramatic',
  'warm and cozy', 'fresh and clean', 'luxurious', 'youthful', 'mysterious',
];

const COLOR_TONES = [
  'warm tones', 'cool tones', 'vibrant saturated', 'muted pastel',
  'high contrast', 'film grain vintage', 'crisp clean white', 'golden warmth',
];

// 生成增强的分镜
function generateEnhancedScenes(
  productName: string,
  category: string,
  sellingPoints: string[],
  style: string,
  duration: number,
  isChinese: boolean
) {
  const styleInfo = VIDEO_STYLE_INFO[style] || VIDEO_STYLE_INFO.unboxing;
  const sceneCount = duration <= 15 ? 3 : duration <= 30 ? 5 : 8;
  const baseDuration = Math.floor(duration / sceneCount);

  const mainSellingPoint = sellingPoints?.[0] || (isChinese ? '卓越品质' : 'premium quality');
  const secondaryPoint = sellingPoints?.[1] || (isChinese ? '值得信赖' : 'trustworthy');

  // 中文口播模板
  const cnOpeners = [
    `家人们！今天必须给大家安利这款${productName}！`,
    `姐妹们！发现了一个超级好用的${productName}！`,
    `OMG！这款${productName}真的太绝了！`,
    `快来看！${productName}居然可以这样！`,
  ];

  const cnMids = [
    `最让我惊喜的是它的${mainSellingPoint}！`,
    `用了之后${mainSellingPoint}真的绝了！`,
    `${productName}的${mainSellingPoint}真的太棒了！`,
    `而且它的${secondaryPoint}也是一绝！`,
  ];

  const cnClosers = [
    `心动不如行动！点击下方链接直接购买！`,
    `赶紧下单吧！限时优惠别错过！`,
    `库存有限！手慢无！快去抢购！`,
    `相信我！买它绝对不会后悔！`,
  ];

  // 英文口播模板
  const enOpeners = [
    `Hey guys! You NEED to see this ${productName}!`,
    `OMG! This ${productName} is absolutely incredible!`,
    `Stop scrolling! This ${productName} changed my life!`,
    `Wait for it... This ${productName} is fire!`,
  ];

  const enMids = [
    `What I love most is the ${mainSellingPoint}!`,
    `The ${mainSellingPoint} is absolutely amazing!`,
    `And the ${secondaryPoint} is just as impressive!`,
    `This is exactly what I've been looking for!`,
  ];

  const enClosers = [
    `Don't miss out! Tap the link below to get yours!`,
    `Limited time offer! Grab it now before it's gone!`,
    `Trust me, you want this in your life!`,
    `Buy it now and thank me later!`,
  ];

  const scenes = [];

  for (let i = 0; i < sceneCount; i++) {
    const startTime = i * baseDuration;
    const endTime = (i + 1) * baseDuration;
    const isFirst = i === 0;
    const isLast = i === sceneCount - 1;
    const progress = i / (sceneCount - 1 || 1);

    // 选择合适的场景描述
    let sceneIndex = Math.floor(progress * (styleInfo.scenes.length - 1));
    sceneIndex = Math.min(sceneIndex, styleInfo.prompts.length - 1);

    // 生成口播
    let voiceover: string;
    if (isFirst) {
      voiceover = isChinese
        ? cnOpeners[Math.floor(Math.random() * cnOpeners.length)]
        : enOpeners[Math.floor(Math.random() * enOpeners.length)];
    } else if (isLast) {
      voiceover = isChinese
        ? cnClosers[Math.floor(Math.random() * cnClosers.length)]
        : enClosers[Math.floor(Math.random() * enClosers.length)];
    } else {
      voiceover = isChinese
        ? cnMids[Math.floor(Math.random() * cnMids.length)]
        : enMids[Math.floor(Math.random() * enMids.length)];
    }

    // 音乐风格随场景变化
    let musicSuggestion: string;
    if (isFirst) {
      musicSuggestion = isChinese ? '节奏感强的开场音乐' : 'Upbeat energetic intro music';
    } else if (isLast) {
      musicSuggestion = isChinese ? '高潮部分，留意优惠信息' : 'Build-up to CTA with energetic climax';
    } else {
      musicSuggestion = isChinese ? '平稳的背景音乐' : 'Smooth background beat';
    }

    scenes.push({
      id: `scene_${i + 1}`,
      order: i + 1,
      duration: baseDuration,
      visualPrompt: styleInfo.prompts[sceneIndex].replace(/product/gi, productName),
      visualPromptCN: `${styleInfo.scenes[sceneIndex]} - ${productName}产品展示`,
      cameraMovement: CAMERA_MOVEMENTS[i % CAMERA_MOVEMENTS.length],
      cameraAngle: CAMERA_ANGLES[i % CAMERA_ANGLES.length],
      cameraDistance: i % 2 === 0 ? 'close-up' : 'medium shot',
      subject: productName,
      action: isFirst ? 'attention-grabbing reveal' : isLast ? 'call to action' : 'demonstration',
      environment: 'professional studio setting',
      lighting: LIGHTING_STYLES[i % LIGHTING_STYLES.length],
      mood: MOODS[Math.floor(progress * (MOODS.length - 1))],
      colorTone: COLOR_TONES[i % COLOR_TONES.length],
      transition: i === 0 ? 'cut' : i === sceneCount - 1 ? 'fade out' : 'dissolve',
      voiceover,
      musicSuggestion,
      startTime,
      endTime,
    });
  }

  return { scenes, styleInfo };
}

// 生成脚本
router.post('/generate/script', async (req: Request, res: Response) => {
  const data = req.body;
  const { productName, category, sellingPoints, style, duration, language, aspectRatio, price } = data;

  const isChinese = (language || 'zh-CN').startsWith('zh');
  const { scenes, styleInfo } = generateEnhancedScenes(productName, category, sellingPoints, style, duration, isChinese);

  // 生成口播文案
  const voiceover = scenes.map(s => s.voiceover).join('\n\n');

  // 生成音乐风格
  const musicStyles = {
    unboxing: isChinese ? '期待感 + 惊喜氛围音乐' : 'Anticipation + surprise celebration beats',
    usage: isChinese ? '真实 + 信任感背景音乐' : 'Authentic + trustworthy ambient music',
    comparison: isChinese ? '专业分析 + 节奏感音乐' : 'Professional analysis + rhythmic beats',
    story: isChinese ? '情感叙事 + 温暖氛围' : 'Emotional storytelling + warm atmosphere',
    voiceover: isChinese ? '直播带货 + 高能节奏' : 'Live commerce energy + upbeat tempo',
    tutorial: isChinese ? '轻快教学 + 知识感节奏' : 'Upbeat tutorial + knowledge feel rhythm',
    testimonial: isChinese ? '真实分享 + 温暖信任感' : 'Authentic sharing + warm trustworthy vibe',
    asmr: isChinese ? '舒缓放松 + 沉浸氛围' : 'Calming + immersive atmosphere soundscapes',
  };
  const musicStyle = musicStyles[style as keyof typeof musicStyles] || musicStyles.unboxing;

  // 生成完整脚本
  const aspectRatioText = {
    '9:16': 'TikTok/Reels 竖屏 (1080x1920)',
    '16:9': 'YouTube/横屏 (1920x1080)',
    '1:1': 'Instagram 方屏 (1080x1080)',
    '4:5': 'Instagram 竖屏 (1080x1350)',
  };

  const scriptContent = `# ${productName} - ${styleInfo.name} 视频脚本

## 基本信息
- **产品名称**: ${productName}
- **商品类目**: ${category}
- **核心卖点**: ${sellingPoints?.join(' | ') || '高品质'}
- **视频时长**: ${duration}秒
- **视频比例**: ${aspectRatioText[aspectRatio as keyof typeof aspectRatioText] || aspectRatio}
- **视频风格**: ${styleInfo.description}
${price ? `- **参考价格**: ¥${price}` : ''}

---

## 分镜脚本

${scenes.map((s: any, i: number) => `### 镜头 ${i + 1} (${s.startTime}s - ${s.endTime}s)

**画面描述**: ${s.visualPromptCN}

**AI视频提示词 (英文)**:
\`\`\`
${s.visualPrompt}
\`\`\`

**镜头参数**:
- 运动方式: ${s.cameraMovement}
- 镜头角度: ${s.cameraAngle}
- 景别: ${s.cameraDistance}
- 灯光: ${s.lighting}
- 情绪: ${s.mood}
- 色调: ${s.colorTone}
- 转场: ${s.transition}

**口播文案**: ${s.voiceover}

**音乐建议**: ${s.musicSuggestion}

---`).join('\n')}

## 整体建议

**背景音乐**: ${musicStyle}

**拍摄要点**:
1. 保持画面干净简洁，突出产品主体
2. 灯光要均匀柔和，避免强烈阴影
3. 口播语速适中，情感真挚
4. 注意节奏把控，保持观众注意力
5. CTA（行动号召）要清晰明确

---

*脚本生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}*
*生成工具: TikTok UGC Script Generator*
`;

  // 更新项目
  const projectId = data.projectId;
  if (projectId && projects.has(projectId)) {
    const project = projects.get(projectId);
    projects.set(projectId, {
      ...project,
      scriptContent,
      voiceover,
      musicStyle,
      status: 'completed',
      scenes,
    });
  }

  res.json({
    success: true,
    data: {
      project: projects.get(projectId) || { id: projectId },
      script: scriptContent,
      scenes,
      voiceover,
      musicStyle,
      usedAI: false,
      aiProvider: 'Enhanced Mock Generator v2.0',
    },
  });
});

// ============ 识别接口 ============

router.post('/recognize/image', (req, res) => {
  res.json({
    success: true,
    data: {
      productName: 'AI识别商品（演示模式）',
      category: '护肤',
      confidence: 0.85,
      suggestions: {
        categories: ['护肤', '彩妆', '头发护理', '美容工具', '服饰鞋包'],
        colors: ['玫瑰金', '简约白', '高级黑'],
        tags: ['网红爆款', '高颜值', '送礼推荐'],
      },
      apiStatus: 'not_configured',
      apiProviderName: '演示模式',
    },
  });
});

// ============ 设置接口 ============

router.get('/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      aiProviders: ['openai', 'gemini', 'claude', 'kimi'],
      defaultLanguage: 'zh-CN',
      supportedVideoModels: [
        { id: 'veo3', name: 'Veo 3.1', provider: 'Google' },
        { id: 'hunyuan', name: '即梦', provider: '腾讯' },
        { id: 'kling', name: '可灵', provider: '快手' },
        { id: 'runway', name: 'Runway Gen-3', provider: 'Runway' },
        { id: 'pika', name: 'Pika', provider: 'Pika Labs' },
        { id: 'sora', name: 'Sora', provider: 'OpenAI' },
      ],
    },
  });
});

export default router;
