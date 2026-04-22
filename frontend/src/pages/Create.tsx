import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives';
import { useCreateProject, useGenerateScript, useRecognizeImage } from '@/hooks/use-api';
import SettingsDialog from '@/components/SettingsDialog';
import { 
  UGC_STYLE_OPTIONS, 
  DURATION_OPTIONS, 
  CATEGORY_OPTIONS, 
  LANGUAGE_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  type UGCStyle,
  type Language,
  type AspectRatio,
  type CreateProjectInput,
} from '@/types';
import { toast } from 'sonner';
import { AlertCircle, X, Heart, Trash2 } from 'lucide-react';

type Step = 'product' | 'style' | 'generate' | 'result';

// 图片压缩函数
const compressImage = (file: File, maxSizeKB: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 创建 canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 计算缩放比例，限制最大尺寸
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 尝试不同的压缩质量
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // 逐步降低质量直到满足大小要求
        while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

const Create = () => {
  const navigate = useNavigate();
  const createProjectMutation = useCreateProject();
  const generateScriptMutation = useGenerateScript();
  const recognizeImageMutation = useRecognizeImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 识别状态
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  // 收藏状态
  const [isFavorited, setIsFavorited] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  
  // 检测API配置
  useEffect(() => {
    const saved = localStorage.getItem('ai_api_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setHasApiKey(!!config.provider && !!config.keys);
      } catch (e) {
        setHasApiKey(false);
      }
    }
  }, []);
  
  // 表单状态
  const [step, setStep] = useState<Step>('product');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [sellingPoints, setSellingPoints] = useState<string[]>(['']);
  
  // 新增：语言和视频比例
  const [language, setLanguage] = useState<Language>('zh-CN');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  
  // 新增：参考图
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [selectedStyle, setSelectedStyle] = useState<UGCStyle>('unboxing');
  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [projectName, setProjectName] = useState('');
  const [generatedProject, setGeneratedProject] = useState<any>(null);
  
  // 添加卖点
  const addSellingPoint = () => {
    if (sellingPoints.length < 10) {
      setSellingPoints([...sellingPoints, '']);
    }
  };
  
  // 更新卖点
  const updateSellingPoint = (index: number, value: string) => {
    const updated = [...sellingPoints];
    updated[index] = value;
    setSellingPoints(updated);
  };
  
  // 删除卖点
  const removeSellingPoint = (index: number) => {
    if (sellingPoints.length > 1) {
      setSellingPoints(sellingPoints.filter((_, i) => i !== index));
    }
  };
  
  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const filesToProcess = Array.from(files).slice(0, 5); // 最多5张
    
    if (filesToProcess.length === 0) {
      toast.error('请选择图片');
      return;
    }
    
    // 显示压缩状态
    const needsCompression = filesToProcess.some(file => file.size > 1024 * 1024);
    if (needsCompression) {
      setIsCompressing(true);
      toast.info('正在压缩图片，请稍候...');
    }
    
    // 压缩并处理所有图片
    try {
      const compressedImages: string[] = [];
      
      for (const file of filesToProcess) {
        try {
          const compressedUrl = await compressImage(file, 1024);
          compressedImages.push(compressedUrl);
        } catch (error) {
          console.error('Compress image error:', error);
          toast.error(`图片 ${file.name} 压缩失败`);
        }
      }
      
      if (compressedImages.length === 0) {
        toast.error('图片处理失败，请重试');
        return;
      }
      
      // 清空之前的预览和识别结果，重新开始
      setPreviewUrls(compressedImages);
      setReferenceImages(compressedImages);
      
      // 清空之前的识别结果
      setProductName('');
      setCategory(CATEGORY_OPTIONS[0]);
      
      // 对第一张图片进行AI识别
      setIsRecognizing(true);
      const firstImage = compressedImages[0];
      
      try {
        const result = await recognizeImageMutation.mutateAsync(firstImage);
        
        // 填入新的识别结果
        setProductName(result.productName);
        
        if (result.suggestions?.categories?.includes(result.category)) {
          setCategory(result.category);
        }
        
        // 根据API调用状态显示不同提示
        if (result.apiStatus === 'success') {
          toast.success(`${result.apiProviderName} API调用成功`, {
            description: `识别结果：${result.productName}（${result.category}）`,
            duration: 4000,
          });
        } else if (result.apiStatus === 'failed') {
          toast.error(`${result.apiProviderName} API调用失败`, {
            description: result.apiError || '请检查API密钥是否正确',
            duration: 5000,
          });
        } else {
          toast.info('演示模式：请手动填写商品信息', {
            description: `点击右上角「设置」配置API密钥启用AI识别`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Recognition failed:', error);
        toast.info('图片上传成功，请手动填写商品信息');
      } finally {
        setIsRecognizing(false);
      }
    } finally {
      setIsCompressing(false);
    }
    
    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 删除参考图
  const removeReferenceImage = async (index: number) => {
    const newImages = referenceImages.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    setReferenceImages(newImages);
    setPreviewUrls(newPreviews);
    
    // 如果删除的是第一张图片，且还有剩余图片，重新识别新的第一张
    if (index === 0 && newImages.length > 0) {
      setIsRecognizing(true);
      setProductName('');
      setCategory(CATEGORY_OPTIONS[0]);
      
      try {
        const result = await recognizeImageMutation.mutateAsync(newImages[0]);
        setProductName(result.productName);
        if (result.suggestions?.categories?.includes(result.category)) {
          setCategory(result.category);
        }
        
        if (result.apiStatus === 'success') {
          toast.success(`${result.apiProviderName} 识别成功`, {
            description: result.productName,
            duration: 3000,
          });
        } else if (result.apiStatus === 'failed') {
          toast.error(`API调用失败: ${result.apiError}`);
        }
      } catch (error) {
        console.error('Re-recognition failed:', error);
        toast.info('请手动填写商品信息');
      } finally {
        setIsRecognizing(false);
      }
    } else if (newImages.length === 0) {
      // 如果删除了所有图片，清空识别结果
      setProductName('');
      setCategory(CATEGORY_OPTIONS[0]);
    }
  };
  
  // 验证商品信息
  const canProceedToStyle = productName.trim() && category && sellingPoints.some(sp => sp.trim());
  
  // 创建项目并生成脚本
  const handleGenerate = async () => {
    if (!projectName.trim()) {
      toast.error('请输入项目名称');
      return;
    }
    
    try {
      // 创建项目
      const projectData: CreateProjectInput = {
        name: projectName,
        style: selectedStyle,
        duration,
        language,
        aspectRatio,
        referenceImages,
        product: {
          name: productName,
          price: parseFloat(price) || 1,
          category,
          sellingPoints: sellingPoints.filter(sp => sp.trim()),
        },
      };
      
      const project = await createProjectMutation.mutateAsync(projectData);
      
      // 获取API配置传给生成接口
      let apiConfig = undefined;
      const saved = localStorage.getItem('ai_api_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          apiConfig = { provider: parsed.provider, keys: parsed.keys };
        } catch {}
      }

      // 生成脚本
      const result = await generateScriptMutation.mutateAsync({
        projectId: project.id,
        productName,
        category,
        sellingPoints: sellingPoints.filter(sp => sp.trim()),
        style: selectedStyle,
        duration,
        language,
        aspectRatio,
        price: parseFloat(price) || undefined,
        referenceImages,
        config: apiConfig,
      });
      
      setGeneratedProject(result);
      setStep('result');
      
      // 检查当前项目是否已被收藏
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const isAlreadyFavorite = favorites.some((f: any) => f.id === result.project?.id);
      setIsFavorited(isAlreadyFavorite);
      
      // 根据是否使用AI显示不同提示
      if (result.usedAI) {
        toast.success(`${result.aiProvider} AI创意脚本生成成功！`);
      } else {
        toast.success('模板脚本生成成功！', {
          description: '配置API密钥可启用AI创意生成',
          duration: 5000,
        });
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.error 
        ? JSON.stringify(error.response.data.error) 
        : error?.message || '未知错误';
      toast.error('生成失败：' + errMsg, { duration: 8000 });
      console.error('生成失败详情:', error);
    }
  };
  
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <FadeIn>
            <h1 className="font-bold cursor-pointer" style={{ 
              fontSize: 'var(--font-size-title)',
              color: 'var(--foreground)',
            }} onClick={() => navigate('/')}>
              UGC 视频生成
            </h1>
          </FadeIn>
          <div className="flex gap-2">
            <SettingsDialog />
            {step !== 'product' && (
              <Button variant="outline" onClick={() => {
                if (step === 'style') setStep('product');
                if (step === 'generate') setStep('style');
                if (step === 'result') setStep('generate');
              }} style={{ color: 'var(--foreground)' }}>
                上一步
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* API配置提示横幅 */}
      {!hasApiKey && showBanner && step === 'product' && (
        <div 
          className="border-b"
          style={{ 
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderColor: '#f59e0b',
          }}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-amber-900">AI功能未启用：</span>
                  <span className="text-amber-700 ml-1">
                    点击右上角「AI配置」配置API密钥，启用AI识别+AI创意脚本生成（未配置则使用模板生成）
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowBanner(false)}
                className="p-1 rounded hover:bg-amber-200/50 transition-colors"
              >
                <X className="w-4 h-4 text-amber-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="container mx-auto px-4 py-6">
        <FadeIn>
          <div className="flex items-center justify-center gap-2 mb-8">
            {['product', 'style', 'generate', 'result'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{
                  background: step === s || ['product', 'style', 'generate', 'result'].indexOf(step) > i 
                    ? 'var(--primary)' 
                    : 'var(--secondary)',
                  color: step === s || ['product', 'style', 'generate', 'result'].indexOf(step) > i 
                    ? 'var(--primary-foreground)' 
                    : 'var(--muted-foreground)',
                }}>
                  {i + 1}
                </div>
                {i < 3 && (
                  <div className="w-12 h-1 mx-2" style={{
                    background: ['product', 'style', 'generate', 'result'].indexOf(step) > i 
                      ? 'var(--primary)' 
                      : 'var(--secondary)',
                  }} />
                )}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-20">
        {/* Step 1: Product Info */}
        {step === 'product' && (
          <FadeIn>
            <Card className="max-w-2xl mx-auto" style={{ 
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--foreground)' }}>商品信息</CardTitle>
                <CardDescription style={{ color: 'var(--muted-foreground)' }}>
                  填写要推广的商品信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="productName" style={{ color: 'var(--foreground)' }}>商品名称 *</Label>
                  <Input
                    id="productName"
                    placeholder="例如：某某品牌美白精华液"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    style={{
                      background: 'var(--input)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" style={{ color: 'var(--foreground)' }}>商品类目 *</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-md"
                      style={{
                        background: 'var(--input)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price" style={{ color: 'var(--foreground)' }}>价格（元）</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="例如：99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{
                        background: 'var(--input)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: 'var(--foreground)' }}>核心卖点 *</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={addSellingPoint}
                      disabled={sellingPoints.length >= 10}
                      style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
                    >
                      + 添加卖点
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {sellingPoints.map((sp, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`卖点 ${index + 1}`}
                          value={sp}
                          onChange={(e) => updateSellingPoint(index, e.target.value)}
                          className="flex-1"
                          style={{
                            background: 'var(--input)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)',
                          }}
                        />
                        {sellingPoints.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeSellingPoint(index)}
                            style={{ color: 'var(--destructive)', borderColor: 'var(--border)' }}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 参考图上传 */}
                <div className="space-y-2">
                  <Label style={{ color: 'var(--foreground)' }}>
                    参考图（最多5张）
                    {(isCompressing || isRecognizing) && (
                      <span className="ml-2 text-sm" style={{ color: 'var(--primary)' }}>
                        {isCompressing ? '压缩中...' : 'AI识别中...'}
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`参考图 ${index + 1}`} 
                          className="w-20 h-20 object-cover rounded-lg"
                          style={{ border: '1px solid var(--border)' }}
                        />
                        <button
                          onClick={() => removeReferenceImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ 
                            background: 'var(--destructive)', 
                            color: 'var(--primary-foreground)' 
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {referenceImages.length < 5 && (
                      <label 
                        className="w-20 h-20 rounded-lg flex items-center justify-center cursor-pointer"
                        style={{ 
                          border: '2px dashed var(--border)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        <span className="text-2xl">+</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isCompressing || isRecognizing}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    上传图片后请手动填写商品信息（演示模式，AI识别需配置API密钥）
                  </p>
                </div>
                
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canProceedToStyle}
                  onClick={() => setStep('style')}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  下一步：选择风格
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Step 2: Style Selection */}
        {step === 'style' && (
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <h2 className="text-center font-bold mb-8" style={{ 
                fontSize: 'var(--font-size-headline)',
                color: 'var(--foreground)',
              }}>
                选择视频配置
              </h2>
            </FadeIn>
            
            {/* UGC 风格 */}
            <FadeIn>
              <div className="mb-6">
                <h3 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>UGC 风格</h3>
                <Stagger className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {UGC_STYLE_OPTIONS.map((style) => (
                    <HoverLift key={style.value}>
                      <Card 
                        className="cursor-pointer transition-all p-3"
                        style={{ 
                          background: selectedStyle === style.value ? 'var(--primary)' : 'var(--card)',
                          border: `2px solid ${selectedStyle === style.value ? 'var(--primary)' : 'var(--border)'}`,
                          color: selectedStyle === style.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                        }}
                        onClick={() => setSelectedStyle(style.value)}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{style.icon}</div>
                          <h4 className="font-medium text-sm">{style.label}</h4>
                        </div>
                      </Card>
                    </HoverLift>
                  ))}
                </Stagger>
              </div>
            </FadeIn>
            
            {/* 视频比例 */}
            <FadeIn>
              <div className="mb-6">
                <h3 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>视频比例</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ASPECT_RATIO_OPTIONS.map((ratio) => (
                    <Card
                      key={ratio.value}
                      className="cursor-pointer transition-all p-3"
                      style={{ 
                        background: aspectRatio === ratio.value ? 'var(--primary)' : 'var(--card)',
                        border: `2px solid ${aspectRatio === ratio.value ? 'var(--primary)' : 'var(--border)'}`,
                        color: aspectRatio === ratio.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                      }}
                      onClick={() => setAspectRatio(ratio.value)}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold mb-1">{ratio.value}</div>
                        <div className="text-xs" style={{ 
                          color: aspectRatio === ratio.value ? 'var(--primary-foreground)' : 'var(--muted-foreground)' 
                        }}>
                          {ratio.description}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </FadeIn>
            
            {/* 目标语言 */}
            <FadeIn>
              <div className="mb-6">
                <h3 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>目标语言</h3>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full md:w-64 px-4 py-3 rounded-lg text-base"
                  style={{
                    background: 'var(--input)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </FadeIn>
            
            {/* 视频时长 */}
            <FadeIn>
              <div className="mb-6">
                <h3 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>视频时长</h3>
                <div className="flex gap-3">
                  {DURATION_OPTIONS.map((d) => (
                    <Button
                      key={d.value}
                      variant={duration === d.value ? 'default' : 'outline'}
                      onClick={() => setDuration(d.value)}
                      style={{
                        background: duration === d.value ? 'var(--primary)' : 'var(--secondary)',
                        color: duration === d.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>
            </FadeIn>
            
            {/* 项目名称 */}
            <FadeIn>
              <Card className="max-w-md mx-auto mb-6" style={{ 
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName" style={{ color: 'var(--foreground)' }}>项目名称</Label>
                    <Input
                      id="projectName"
                      placeholder="例如：美白精华带货视频"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      style={{
                        background: 'var(--input)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
            
            <FadeIn>
              <div className="text-center">
                <Button
                  size="lg"
                  disabled={!projectName.trim()}
                  onClick={() => setStep('generate')}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                  }}
                >
                  开始生成
                </Button>
              </div>
            </FadeIn>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generate' && (
          <FadeIn>
            <div className="max-w-md mx-auto text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center animate-pulse" style={{
                background: 'var(--primary)',
              }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--primary-foreground)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="font-bold mb-2" style={{ 
                fontSize: 'var(--font-size-headline)',
                color: 'var(--foreground)',
              }}>
                {hasApiKey ? 'AI 大模型正在创作脚本...' : '正在生成模板脚本...'}
              </h2>
              <p style={{ color: 'var(--muted-foreground)' }}>
                {hasApiKey 
                  ? 'AI编导正在根据你的商品信息创意构思，可能需要10-20秒' 
                  : '正在使用模板生成脚本，配置API密钥可启用AI创意生成'}
              </p>
              
              {/* 显示错误信息 */}
              {(createProjectMutation.isError || generateScriptMutation.isError) && (
                <div className="mt-4 p-3 rounded-lg text-sm text-left" style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--foreground)',
                }}>
                  <p className="font-medium mb-1">生成出错</p>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    {createProjectMutation.isError ? '创建项目失败' : '生成脚本失败'}
                  </p>
                </div>
              )}
              
              {/* 自动执行生成 */}
              {!generateScriptMutation.isPending && !generatedProject && (
                <Button
                  className="mt-6"
                  onClick={handleGenerate}
                  disabled={createProjectMutation.isPending || generateScriptMutation.isPending}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  {createProjectMutation.isPending || generateScriptMutation.isPending ? '生成中...' : '开始生成'}
                </Button>
              )}
            </div>
          </FadeIn>
        )}

        {/* Step 4: Result */}
        {step === 'result' && generatedProject && (
          <div className="max-w-5xl mx-auto">
            {/* ====== 生成方式 醒目横幅 ====== */}
            <FadeIn>
              {generatedProject.usedAI ? (
                <div className="mb-6 p-5 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  border: '3px solid #6366f1',
                }}>
                  <div className="text-center">
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                      ✨ AI 创意生成
                    </div>
                    <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)' }}>
                      本次脚本由 <strong>{generatedProject.aiProvider}</strong> 大模型实时创作，内容独特有创意
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-5 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: '3px solid #f59e0b',
                }}>
                  <div className="text-center">
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                      📋 模板生成（本地模拟）
                    </div>
                    <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)' }}>
                      当前为固定模板填充，每次结果相同。点击右上角「AI配置」接入大模型可获得独特创意脚本
                    </div>
                  </div>
                </div>
              )}
            </FadeIn>

            <FadeIn>
              <div className="text-center mb-8">
                <Badge className="mb-4 px-4 py-2" style={{ 
                  background: 'var(--success)',
                  color: 'var(--success-foreground)',
                }}>
                  生成成功
                </Badge>
                <h2 className="font-bold mb-2" style={{ 
                  fontSize: 'var(--font-size-headline)',
                  color: 'var(--foreground)',
                }}>
                  {projectName}
                </h2>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  {productName} · {UGC_STYLE_OPTIONS.find(s => s.value === selectedStyle)?.label} · {duration}秒 · {aspectRatio} · {LANGUAGE_OPTIONS.find(l => l.value === language)?.label}
                </p>
              </div>
            </FadeIn>

            {/* AI Video Prompts - 核心功能 */}
            <FadeIn>
              <Card className="mb-6" style={{ 
                background: 'var(--card)',
                border: '2px solid var(--primary)',
              }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle style={{ color: 'var(--foreground)' }}>🎬 AI视频生成提示词</CardTitle>
                      <CardDescription style={{ color: 'var(--muted-foreground)' }}>
                        专为 Veo3.1、即梦、可灵、Runway Gen-3、Pika、Sora 优化的英文提示词
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const allPrompts = generatedProject.scenes?.map((s: any) => s.visualPrompt).join('\n\n---\n\n') || '';
                        navigator.clipboard.writeText(allPrompts);
                        alert('已复制所有英文提示词！');
                      }}
                      style={{
                        background: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                      }}
                    >
                      复制全部英文提示词
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Stagger className="space-y-4">
                    {generatedProject.scenes?.map((scene: any, index: number) => (
                      <HoverLift key={scene.id || index}>
                        <div className="p-4 rounded-lg" style={{ 
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                          border: '1px solid var(--border)',
                        }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                                Scene {scene.order}
                              </Badge>
                              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                {scene.startTime}s - {scene.endTime}s
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(scene.visualPrompt || '');
                                alert('已复制该场景英文提示词！');
                              }}
                              style={{ 
                                color: 'var(--primary)',
                                borderColor: 'var(--primary)',
                              }}
                            >
                              复制英文
                            </Button>
                          </div>
                          
                          {/* 英文提示词 - 给AI视频模型 */}
                          <div className="mb-3 p-3 rounded" style={{ 
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                          }}>
                            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                              📹 Visual Prompt (English)
                            </div>
                            <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                              {scene.visualPrompt}
                            </p>
                          </div>
                          
                          {/* 中文描述 */}
                          <div className="p-3 rounded" style={{ 
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                          }}>
                            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                              📝 中文描述
                            </div>
                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                              {scene.visualPromptCN}
                            </p>
                          </div>
                          
                          {/* 镜头参数 */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                            {scene.cameraMovement && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--background)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>镜头运动:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.cameraMovement}</span>
                              </div>
                            )}
                            {scene.cameraAngle && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--background)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>镜头角度:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.cameraAngle}</span>
                              </div>
                            )}
                            {scene.cameraDistance && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--background)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>景别:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.cameraDistance}</span>
                              </div>
                            )}
                            {scene.lighting && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--background)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>灯光:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.lighting}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            {scene.mood && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--background)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>情绪:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.mood}</span>
                              </div>
                            )}
                            {scene.colorTone && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--background)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>色调:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.colorTone}</span>
                              </div>
                            )}
                            {scene.transition && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--background)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>转场:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.transition}</span>
                              </div>
                            )}
                            {scene.subject && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--background)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>主体:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.subject}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* 口播和音乐建议 */}
                          {scene.voiceover && (
                            <div className="mt-3 p-2 rounded text-sm" style={{ 
                              background: 'rgba(251, 191, 36, 0.1)',
                              border: '1px solid rgba(251, 191, 36, 0.3)',
                              color: 'var(--foreground)',
                            }}>
                              🎤 口播: {scene.voiceover}
                            </div>
                          )}
                          {scene.musicSuggestion && (
                            <div className="mt-2 p-2 rounded text-sm" style={{ 
                              background: 'rgba(236, 72, 153, 0.1)',
                              border: '1px solid rgba(236, 72, 153, 0.3)',
                              color: 'var(--foreground)',
                            }}>
                              🎵 音乐建议: {scene.musicSuggestion}
                            </div>
                          )}
                        </div>
                      </HoverLift>
                    ))}
                  </Stagger>
                </CardContent>
              </Card>
            </FadeIn>
            
            {/* 完整脚本 */}
            <FadeIn>
              <Card className="mb-6" style={{ 
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: 'var(--foreground)' }}>完整脚本预览</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedProject.script || '');
                        alert('已复制完整脚本！');
                      }}
                      style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
                    >
                      复制脚本
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm p-4 rounded-lg" style={{ 
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}>
                    {generatedProject.script}
                  </pre>
                </CardContent>
              </Card>
            </FadeIn>
            
            {/* 口播文案 */}
            <FadeIn>
              <Card className="mb-6" style={{ 
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: 'var(--foreground)' }}>口播文案</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedProject.voiceover || '');
                        alert('已复制口播文案！');
                      }}
                      style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
                    >
                      复制口播
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm p-4 rounded-lg" style={{ 
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}>
                    {generatedProject.voiceover}
                  </pre>
                </CardContent>
              </Card>
            </FadeIn>
            
            {/* 音乐风格 */}
            <FadeIn>
              <Card className="mb-6" style={{ 
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--foreground)' }}>音乐推荐</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{ color: 'var(--muted-foreground)' }}>{generatedProject.musicStyle}</p>
                </CardContent>
              </Card>
            </FadeIn>
            
            {/* 使用指南 */}
            <FadeIn>
              <Card className="mb-6" style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))',
                border: '1px solid var(--primary)',
              }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--foreground)' }}>💡 如何使用这些提示词</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <p><strong>Veo3.1 / Google:</strong> 直接粘贴英文提示词，系统会自动理解镜头运动</p>
                    <p><strong>即梦 / 可灵:</strong> 复制英文提示词，系统支持中文时可用中文描述</p>
                    <p><strong>Runway Gen-3:</strong> 推荐使用英文提示词，配合镜头运动关键词</p>
                    <p><strong>Pika:</strong> 英文提示词效果最佳，支持镜头控制参数</p>
                    <p><strong>Sora:</strong> 直接粘贴完整英文提示词即可</p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
            
            {/* Actions */}
            <FadeIn>
              <div className="flex gap-4 justify-center pb-8">
                {/* 收藏按钮 */}
                <Button
                  variant={isFavorited ? "default" : "outline"}
                  size="lg"
                  onClick={() => {
                    // 收藏项目
                    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                    const newFavorite = {
                      id: generatedProject.project?.id || Date.now().toString(),
                      name: projectName,
                      productName,
                      style: selectedStyle,
                      duration,
                      createdAt: new Date().toISOString(),
                    };
                    
                    if (isFavorited) {
                      // 取消收藏
                      const updated = favorites.filter((f: any) => f.id !== newFavorite.id);
                      localStorage.setItem('favorites', JSON.stringify(updated));
                      setIsFavorited(false);
                      toast.success('已取消收藏');
                    } else {
                      // 添加收藏
                      favorites.push(newFavorite);
                      localStorage.setItem('favorites', JSON.stringify(favorites));
                      setIsFavorited(true);
                      toast.success('已收藏到本地');
                    }
                  }}
                  style={{
                    background: isFavorited ? 'var(--primary)' : 'transparent',
                    color: isFavorited ? 'var(--primary-foreground)' : 'var(--foreground)',
                    borderColor: isFavorited ? 'var(--primary)' : 'var(--border)',
                  }}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? '已收藏' : '收藏'}
                </Button>
                
                {/* 删除按钮 */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (window.confirm('确定要删除这个项目吗？此操作不可恢复。')) {
                      // 删除项目
                      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
                      const updatedProjects = projects.filter((p: any) => p.id !== generatedProject.project?.id);
                      localStorage.setItem('projects', JSON.stringify(updatedProjects));
                      
                      toast.success('项目已删除');
                      navigate('/projects');
                    }
                  }}
                  style={{ 
                    color: 'var(--destructive)',
                    borderColor: 'var(--destructive)',
                  }}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  删除
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/projects')}
                  style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
                >
                  查看我的项目
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    setStep('product');
                    setGeneratedProject(null);
                    setProductName('');
                    setPrice('');
                    setSellingPoints(['']);
                    setProjectName('');
                    setReferenceImages([]);
                    setPreviewUrls([]);
                  }}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  创建新项目
                </Button>
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </div>
  );
};

export default Create;
