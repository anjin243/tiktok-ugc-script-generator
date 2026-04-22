import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { GenerateScriptSchema, UGCStyle, Language } from '../types/product.types';

const router = Router();
const prisma = new PrismaClient();

// AI视频生成模型兼容的分镜Prompt接口
// 适用于: Veo3.1, 即梦, 可灵, Runway Gen-3, Pika, Sora等

interface ScenePrompt {
  order: number;
  duration: number;
  
  // AI视频生成专用字段
  visualPrompt: string;      // 英文画面描述（给AI模型用）
  visualPromptCN: string;   // 中文画面描述（给用户看）
  
  // 镜头语言
  cameraMovement: string;
  cameraAngle: string;
  cameraDistance: string;
  
  // 画面元素
  subject: string;
  action: string;
  environment: string;
  lighting: string;
  mood: string;
  colorTone: string;
  
  // 过渡效果
  transition: string;
  
  // 音频相关
  voiceover: string;
  musicSuggestion: string;
  
  // 时间控制
  startTime: number;
  endTime: number;
}

// 视频风格描述（给AI用的参考信息）
const VIDEO_STYLE_INFO: Record<UGCStyle, {
  name: string;
  description: string;
  cameraStyle: string;
  lightingStyle: string;
  mood: string;
}> = {
  unboxing: {
    name: '开箱测评',
    description: '沉浸式开箱体验，从拆快递到产品展示，营造惊喜感',
    cameraStyle: 'handheld, POV shots, push in for reveals',
    lightingStyle: 'soft natural lighting, warm highlights',
    mood: 'excited, anticipatory, satisfying',
  },
  usage: {
    name: '使用分享',
    description: '真实场景使用展示，生活化场景，突出产品解决实际问题的能力',
    cameraStyle: 'natural handheld, documentary style, POV',
    lightingStyle: 'soft natural lighting, golden hour',
    mood: 'authentic, relatable, warm',
  },
  comparison: {
    name: '对比测评',
    description: '产品对比分析，客观专业地展示产品优势',
    cameraStyle: 'static, controlled movements, split screen',
    lightingStyle: 'studio lighting, neutral',
    mood: 'objective, informative, conclusive',
  },
  story: {
    name: '剧情植入',
    description: '故事化场景演绎，用情感叙事包装产品，引发共鸣',
    cameraStyle: 'cinematic, smooth tracking, crane shots',
    lightingStyle: 'cinematic lighting, varying with narrative',
    mood: 'emotional, engaging, transformative',
  },
  voiceover: {
    name: '口播讲解',
    description: '直播带货风格，主播直视镜头推荐产品，强说服力',
    cameraStyle: 'static with occasional push in, dynamic close-ups',
    lightingStyle: 'studio lighting, ring light, bright',
    mood: 'energetic, persuasive, urgent',
  },
};

// 语言名称映射
const LANGUAGE_NAMES: Record<string, string> = {
  'zh-CN': '中文（简体）',
  'zh-TW': '中文（繁體）',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Español',
  'pt-BR': 'Português (Brasil)',
  'id-ID': 'Bahasa Indonesia',
  'th-TH': 'ไทย',
  'vi-VN': 'Tiếng Việt',
  'fil-PH': 'Filipino',
  'ms-MY': 'Bahasa Melayu',
  'ar-SA': 'العربية',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
};

// ============ AI大模型调用 ============

