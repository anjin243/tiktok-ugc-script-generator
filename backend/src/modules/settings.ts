import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// 内存中存储配置（生产环境应使用数据库或环境变量）
let apiKeyConfig: { secretId: string; secretKey: string } | null = null;

// 配置验证
const ConfigSchema = z.object({
  tencentSecretId: z.string().min(1),
  tencentSecretKey: z.string().min(1),
});

// 保存API密钥配置
router.post('/api-key', async (req: Request, res: Response) => {
  try {
    const data = ConfigSchema.parse(req.body);
    
    apiKeyConfig = {
      secretId: data.tencentSecretId,
      secretKey: data.tencentSecretKey,
    };
    
    res.json({ 
      success: true, 
      message: 'API密钥配置成功',
      hasConfig: true 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      console.error('Save config error:', error);
      res.status(500).json({ success: false, error: 'Failed to save config' });
    }
  }
});

// 获取配置状态
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      hasApiKey: !!apiKeyConfig,
      // 不返回具体密钥内容
    }
  });
});

// 导出配置供其他模块使用
export const getApiKeyConfig = () => apiKeyConfig;

export default router;
