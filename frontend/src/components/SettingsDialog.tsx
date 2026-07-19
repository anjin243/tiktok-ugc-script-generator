import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, Info, Check, ExternalLink, Image, Zap, Gift, Server, Download, Globe } from 'lucide-react';
import { getEphemeralAiConfig, setEphemeralAiConfig } from '@/lib/ephemeral-ai-config';

interface ApiKeyConfig {
  provider: string;
  apiKey: string;
  apiSecret?: string;
}

// ========== 免费大模型配置 ==========
// 免费模型列表 - 放在最前面方便选择
const FREE_AI_PROVIDERS = [
  // 硅基流动
  {
    id: 'siliconflow',
    name: '硅基流动',
    description: '聚合多个优质模型，免费额度大',
    icon: '🌊',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    visionModel: 'Qwen/Qwen2-VL-7B-Instruct',
    pricing: '免费额度充足',
    docsUrl: 'https://cloud.siliconflow.cn',
    features: ['Qwen2.5-7B', 'Qwen2-VL-7B (视觉)', 'DeepSeek-V3', 'GLM-4-9B'],
    supportsVision: true,
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'sk-...' },
    ],
  },
  // 智谱 AI
  {
    id: 'zhipu-free',
    name: '智谱 AI (免费)',
    description: 'GLM-4-Flash 免费调用',
    icon: '🔮',
    model: 'glm-4-flash',
    visionModel: 'glm-4v-flash',
    pricing: '100万Tokens/月免费',
    docsUrl: 'https://open.bigmodel.cn/',
    features: ['GLM-4-Flash', 'GLM-4V-Flash (视觉)', '免费额度大'],
    supportsVision: true,
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入智谱 API Key' },
    ],
  },
  // Ollama 本地
  {
    id: 'ollama',
    name: 'Ollama 本地',
    description: '完全免费，在本地运行模型',
    icon: '🏠',
    model: 'llama3.2',
    visionModel: 'llama3.2-vision',
    pricing: '0元（本地运行）',
    docsUrl: 'https://ollama.com',
    features: ['Llama 3.2', 'Qwen 2.5', 'Mistral', 'DeepSeek', '支持视觉模型'],
    supportsVision: true,
    local: true,
    localUrlField: true,
    fields: [
      { id: 'baseUrl', label: '本地地址', placeholder: 'http://localhost:11434' },
      { id: 'model', label: '模型名称', placeholder: 'llama3.2' },
    ],
  },
];