// OpenAI GPT 生成脚本
async function generateWithOpenAI(
  apiKey: string,
  productName: string,
  category: string,
  sellingPoints: string[],
  style: UGCStyle,
  duration: number,
  language: Language,
  aspectRatio: string,
  referenceImages: string[],
  price?: number
): Promise<{ scenes: ScenePrompt[]; voiceover: string; musicStyle: string; scriptContent: string }> {
  const styleInfo = VIDEO_STYLE_INFO[style];
  const sceneCount = duration <= 15 ? 3 : duration <= 30 ? 5 : 8;
  const baseDuration = Math.floor(duration / sceneCount);
  const langName = LANGUAGE_NAMES[language] || '中文';

  const prompt = `You are a professional video director and scriptwriter specializing in TikTok/UGC product videos. You create storyboard scripts optimized for AI video generation models (Veo3.1, Jimeng, Kling, Runway Gen-3, Pika, Sora).

Create a ${duration}-second ${styleInfo.name} style UGC video storyboard for the following product:

**Product**: ${productName}
**Category**: ${category}
**Key Selling Points**: ${sellingPoints.join(', ')}
${price ? `**Price**: ${price}` : ''}
**Video Style**: ${styleInfo.name} - ${styleInfo.description}
**Camera Style**: ${styleInfo.cameraStyle}
**Lighting Style**: ${styleInfo.lightingStyle}
**Mood**: ${styleInfo.mood}
**Aspect Ratio**: ${aspectRatio}
**Language**: ${langName}
**Number of Scenes**: ${sceneCount}
**Scene Duration**: ~${baseDuration} seconds each

IMPORTANT RULES:
1. Each scene must have a "visualPrompt" in ENGLISH - this is the actual prompt that will be fed into AI video generation models. It must be detailed, cinematic, and follow professional cinematography language.
2. visualPrompt must describe: camera movement, shot type, subject, action, environment, lighting, mood, color tone in a natural flowing sentence.
3. Each scene must have "visualPromptCN" in ${langName} - a translation/description for the user to understand.
4. "voiceover" field must be in ${langName}.
5. Be creative and unique - each generation should feel fresh, not templated.
6. Make the script feel authentic and native to TikTok/UGC culture.
7. The visualPrompt should be 2-4 sentences, rich in visual detail that AI video models can interpret accurately.
8. Use professional cinematography terms in visualPrompt: push in, pull out, tracking shot, dolly, crane, handheld, static, pan, tilt, etc.
9. Each scene should flow naturally into the next with appropriate transitions.
10. The voiceover should be catchy, conversational, and persuasive - like a real TikTok creator would speak.

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "scenes": [
    {
      "order": 1,
      "duration": ${baseDuration},
      "visualPrompt": "Detailed English visual description for AI video model with camera movement, subject, action, environment, lighting, mood...",
      "visualPromptCN": "${langName} description of the same scene",
      "cameraMovement": "e.g. slow push in, camera moves closer to subject",
      "cameraAngle": "e.g. close-up, medium shot, wide shot, POV, bird's eye",
      "cameraDistance": "e.g. extreme close-up, close-up, medium, wide, extreme wide",
      "subject": "what is the main subject in frame",
      "action": "what is happening in the scene",
      "environment": "setting/background description",
      "lighting": "e.g. soft natural lighting, studio lighting, golden hour",
      "mood": "e.g. excited, calm, dramatic, warm",
      "colorTone": "e.g. warm tones, cool tones, vibrant, muted",
      "transition": "e.g. cut, dissolve, fade, wipe, zoom",
      "voiceover": "${langName} voiceover text for this scene",
      "musicSuggestion": "music style suggestion",
      "startTime": 0,
      "endTime": ${baseDuration}
    }
  ],
  "voiceover": "Complete voiceover script in ${langName} for the entire video",
  "musicStyle": "Overall music recommendation in ${langName}",
  "scriptContent": "Full formatted script in markdown with all scene details in ${langName}"
}`;

  console.log('[OpenAI] Generating script with GPT-4o...');

  const messages: any[] = [
    { role: 'system', content: 'You are a professional video director. Always respond with valid JSON only, no markdown code blocks.' },
    { role: 'user', content: prompt },
  ];

  // 如果有参考图，加入图片分析
  if (referenceImages.length > 0) {
    const imageContent = referenceImages.slice(0, 3).map(img => ({
      type: 'image_url',
      image_url: { url: img, detail: 'low' },
    }));
    
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'These are reference images of the product. Use them to create more accurate and detailed scene descriptions.' },
        ...imageContent,
      ],
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 4000,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OpenAI] API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  console.log('[OpenAI] Response length:', content.length);

  return parseAIResponse(content, sceneCount, baseDuration, duration, style, productName, category, sellingPoints, language);
}

