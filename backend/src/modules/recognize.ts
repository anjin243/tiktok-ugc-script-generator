import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// 商品类目列表
const CATEGORIES = [
  '美妆护肤', '服饰鞋包', '家居日用', '食品饮料', 
  '数码电子', '母婴用品', '运动户外', '珠宝配饰',
  '图书文具', '宠物用品', '汽车用品', '家用电器'
];

// 识别请求验证
const RecognizeSchema = z.object({
  image: z.string().startsWith('data:image'),
  config: z.object({
    provider: z.string(),
    keys: z.record(z.string()),
  }).optional(),
});

// DeepSeek Vision API 识别
async function recognizeWithDeepSeek(imageBase64: string, apiKey: string): Promise<{
  productName: string;
  category: string;
  confidence: number;
  suggestions: { categories: string[] };
}> {
  console.log('[DeepSeek] Starting API call...');
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-vl-chat',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `你是一个电商商品识别专家。请分析这张图片中的商品，返回JSON格式结果：
{
  "productName": "商品名称（简洁，不超过10个字，包含品牌和产品类型）",
  "category": "商品类目（必须是以下之一：${CATEGORIES.join('、')}）",
  "confidence": 0.95
}

要求：
1. 仔细观察图片中的商品特征、包装、品牌标识
2. 商品名称要准确，包含品牌信息（如果可见）
3. 只返回JSON，不要其他解释`,
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DeepSeek] API error:', response.status, errorText);
    throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  console.log('[DeepSeek] Response:', content);
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[DeepSeek] Parsed result:', parsed);
      return {
        productName: parsed.productName || '未知商品',
        category: CATEGORIES.includes(parsed.category) ? parsed.category : CATEGORIES[0],
        confidence: parsed.confidence || 0.85,
        suggestions: { categories: CATEGORIES },
      };
    }
  } catch (e) {
    console.error('[DeepSeek] Parse error:', e);
  }

  throw new Error('无法解析DeepSeek响应');
}

// OpenAI GPT-4V 识别
async function recognizeWithOpenAI(imageBase64: string, apiKey: string): Promise<{
  productName: string;
  category: string;
  confidence: number;
  suggestions: { categories: string[] };
}> {
  console.log('[OpenAI] Starting API call...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `你是一个电商商品识别专家。请分析这张图片中的商品，返回JSON格式结果：
{
  "productName": "商品名称（简洁，不超过10个字）",
  "category": "商品类目（必须是以下之一：${CATEGORIES.join('、')}）",
  "confidence": 0.95
}

只返回JSON，不要其他解释。`,
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OpenAI] API error:', response.status, errorText);
    throw new Error(`OpenAI API 错误: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        productName: parsed.productName || '未知商品',
        category: CATEGORIES.includes(parsed.category) ? parsed.category : CATEGORIES[0],
        confidence: parsed.confidence || 0.85,
        suggestions: { categories: CATEGORIES },
      };
    }
  } catch (e) {
    console.error('[OpenAI] Parse error:', e, content);
  }

  throw new Error('无法解析OpenAI响应');
}