// AI服务商配置 - 支持图像识别的模型
const AI_PROVIDERS = [
  // OpenAI 系列
  {
    id: 'openai',
    name: 'OpenAI GPT-4o',
    description: 'GPT-4o 多模态模型，支持图像识别',
    supportsVision: true,
    model: 'gpt-4o',
    pricing: '¥0.05/图片（推荐）',
    docsUrl: 'https://platform.openai.com/api-keys',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'sk-...' },
    ],
  },
  {
    id: 'openai-gpt4v',
    name: 'OpenAI GPT-4V',
    description: 'OpenAI视觉模型，识别准确度高',
    supportsVision: true,
    model: 'gpt-4-vision-preview',
    pricing: '¥0.03/图片',
    docsUrl: 'https://platform.openai.com/api-keys',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'sk-...' },
    ],
  },
  // Google 系列
  {
    id: 'google',
    name: 'Google Gemini 2.0',
    description: 'Gemini 2.0 Flash，多模态免费',
    supportsVision: true,
    model: 'gemini-2.0-flash',
    pricing: '免费（每日1500次）',
    docsUrl: 'https://aistudio.google.com/apikey',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'AIza...' },
    ],
  },
  {
    id: 'google-pro',
    name: 'Google Gemini 1.5 Pro',
    description: 'Gemini 1.5 Pro，更强理解能力',
    supportsVision: true,
    model: 'gemini-1.5-pro',
    pricing: '¥0.1/图片',
    docsUrl: 'https://aistudio.google.com/apikey',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'AIza...' },
    ],
  },
  // DeepSeek 系列
  {
    id: 'deepseek',
    name: 'DeepSeek VL2',
    description: 'DeepSeek多模态视觉模型',
    supportsVision: true,
    model: 'deepseek-vl2',
    pricing: '¥0.02/图片（低价）',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'sk-...' },
    ],
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: '纯文本对话（不支持图片识别）',
    supportsVision: false,
    model: 'deepseek-chat',
    pricing: '¥0.001/千Token',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'sk-...' },
    ],
  },
  // 字节/火山引擎
  {
    id: 'bytedance',
    name: '字节豆包 VL',
    description: '字节跳动豆包视觉模型',
    supportsVision: true,
    model: 'doubao-vision-lite',
    pricing: '免费额度大',
    docsUrl: 'https://console.volcengine.com/ark',
    fields: [
      { id: 'apiKey', label: 'API Key (Volcengine)', placeholder: '请输入 Volcengine API Key' },
    ],
  },
  // 阿里通义
  {
    id: 'aliyun',
    name: '阿里通义 VL',
    description: '阿里云通义千问视觉模型',
    supportsVision: true,
    model: 'qwen-vl-plus',
    pricing: '¥0.05/图片',
    docsUrl: 'https://dashscope.console.aliyun.com/api-key',
    fields: [
      { id: 'apiKey', label: 'API Key (DashScope)', placeholder: 'sk-...' },
    ],
  },
  {
    id: 'aliyun-max',
    name: '通义万相 VL',
    description: '阿里云通义万相（更强视觉）',
    supportsVision: true,
    model: 'qwen-vl-max',
    pricing: '¥0.1/图片',
    docsUrl: 'https://dashscope.console.aliyun.com/api-key',
    fields: [
      { id: 'apiKey', label: 'API Key (DashScope)', placeholder: 'sk-...' },
    ],
  },
  // 百度文心
  {
    id: 'baidu',
    name: '百度文心 VL',
    description: '百度文心视觉模型',
    supportsVision: true,
    model: 'ernie-vilg-v2',
    pricing: '¥0.04/图片',
    docsUrl: 'https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
      { id: 'secretKey', label: 'Secret Key', placeholder: '请输入 Secret Key' },
    ],
  },
  // 智谱 GLM
  {
    id: 'zhipu',
    name: '智谱 GLM-4V',
    description: '智谱AI多模态模型',
    supportsVision: true,
    model: 'glm-4v',
    pricing: '¥0.03/图片',
    docsUrl: 'https://open.bigmodel.cn/console/apiusage',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
    ],
  },
  // 科大讯飞星火
  {
    id: 'iflytek',
    name: '讯飞星火 VL',
    description: '科大讯飞星火大模型',
    supportsVision: true,
    model: 'spark-vision',
    pricing: '免费额度',
    docsUrl: 'https://console.xfyun.cn/services/bm35',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
      { id: 'apiSecret', label: 'API Secret', placeholder: '请输入 API Secret' },
    ],
  },
  // Kimi（月之暗面）
  {
    id: 'moonshot',
    name: 'Kimi VL',
    description: 'Moonshot月之暗面视觉模型',
    supportsVision: true,
    model: 'moonshot-v1-8k-vision',
    pricing: '¥0.03/图片',
    docsUrl: 'https://platform.moonshot.cn/console/api-keys',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'sk-...' },
    ],
  },
  // MiniMax
  {
    id: 'minimax',
    name: 'MiniMax VL',
    description: 'MiniMax海螺AI视觉模型',
    supportsVision: true,
    model: 'abab6-vision',
    pricing: '¥0.02/图片',
    docsUrl: 'https://platform.minimaxi.com/console/api_keys',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
    ],
  },
  // 商汤日日新
  {
    id: 'sensetime',
    name: '商汤日日新 VL',
    description: '商汤科技多模态模型',
    supportsVision: true,
    model: 'sensechat-vision',
    pricing: '免费额度',
    docsUrl: 'https://console.sensetime.com/api-key',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
    ],
  },
  // 阶跃星辰
  {
    id: 'stepfun',
    name: '阶跃星辰 VL',
    description: 'StepFun阶跃星辰视觉模型',
    supportsVision: true,
    model: 'step-1v-8k',
    pricing: '¥0.02/图片',
    docsUrl: 'https://platform.stepfun.ai/console/api_keys',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
    ],
  },
  // 元石
  {
    id: 'metax',
    name: '元石 AI VL',
    description: '元石Yi视觉模型',
    supportsVision: true,
    model: 'yi-vision',
    pricing: '¥0.01/图片（低价）',
    docsUrl: 'https://metax.ai/api',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
    ],
  },
  // Grok (xAI)
  {
    id: 'grok',
    name: 'Grok Vision',
    description: 'xAI Grok多模态模型',
    supportsVision: true,
    model: 'grok-2-vision-latest',
    pricing: '¥0.03/图片',
    docsUrl: 'https://console.x.ai/',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'xai-...' },
    ],
  },
];

interface SettingsDialogProps {
  onConfigChange?: (config: ApiKeyConfig) => void;
}