// Google Gemini 生成脚本
async function generateWithGemini(
  apiKey: string,
  productName: string,
  category: string,
  sellingPoints: string[],
  style: UGCStyle,
  duration: number,
  language: Language,
  aspectRatio: string,
  referenceImages: string[],
  price?: number
): Promise<{ scenes: ScenePrompt[]; voiceover: string; musicStyle: string; scriptContent: string }> {
  const styleInfo = VIDEO_STYLE_INFO[style];
  const sceneCount = duration <= 15 ? 3 : duration <= 30 ? 5 : 8;
  const baseDuration = Math.floor(duration / sceneCount);
  const langName = LANGUAGE_NAMES[language] || '中文';

  const prompt = `You are a professional video director and scriptwriter specializing in TikTok/UGC product videos. You create storyboard scripts optimized for AI video generation models (Veo3.1, Jimeng, Kling, Runway Gen-3, Pika, Sora).

Create a ${duration}-second ${styleInfo.name} style UGC video storyboard for the following product:

**Product**: ${productName}
**Category**: ${category}
**Key Selling Points**: ${sellingPoints.join(', ')}
${price ? `**Price**: ${price}` : ''}
**Video Style**: ${styleInfo.name} - ${styleInfo.description}
**Camera Style**: ${styleInfo.cameraStyle}
**Lighting Style**: ${styleInfo.lightingStyle}
**Mood**: ${styleInfo.mood}
**Aspect Ratio**: ${aspectRatio}
**Language**: ${langName}
**Number of Scenes**: ${sceneCount}
**Scene Duration**: ~${baseDuration} seconds each

IMPORTANT RULES:
1. Each scene must have a "visualPrompt" in ENGLISH for AI video generation models - detailed, cinematic, professional cinematography language.
2. "visualPromptCN" must be in ${langName}.
3. "voiceover" must be in ${langName}.
4. Be creative and unique each time.
5. The visualPrompt should be 2-4 sentences, rich in visual detail.
6. Use professional cinematography terms.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "scenes": [
    {
      "order": 1,
      "duration": ${baseDuration},
      "visualPrompt": "English visual prompt...",
      "visualPromptCN": "${langName} description...",
      "cameraMovement": "camera movement description",
      "cameraAngle": "shot type",
      "cameraDistance": "shot distance",
      "subject": "main subject",
      "action": "what happens",
      "environment": "setting",
      "lighting": "lighting description",
      "mood": "mood",
      "colorTone": "color tone",
      "transition": "transition type",
      "voiceover": "${langName} voiceover",
      "musicSuggestion": "music suggestion",
      "startTime": 0,
      "endTime": ${baseDuration}
    }
  ],
  "voiceover": "Complete voiceover in ${langName}",
  "musicStyle": "Music recommendation in ${langName}",
  "scriptContent": "Full formatted script in markdown in ${langName}"
}`;

  const parts: any[] = [{ text: prompt }];

  // 加入参考图
  for (const img of referenceImages.slice(0, 3)) {
    const base64Data = img.split(',')[1];
    const mimeType = img.split(';')[0].split(':')[1] || 'image/jpeg';
    if (base64Data) {
      parts.push({
        inline_data: { mime_type: mimeType, data: base64Data },
      });
    }
    parts.push({ text: 'Reference image of the product above.' });
  }

  console.log('[Gemini] Generating script with Gemini...');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Gemini] API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: any = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('[Gemini] Response length:', content.length);

  return parseAIResponse(content, sceneCount, baseDuration, duration, style, productName, category, sellingPoints, language);
}

