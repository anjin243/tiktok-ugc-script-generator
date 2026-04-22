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
import { toast } from 'sonner';
import { Settings, Info, Check, ExternalLink } from 'lucide-react';

interface ApiKeyConfig {
  provider: string;
  apiKey: string;
  apiSecret?: string;
}

// AI服务商配置（仅包含支持图像识别的服务商）
const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI GPT-4V',
    description: 'OpenAI视觉模型，识别准确度高',
    pricing: 'GPT-4o: ¥0.05/次图片识别（推荐）',
    docsUrl: 'https://platform.openai.com/api-keys',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Google多模态AI，免费额度大',
    pricing: '免费额度：每日1500次（强烈推荐）',
    docsUrl: 'https://aistudio.google.com/apikey',
    fields: [
      { id: 'apiKey', label: 'API Key', placeholder: '请输入 API Key' },
    ],
  },
  {
    id: 'tencent',
    name: '腾讯混元',
    description: '腾讯云AI（暂未实现API调用）',
    pricing: '免费额度：每月1000次',
    docsUrl: 'https://console.cloud.tencent.com/cam/capi',
    fields: [
      { id: 'secretId', label: 'SecretId', placeholder: '请输入 SecretId' },
      { id: 'secretKey', label: 'SecretKey', placeholder: '请输入 SecretKey' },
    ],
  },
  // DeepSeek 暂不支持图像API，需要本地部署 DeepSeek-VL2
];

interface SettingsDialogProps {
  onConfigChange?: (config: ApiKeyConfig) => void;
}

const SettingsDialog = ({ onConfigChange }: SettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 从本地存储加载配置
  useEffect(() => {
    const saved = localStorage.getItem('ai_api_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        // 如果之前配置的是DeepSeek，提示用户重新配置
        if (config.provider === 'deepseek') {
          setSelectedProvider('openai');
          setApiKeys({});
          toast.info('DeepSeek暂不支持图像识别，请重新选择服务商');
        } else {
          setSelectedProvider(config.provider || 'openai');
          setApiKeys(config.keys || {});
        }
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
  }, []);

  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider) || AI_PROVIDERS[0];

  const handleSave = async () => {
    const provider = AI_PROVIDERS.find(p => p.id === selectedProvider);
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
      
      localStorage.setItem('ai_api_config', JSON.stringify({
        provider: selectedProvider,
        keys: apiKeys,
      }));

      toast.success(`${provider.name} 配置成功！AI识别+AI脚本生成已启用`);
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
          {/* 服务商选择 */}
          <div className="space-y-2">
            <Label>选择AI服务商</Label>
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
                  }}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{provider.name}</span>
                    {selectedProvider === provider.id && <Check className="w-4 h-4" />}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 费用说明 */}
          <div 
            className="p-3 rounded-lg text-sm"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4" />
              <span className="font-medium">{currentProvider.name} 费用说明</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {currentProvider.pricing}
            </p>
          </div>

          {/* 获取密钥指引 */}
          <div 
            className="p-3 rounded-lg text-sm"
            style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
          >
            <p className="font-medium mb-2">如何获取API密钥？</p>
            <ol className="list-decimal list-inside space-y-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <li>
                点击访问 
                <a 
                  href={currentProvider.docsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline ml-1 inline-flex items-center"
                  style={{ color: 'var(--primary)' }}
                >
                  {currentProvider.name}控制台 <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </li>
              <li>登录账号后创建API密钥</li>
              <li>复制密钥填入下方输入框</li>
            </ol>
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
            {isSaving ? '保存中...' : '保存并启用'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