const SettingsDialog = ({ onConfigChange }: SettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showFreeModels, setShowFreeModels] = useState(true); // 默认显示免费模型

  // 仅从当前页面会话的内存中加载配置，不持久化密钥。
  useEffect(() => {
    const saved = getEphemeralAiConfig();
    if (saved) {
        const config = saved;
        // 先在免费模型中查找
        let provider = FREE_AI_PROVIDERS.find(p => p.id === config.provider);
        // 如果找不到，再在常规模型中查找
        if (!provider) {
          provider = AI_PROVIDERS.find(p => p.id === config.provider);
        }
        if (provider) {
          setSelectedProvider(config.provider || 'openai');
          setApiKeys(config.keys || {});
          setShowFreeModels(!!FREE_AI_PROVIDERS.find(p => p.id === config.provider));
        } else {
          // 找不到该provider，使用默认
          setSelectedProvider('openai');
          setApiKeys({});
          toast.info('未找到已配置的服务商，已重置为默认');
        }
    }
  }, []);

  // 合并所有提供商（免费 + 常规）
  const allProviders = [...FREE_AI_PROVIDERS, ...AI_PROVIDERS];
  const currentProvider = allProviders.find(p => p.id === selectedProvider) || AI_PROVIDERS[0];

  const handleSave = async () => {
    // 从所有提供商中查找
    const provider = allProviders.find(p => p.id === selectedProvider);
    if (!provider) return;

    // 检查必填字段
    for (const field of provider.fields) {
      if (!apiKeys[field.id]?.trim()) {
        toast.error(`请填写 ${field.label}`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const config: ApiKeyConfig = {
        provider: selectedProvider,
        apiKey: apiKeys[provider.fields[0].id] || '',
        apiSecret: provider.fields[1] ? apiKeys[provider.fields[1].id] : undefined,
      };
      
      setEphemeralAiConfig({
        provider: selectedProvider,
        keys: apiKeys,
        model: (provider as any).model,
        visionModel: (provider as any).visionModel,
        supportsVision: provider.supportsVision,
        isLocal: (provider as any).local,
      });

      const enableText = provider.supportsVision 
        ? 'AI图片识别+AI脚本生成已启用' 
        : 'AI脚本生成已启用（图片识别使用本地模型）';
      toast.success(`${provider.name} 配置成功！${enableText}`);
      onConfigChange?.(config);
      setOpen(false);
    } catch (error) {
      console.error('Save config error:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <Settings className="w-4 h-4" />
          AI配置
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" style={{
        background: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
      }}>
        <DialogHeader>
          <DialogTitle>AI 模型配置</DialogTitle>
          <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
            配置API密钥，同时启用AI商品识别和AI创意脚本生成
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 免费模型专区 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <Label style={{ color: 'var(--primary)', fontWeight: 600 }}>免费大模型</Label>
              </div>
              <Badge variant="outline" className="text-xs">推荐</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {FREE_AI_PROVIDERS.map((provider) => (
                <Card
                  key={provider.id}
                  className={`cursor-pointer p-4 transition-all ${
                    selectedProvider === provider.id ? 'ring-2' : ''
                  }`}
                  style={{
                    background: selectedProvider === provider.id 
                      ? 'linear-gradient(135deg, var(--primary), oklch(0.55 0.18 350))' 
                      : 'var(--secondary)',
                    color: selectedProvider === provider.id ? 'var(--primary-foreground)' : 'var(--foreground)',
                    border: `2px solid ${selectedProvider === provider.id ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setShowFreeModels(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{provider.name}</span>
                          {provider.local && (
                            <Badge variant="outline" className="text-xs" style={{ 
                              borderColor: 'currentColor', 
                              color: 'inherit',
                              opacity: 0.8 
                            }}>
                              <Server className="w-3 h-3 mr-1" />本地
                            </Badge>
                          )}
                          {provider.supportsVision && (
                            <Image className="w-4 h-4" />
                          )}
                        </div>
                        <p className="text-xs mt-1 opacity-80">{provider.description}</p>
                      </div>
                    </div>
                    {selectedProvider === provider.id && <Check className="w-5 h-5" />}
                  </div>
                  <div className="mt-3 pt-3 border-t" style={{ 
                    borderColor: selectedProvider === provider.id ? 'rgba(255,255,255,0.3)' : 'var(--border)' 
                  }}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="opacity-60">支持模型:</span>
                      <div className="flex gap-1 flex-wrap">
                        {provider.features.slice(0, 3).map((feature, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-xs" style={{ 
                            background: selectedProvider === provider.id ? 'rgba(255,255,255,0.2)' : 'var(--background)' 
                          }}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium" style={{ 
                        color: selectedProvider === provider.id ? 'var(--primary-foreground)' : 'var(--primary)',
                        opacity: selectedProvider === provider.id ? 1 : 0.8
                      }}>
                        {provider.pricing}
                      </span>
                      {provider.local ? (
                        <a 
                          href={provider.docsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs underline flex items-center gap-1"
                          style={{ 
                            color: selectedProvider === provider.id ? 'var(--primary-foreground)' : 'var(--primary)',
                            opacity: 0.9
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          安装 Ollama <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <a 
                          href={provider.docsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs underline flex items-center gap-1"
                          style={{ 
                            color: selectedProvider === provider.id ? 'var(--primary-foreground)' : 'var(--primary)',
                            opacity: 0.9
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          获取API Key <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 分割线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2" style={{ background: 'var(--card)', color: 'var(--muted-foreground)' }}>
                其他AI服务商
              </span>
            </div>
          </div>

          {/* 其他服务商选择 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>选择AI服务商</Label>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
                  <Image className="w-3 h-3" /> 支持图片
                </span>
                <span className="flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                  <Zap className="w-3 h-3" /> 纯文本
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AI_PROVIDERS.map((provider) => (
                <Card
                  key={provider.id}
                  className={`cursor-pointer p-3 transition-all ${
                    selectedProvider === provider.id ? 'ring-2' : ''
                  }`}
                  style={{
                    background: selectedProvider === provider.id ? 'var(--primary)' : 'var(--secondary)',
                    color: selectedProvider === provider.id ? 'var(--primary-foreground)' : 'var(--foreground)',
                    border: `1px solid ${selectedProvider === provider.id ? 'var(--primary)' : 'var(--border)'}`,
                    opacity: !provider.supportsVision ? 0.7 : 1,
                  }}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setShowFreeModels(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm">{provider.name}</span>
                      {provider.supportsVision ? (
                        <Image className="w-3 h-3" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                    </div>
                    {selectedProvider === provider.id && <Check className="w-4 h-4" />}
                  </div>
                  {!provider.supportsVision && (
                    <p className="text-xs mt-1 opacity-70">不支持图片识别</p>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* 当前选择的模型信息 */}
          <div
            className="p-4 rounded-lg"
            style={{ 
              background: currentProvider.supportsVision ? 'var(--secondary)' : 'var(--muted)', 
              color: 'var(--foreground)',
              border: `2px solid ${(currentProvider as any).local ? 'var(--success)' : 'transparent'}`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {(currentProvider as any).local ? (
                <Badge variant="default" className="text-xs flex items-center gap-1" style={{ background: 'var(--success)', color: 'var(--foreground)' }}>
                  <Server className="w-3 h-3" /> 本地运行
                </Badge>
              ) : currentProvider.supportsVision ? (
                <Badge variant="default" className="text-xs flex items-center gap-1" style={{ background: 'var(--success)', color: 'var(--foreground)' }}>
                  <Image className="w-3 h-3" /> 支持图片识别
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs flex items-center gap-1" style={{ borderColor: 'var(--muted-foreground)', color: 'var(--muted-foreground)' }}>
                  <Zap className="w-3 h-3" /> 纯文本模型
                </Badge>
              )}
              <span className="font-medium">{currentProvider.name}</span>
              {(currentProvider as any).icon && (
                <span className="text-xl">{(currentProvider as any).icon}</span>
              )}
            </div>
            <p className="text-sm mb-1">{currentProvider.description}</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              默认模型: <code className="px-1 py-0.5 rounded" style={{ background: 'var(--background)' }}>{(currentProvider as any).model}</code>
            </p>
            {(currentProvider as any).visionModel && (
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                视觉模型: <code className="px-1 py-0.5 rounded" style={{ background: 'var(--background)' }}>{(currentProvider as any).visionModel}</code>
              </p>
            )}
            <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: 'var(--primary)' }}>
              <Gift className="w-4 h-4" />
              <span>{currentProvider.pricing}</span>
            </div>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {(currentProvider as any).local ? (
                  <>
                    <Download className="w-3 h-3 inline mr-1" />
                    安装 Ollama: 
                    <a 
                      href={currentProvider.docsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline ml-1 inline-flex items-center"
                      style={{ color: 'var(--primary)' }}
                    >
                      ollama.com <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                    <br/>
                    <span className="mt-1 block">安装后运行: <code className="px-1 py-0.5 rounded" style={{ background: 'var(--background)' }}>ollama pull llama3.2</code></span>
                  </>
                ) : (
                  <>
                    获取密钥: 
                    <a 
                      href={currentProvider.docsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline ml-1 inline-flex items-center"
                      style={{ color: 'var(--primary)' }}
                    >
                      访问控制台 <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* API密钥输入 */}
          {currentProvider.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                type="password"
                placeholder={field.placeholder}
                value={apiKeys[field.id] || ''}
                onChange={(e) => setApiKeys(prev => ({ ...prev, [field.id]: e.target.value }))}
                style={{
                  background: 'var(--input)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                }}
              />
            </div>
          ))}

          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            密钥将安全存储在本地浏览器，仅用于AI图像识别
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
          >
            {isSaving ? '保存中...' : currentProvider.supportsVision ? '保存并启用' : '保存（不支持图片）'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