// 解析AI返回的JSON
function parseAIResponse(
  content: string,
  sceneCount: number,
  baseDuration: number,
  duration: number,
  style: UGCStyle,
  productName: string,
  category: string,
  sellingPoints: string[],
  language: Language
): { scenes: ScenePrompt[]; voiceover: string; musicStyle: string; scriptContent: string } {
  // 清理可能的markdown代码块标记
  let cleanContent = content.trim();
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleanContent);
    
    // 验证和补全场景数据
    const scenes: ScenePrompt[] = (parsed.scenes || []).map((scene: any, index: number) => {
      const startTime = scene.startTime ?? index * baseDuration;
      const endTime = scene.endTime ?? (index + 1) * baseDuration;
      
      return {
        order: scene.order || index + 1,
        duration: scene.duration || baseDuration,
        visualPrompt: scene.visualPrompt || '',
        visualPromptCN: scene.visualPromptCN || scene.description || '',
        cameraMovement: scene.cameraMovement || '',
        cameraAngle: scene.cameraAngle || '',
        cameraDistance: scene.cameraDistance || '',
        subject: scene.subject || '',
        action: scene.action || '',
        environment: scene.environment || '',
        lighting: scene.lighting || '',
        mood: scene.mood || '',
        colorTone: scene.colorTone || '',
        transition: scene.transition || 'cut',
        voiceover: scene.voiceover || '',
        musicSuggestion: scene.musicSuggestion || '',
        startTime,
        endTime,
      };
    });

    // 如果AI返回的场景不够，用备用数据填充
    while (scenes.length < sceneCount) {
      const idx = scenes.length;
      scenes.push({
        order: idx + 1,
        duration: baseDuration,
        visualPrompt: `${productName} product showcase shot. Professional lighting, clean background.`,
        visualPromptCN: `${productName}产品展示镜头。专业光线，干净背景。`,
        cameraMovement: 'static shot',
        cameraAngle: 'medium shot',
        cameraDistance: 'medium shot, waist up',
        subject: productName,
        action: 'product display',
        environment: 'clean background',
        lighting: 'professional studio lighting',
        mood: 'professional',
        colorTone: 'neutral',
        transition: 'cut',
        voiceover: '',
        musicSuggestion: '',
        startTime: idx * baseDuration,
        endTime: (idx + 1) * baseDuration,
      });
    }

    const voiceover = parsed.voiceover || scenes.map(s => s.voiceover).filter(Boolean).join('\n');
    const musicStyle = parsed.musicStyle || getMusicRecommendation(style);
    const scriptContent = parsed.scriptContent || generateScriptContent(style, productName, category, sellingPoints, duration, language, scenes);

    return { scenes, voiceover, musicStyle, scriptContent };
  } catch (e) {
    console.error('[Parse] Failed to parse AI response:', e);
    console.error('[Parse] Raw content preview:', cleanContent.substring(0, 500));
    // 降级到模板生成
    return fallbackGenerate(style, productName, category, sellingPoints, duration, language);
  }
}