// Google Gemini 识别
async function recognizeWithGemini(imageBase64: string, apiKey: string): Promise<{
  productName: string;
  category: string;
  confidence: number;
  suggestions: { categories: string[] };
}> {
  console.log('[Gemini] Starting API call...');
  
  const base64Data = imageBase64.split(',')[1];
  const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `你是一个电商商品识别专家。请分析这张图片中的商品，返回JSON格式结果：
{
  "productName": "商品名称（简洁，不超过10个字）",
  "category": "商品类目（必须是以下之一：${CATEGORIES.join('、')}）",
  "confidence": 0.95
}

只返回JSON，不要其他解释。`,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Gemini] API error:', response.status, errorText);
    throw new Error(`Gemini API 错误: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        productName: parsed.productName || '未知商品',
        category: CATEGORIES.includes(parsed.category) ? parsed.category : CATEGORIES[0],
        confidence: parsed.confidence || 0.85,
        suggestions: { categories: CATEGORIES },
      };
    }
  } catch (e) {
    console.error('[Gemini] Parse error:', e, content);
  }

  throw new Error('无法解析Gemini响应');
}

// 智能猜测（无API时使用）
async function smartGuessProduct(imageBase64: string): Promise<{
  productName: string;
  category: string;
  confidence: number;
  suggestions: { categories: string[] };
}> {
  const imageHash = imageBase64.length % 1000;
  
  const productKeywords = [
    { name: '精华液', category: '美妆护肤' },
    { name: '面霜', category: '美妆护肤' },
    { name: '口红', category: '美妆护肤' },
    { name: '眼影盘', category: '美妆护肤' },
    { name: '连衣裙', category: '服饰鞋包' },
    { name: '运动鞋', category: '服饰鞋包' },
    { name: '背包', category: '服饰鞋包' },
    { name: '手表', category: '珠宝配饰' },
    { name: '耳机', category: '数码电子' },
    { name: '充电宝', category: '数码电子' },
    { name: '保温杯', category: '家居日用' },
    { name: '收纳盒', category: '家居日用' },
    { name: '零食礼盒', category: '食品饮料' },
    { name: '坚果', category: '食品饮料' },
    { name: '洗发水', category: '家居日用' },
    { name: '牙膏', category: '家居日用' },
    { name: '婴儿奶粉', category: '母婴用品' },
    { name: '玩具', category: '母婴用品' },
    { name: '瑜伽垫', category: '运动户外' },
    { name: '哑铃', category: '运动户外' },
  ];
  
  const product = productKeywords[imageHash % productKeywords.length];
  
  return {
    productName: product.name,
    category: product.category,
    confidence: 0.5,
    suggestions: { categories: CATEGORIES },
  };
}

// 服务商名称映射
const PROVIDER_NAMES: Record<string, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  google: 'Google Gemini',
  tencent: '腾讯混元',
  baidu: '百度文心',
  aliyun: '阿里通义',
};

// 图片识别接口
router.post('/image', async (req: Request, res: Response) => {
  try {
    const { image, config } = RecognizeSchema.parse(req.body);
    
    let result;
    let apiStatus: 'success' | 'failed' | 'not_configured' = 'not_configured';
    let apiProvider = '';
    let apiError = '';

    // 检查是否有配置
    if (config?.provider && config?.keys) {
      const { provider, keys } = config;
      apiProvider = provider;
      apiStatus = 'failed'; // 先假设失败，成功后再改为success

      console.log(`[Recognize] Attempting to use ${provider} API...`);
      console.log(`[Recognize] Keys provided:`, Object.keys(keys));

      try {
        switch (provider) {
          case 'deepseek':
            // DeepSeek API 暂不支持图像识别，需要本地部署 DeepSeek-VL2
            apiError = 'DeepSeek API 暂不支持图像识别，请选择 OpenAI 或 Google Gemini';
            break;
          case 'openai':
            if (keys.apiKey) {
              result = await recognizeWithOpenAI(image, keys.apiKey);
              apiStatus = 'success';
            } else {
              apiError = '缺少API Key';
            }
            break;
          case 'google':
            if (keys.apiKey) {
              result = await recognizeWithGemini(image, keys.apiKey);
              apiStatus = 'success';
            } else {
              apiError = '缺少API Key';
            }
            break;
          case 'tencent':
            if (keys.secretId && keys.secretKey) {
              // 腾讯云需要特殊签名，暂不支持
              apiError = '腾讯云API暂未实现，请选择其他服务商';
            } else {
              apiError = '缺少SecretId或SecretKey';
            }
            break;
          case 'baidu':
            if (keys.apiKey && keys.secretKey) {
              apiError = '百度API暂未实现，请选择其他服务商';
            } else {
              apiError = '缺少API Key或Secret Key';
            }
            break;
          case 'aliyun':
            if (keys.apiKey) {
              apiError = '阿里云API暂未实现，请选择其他服务商';
            } else {
              apiError = '缺少API Key';
            }
            break;
          default:
            apiError = `未知的服务商: ${provider}`;
        }

        if (apiStatus === 'success') {
          console.log(`[Recognize] ${provider} API call successful!`);
        }
      } catch (error) {
        console.error(`[Recognize] ${provider} API call failed:`, error);
        apiError = error instanceof Error ? error.message : 'API调用失败';
      }
    } else {
      console.log('[Recognize] No API config provided, using demo mode');
    }

    // 如果AI识别失败或未配置，使用智能猜测
    if (!result) {
      result = await smartGuessProduct(image);
    }

    res.json({
      success: true,
      data: {
        ...result,
        apiStatus,
        apiProvider,
        apiProviderName: PROVIDER_NAMES[apiProvider] || apiProvider,
        apiError,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      console.error('[Recognize] Error:', error);
      res.status(500).json({ success: false, error: 'Failed to recognize image' });
    }
  }
});

export default router;