// 降级：模板生成（无API时使用）
function fallbackGenerate(
  style: UGCStyle,
  productName: string,
  category: string,
  sellingPoints: string[],
  duration: number,
  language: Language
): { scenes: ScenePrompt[]; voiceover: string; musicStyle: string; scriptContent: string } {
  const sceneCount = duration <= 15 ? 3 : duration <= 30 ? 5 : 8;
  const baseDuration = Math.floor(duration / sceneCount);
  const styleInfo = VIDEO_STYLE_INFO[style];
  const isChinese = language.startsWith('zh');

  // 基于风格的模板场景（简化版，只在AI不可用时使用）
  const sceneTemplates: Record<UGCStyle, { en: string[]; cn: string[]; voiceover: string[] }> = {
    unboxing: {
      en: [
        `Close-up of hands holding the beautifully packaged ${productName} box. Soft natural lighting, shallow depth of field.`,
        `Slow motion unboxing: hands carefully opening the package, revealing the ${productName}. Cinematic reveal.`,
        `Extreme close-up macro shot of ${productName} surface details. Premium quality visible in every detail.`,
        `Medium shot of ${productName} in use in a natural setting. Authentic lifestyle moment.`,
        `Final product showcase: ${productName} hero shot. Pull out to wide. Call to action overlay space.`,
      ],
      cn: [
        `特写：双手捧着精美包装的${productName}。柔和自然光线，浅景深。`,
        `慢动作开箱：小心翼翼地打开包装，露出${productName}。电影感揭晓。`,
        `微距特写：${productName}表面细节。每个细节展现高端品质。`,
        `中景：自然环境中使用${productName}。真实生活化场景。`,
        `最终展示：${productName}英雄镜头。拉远全景。行动号召空间。`,
      ],
      voiceover: isChinese
        ? [`看这个包装，质感太好了！`, `慢慢打开...哇！`, sellingPoints[0] || '这个质感绝了', sellingPoints[1] || '用起来太顺手了', `${productName}，值得拥有！链接在评论区`]
        : [`Look at this packaging!`, `Slowly opening... wow!`, sellingPoints[0] || 'Amazing quality', sellingPoints[1] || 'So easy to use', `${productName}, get yours now! Link below`],
    },
    usage: {
      en: [
        `Medium wide: Person discovering they need ${productName}. Natural lighting, authentic moment.`,
        `Close-up: ${productName} hero product shot. Product in sharp focus, background soft.`,
        `POV shot: Using ${productName}. Key features demonstrated. ${sellingPoints[0] || 'Key benefit'} visible.`,
        `Medium shot: Happy person after using ${productName}. Natural smile, warm golden light.`,
        `Product hero shot with call to action. ${productName} center frame, lifestyle context.`,
      ],
      cn: [
        `中全景：人物发现需要${productName}。自然光线，真实场景。`,
        `特写：${productName}英雄镜头。产品清晰对焦，背景柔焦。`,
        `第一人称：使用${productName}。展示关键功能。${sellingPoints[0] || '核心优势'}可见。`,
        `中景：使用后满意的人物。自然微笑，温暖金色光线。`,
        `产品英雄镜头配行动号召。${productName}居中，生活场景。`,
      ],
      voiceover: isChinese
        ? [`有没有遇到过这种情况...`, `直到我发现了${productName}`, sellingPoints[0] || '看这个功能', sellingPoints[1] || '效果真的很好', `${productName}，你的不二之选！`]
        : [`Have you ever faced this...`, `Then I found ${productName}`, sellingPoints[0] || 'Check this', sellingPoints[1] || 'It really works', `${productName}, your best choice!`],
    },
    comparison: {
      en: [
        `Split screen: Two products side by side. ${productName} on the right. Neutral comparison setup.`,
        `Close-up left: Competitor product detail. Neutral documentation style.`,
        `Close-up right: ${productName} detail. Premium features, superior quality visible.`,
        `Feature comparison overlay. Key points: ${sellingPoints.join(', ')}. Professional infographic.`,
        `Final verdict: ${productName} hero shot. Clear winner. Call to action.`,
      ],
      cn: [
        `分屏：两款产品并排。${productName}在右侧。中性对比设置。`,
        `左侧特写：竞品细节。中性记录风格。`,
        `右侧特写：${productName}细节。高端特性，卓越品质。`,
        `特性对比覆盖。关键点：${sellingPoints.join('、')}。专业信息图。`,
        `最终结论：${productName}英雄镜头。明确胜出。行动号召。`,
      ],
      voiceover: isChinese
        ? [`今天来对比一下`, `先看看普通款...`, `再看看${productName}...`, `明显${productName}更胜一筹`, `${productName}，明智之选！`]
        : [`Let's compare today`, `First the regular one...`, `Now ${productName}...`, `Clearly ${productName} wins`, `${productName}, smart choice!`],
    },
    story: {
      en: [
        `Cinematic wide: Person facing a challenge that ${productName} can solve. Emotional storytelling.`,
        `Medium: Friend recommends ${productName}. Warm natural conversation. Trust narrative.`,
        `Close-up: ${productName} reveal in hands. Hopeful moment. Soft backlight halo.`,
        `Montage: ${productName} in action, solving problems. Satisfying resolution.`,
        `Final emotional shot: Transformed happy person with ${productName}. Warm conclusion.`,
      ],
      cn: [
        `电影感全景：人物面临${productName}能解决的挑战。情感叙事。`,
        `中景：朋友推荐${productName}。温暖对话。信任叙事。`,
        `特写：双手捧着${productName}揭晓。充满希望。柔和背光。`,
        `蒙太奇：${productName}在行动，解决问题。满足的解决。`,
        `最终情感镜头：使用${productName}后快乐蜕变的人物。温暖结局。`,
      ],
      voiceover: isChinese
        ? [`那是一个普通的日子...`, `然后朋友给我推荐了${productName}`, `原来答案一直都在这里`, `一切都不一样了`, `${productName}，让生活更美好。`]
        : [`It was just an ordinary day...`, `Then a friend recommended ${productName}`, `The answer was here all along`, `Everything changed`, `${productName}, making life better.`],
    },
    voiceover: {
      en: [
        `Medium close-up: Presenter speaking to camera, holding ${productName}. Professional, energetic.`,
        `Product showcase: ${productName} held close. All angles, features highlighted with gestures.`,
        `Feature close-up: ${productName} key feature. ${sellingPoints[0] || 'Premium quality'} demonstration.`,
        `Price reveal: ${productName} with offer overlay. Urgency, countdown timer space.`,
        `Call to action finale: ${productName} center frame. Clear purchase CTA. Brand close.`,
      ],
      cn: [
        `中近景：主播直视镜头，手持${productName}。专业活力。`,
        `产品展示：${productName}近距离展示。各角度，手势突出特性。`,
        `特性特写：${productName}关键特性。${sellingPoints[0] || '高端品质'}演示。`,
        `价格揭晓：${productName}配优惠覆盖。紧迫感，倒计时空间。`,
        `行动号召结局：${productName}居中。清晰购买CTA。品牌结尾。`,
      ],
      voiceover: isChinese
        ? [`家人们！今天给你们安利${productName}`, sellingPoints[0] || '看这个品质', sellingPoints[1] || '而且还有这个', `限时特惠，手慢无！`, `${productName}，点击下方链接购买！`]
        : [`Hey everyone! Today I'm sharing ${productName}`, sellingPoints[0] || 'Check this quality', sellingPoints[1] || 'And check this out', `Limited time offer!`, `${productName}, click the link below!`],
    },
  };

  const template = sceneTemplates[style];
  const scenes: ScenePrompt[] = [];
  
  for (let i = 0; i < Math.min(sceneCount, template.en.length); i++) {
    scenes.push({
      order: i + 1,
      duration: baseDuration,
      visualPrompt: template.en[i],
      visualPromptCN: template.cn[i],
      cameraMovement: i === 0 ? 'static shot' : i % 2 === 0 ? 'slow push in' : 'handheld camera',
      cameraAngle: i === 0 ? 'wide shot' : i % 2 === 0 ? 'close-up' : 'medium shot',
      cameraDistance: i === 0 ? 'wide shot' : i % 2 === 0 ? 'close-up shot' : 'medium shot',
      subject: `${productName}`,
      action: 'product showcase',
      environment: 'clean professional setting',
      lighting: styleInfo.lightingStyle,
      mood: styleInfo.mood,
      colorTone: 'warm tones',
      transition: i === 0 ? 'cut' : i === sceneCount - 1 ? 'fade' : 'dissolve',
      voiceover: template.voiceover[i] || '',
      musicSuggestion: '',
      startTime: i * baseDuration,
      endTime: (i + 1) * baseDuration,
    });
  }

  const voiceover = template.voiceover.join('\n');
  const musicStyle = getMusicRecommendation(style);
  const scriptContent = generateScriptContent(style, productName, category, sellingPoints, duration, language, scenes);

  return { scenes, voiceover, musicStyle, scriptContent };
}

// 生成完整脚本内容
function generateScriptContent(
  style: UGCStyle,
  productName: string,
  category: string,
  sellingPoints: string[],
  duration: number,
  language: Language,
  scenes: ScenePrompt[]
): string {
  const styleInfo = VIDEO_STYLE_INFO[style];
  
  const sceneText = scenes.map(s => 
`### Scene ${s.order} (${s.startTime}s - ${s.endTime}s)

**Visual Prompt (English)**:
${s.visualPrompt}

**中文描述**:
${s.visualPromptCN}

**镜头参数**: ${s.cameraMovement} | ${s.cameraAngle} | ${s.cameraDistance}
**画面元素**: 主体: ${s.subject} | 动作: ${s.action} | 环境: ${s.environment}
**光线**: ${s.lighting} | **情绪**: ${s.mood} | **色调**: ${s.colorTone}
**转场**: ${s.transition}
**口播**: ${s.voiceover}
**音乐**: ${s.musicSuggestion}

---`
  ).join('\n\n');

  return `# AI视频生成脚本 - ${styleInfo.name}

## 基本信息
- **产品名称**: ${productName}
- **产品类目**: ${category}
- **核心卖点**: ${sellingPoints.join('、')}
- **视频时长**: ${duration}秒
- **视频风格**: ${styleInfo.description}
- **目标语言**: ${LANGUAGE_NAMES[language] || language}

## 视觉风格指引
- **镜头风格**: ${styleInfo.cameraStyle}
- **光线风格**: ${styleInfo.lightingStyle}
- **情绪氛围**: ${styleInfo.mood}

---

## 分镜脚本

${sceneText}
`;
}

// 音乐推荐
function getMusicRecommendation(style: UGCStyle): string {
  const recommendations: Record<UGCStyle, string> = {
    unboxing: '推荐：轻快节奏音乐，开箱惊喜感，适合ASMR风格的轻柔音效',
    usage: '推荐：自然舒适背景音乐，生活化氛围，轻松惬意的节奏',
    comparison: '推荐：中性专业背景音乐，客观分析感，不过于花哨',
    story: '推荐：情感音乐，随故事起伏，有叙事感的配乐',
    voiceover: '推荐：动感节奏音乐，直播带货风格，激励购买欲望',
  };
  return recommendations[style];
}

// ============ 生成脚本接口 ============

router.post('/script', async (req: Request, res: Response) => {
  try {
    const data = GenerateScriptSchema.parse(req.body);
    
    // 先用模板生成作为默认值，AI成功后覆盖
    let fallback = fallbackGenerate(
      data.style,
      data.productName,
      data.category,
      data.sellingPoints,
      data.duration,
      data.language || 'zh-CN'
    );
    let scenes: ScenePrompt[] = fallback.scenes;
    let voiceover: string = fallback.voiceover;
    let musicStyle: string = fallback.musicStyle;
    let scriptContent: string = fallback.scriptContent;
    let usedAI = false;
    let aiProvider = '';

    // 尝试使用AI生成
    const config = req.body.config as { provider?: string; keys?: Record<string, string> } | undefined;
    const provider = config?.provider;
    const keys = config?.keys;

    if (provider && keys) {
      try {
        if (provider === 'openai' && keys.openai) {
          const result = await generateWithOpenAI(
            keys.openai,
            data.productName,
            data.category,
            data.sellingPoints,
            data.style,
            data.duration,
            data.language || 'zh-CN',
            data.aspectRatio || '9:16',
            data.referenceImages || [],
            data.price
          );
          scenes = result.scenes;
          voiceover = result.voiceover;
          musicStyle = result.musicStyle;
          scriptContent = result.scriptContent;
          usedAI = true;
          aiProvider = 'OpenAI GPT-4o';
        } else if (provider === 'gemini' && keys.gemini) {
          const result = await generateWithGemini(
            keys.gemini,
            data.productName,
            data.category,
            data.sellingPoints,
            data.style,
            data.duration,
            data.language || 'zh-CN',
            data.aspectRatio || '9:16',
            data.referenceImages || [],
            data.price
          );
          scenes = result.scenes;
          voiceover = result.voiceover;
          musicStyle = result.musicStyle;
          scriptContent = result.scriptContent;
          usedAI = true;
          aiProvider = 'Google Gemini';
        }
      } catch (aiError) {
        console.error('[AI Generate] Failed, falling back to template:', aiError);
        // AI失败时保持默认的模板值
      }
    }

    // 保存到数据库
    const project = await prisma.project.update({
      where: { id: data.projectId },
      data: {
        scriptContent,
        voiceover,
        musicStyle,
        status: 'completed',
        language: data.language || 'zh-CN',
        aspectRatio: data.aspectRatio || '9:16',
        referenceImages: data.referenceImages || [],
        scenes: {
          deleteMany: {},
          create: scenes.map(scene => ({
            order: scene.order,
            duration: scene.duration,
            description: scene.visualPromptCN,
            voiceover: scene.voiceover,
            cameraAngle: `${scene.cameraMovement}, ${scene.cameraAngle}`,
            notes: JSON.stringify({
              visualPrompt: scene.visualPrompt,
              cameraDistance: scene.cameraDistance,
              subject: scene.subject,
              action: scene.action,
              environment: scene.environment,
              lighting: scene.lighting,
              mood: scene.mood,
              colorTone: scene.colorTone,
              transition: scene.transition,
              musicSuggestion: scene.musicSuggestion,
              startTime: scene.startTime,
              endTime: scene.endTime,
            }),
          })),
        },
      },
      include: {
        product: true,
        scenes: { orderBy: { order: 'asc' } },
      },
    });

    res.json({
      success: true,
      data: {
        project,
        script: scriptContent,
        scenes,
        voiceover,
        musicStyle,
        usedAI,
        aiProvider,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      console.error('Generate script error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate script' });
    }
  }
});

export default router;
