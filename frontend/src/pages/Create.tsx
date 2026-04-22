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
  CATEGORY_OPTIONS,
  CATEGORY_GROUPS,
  LANGUAGE_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  VIDEO_MODEL_OPTIONS,
  getVideoModelConfig,
  getModelDefaultDuration,
  formatDuration,
  STYLE_PRESETS,
  STYLE_CATEGORIES,
  STYLE_TAGS,
  type UGCStyle,
  type Language,
  type AspectRatio,
  type VideoModel,
  type CreateProjectInput,
  type StyleMode,
  type StylePreset,
} from '@/types';
import { toast } from 'sonner';
import { AlertCircle, X, Heart, Trash2, ChevronDown, ChevronRight, Search, Sparkles, Video, Clock, Globe, Settings, Check, Camera, Music, FileText, Shuffle, Wand2, Tag, X as XIcon } from 'lucide-react';

type Step = 'product' | 'style' | 'generate' | 'result';

// ── 智能推荐卖点函数 ──
const SELLING_POINT_TEMPLATES: Record<string, string[]> = {
  default: [
    '高性价比，品质卓越',
    '简约设计，时尚百搭',
    '材质环保，安全无刺激',
    '便携轻巧，随身携带',
    '做工精细，细节到位',
    '大品牌，值得信赖',
    '售后无忧，服务贴心',
    '限量发售，抢到就是赚到',
    '明星同款，潮流首选',
    '收藏佳品，升值潜力大',
    '礼品首选，送礼有面子',
    '亏本促销，错过不再有',
  ],
  beauty: [
    '深层补水，肌肤焕亮',
    '温和配方，敏感肌适用',
    '快速吸收，不油腻',
    '持久妆效，一整天精致',
    '天然成分，护肤更安心',
    '提亮肤色，暗沉byebye',
    '控油定妆，告别脱妆',
    '男女通用，全家可用',
    '平价替代，大牌品质',
  ],
  fashion: [
    '面料舒适，透气不闷',
    '版型修身，显瘦显高',
    '做工精细，走线均匀',
    '颜色正，不褪色不变形',
    '百搭款式，通勤休闲皆可',
    '轻盈飘逸，仙气满满',
    '挺括有型，不起皱',
    '弹性十足，活动自如',
  ],
  food: [
    '食材新鲜，健康无添加',
    '口感醇香，回味无穷',
    '独立包装，干净卫生',
    '营养均衡，老少皆宜',
    '方便快捷，随时享用',
    '低脂低卡，减肥也能吃',
    '有机认证，吃得放心',
    '香脆可口，根本停不下来',
  ],
  digital: [
    '性能强劲，运行流畅',
    '超长续航，告别电量焦虑',
    '高清屏幕，视觉享受',
    '轻便易携，随身使用',
    '拍照神器，随手出大片',
    '游戏畅玩，不卡顿',
    '护眼模式，关爱双眼',
  ],
  home: [
    '收纳有序，空间翻倍',
    '材质坚固，承重力强',
    '清洁省力，事半功倍',
    '静音设计，不扰生活',
    '美观实用，装饰居家',
    '节能环保，省钱省心',
  ],
  母婴: [
    '安全材质，宝宝放心用',
    '柔软亲肤，呵护娇嫩肌肤',
    '易清洗消毒，卫生保障',
    '轻便折叠，外出携带方便',
    '成长可用，从新生儿到儿童',
    '无毒无味，呼吸更健康',
  ],
  运动户外: [
    '吸湿排汗，保持干爽',
    '弹力面料，运动自如',
    '轻量设计，轻装上阵',
    '防晒透气，户外必备',
    '耐磨耐穿，经久耐用',
    '速干功能，告别湿身',
  ],
};

const getRecommendedSellingPoints = (
  productName: string,
  category: string,
  count: number = 12,
  excludeList: string[] = []
): string[] => {
  const nameLower = productName.toLowerCase();
  const categoryLower = category.toLowerCase();

  let templates = SELLING_POINT_TEMPLATES.default;

  if (/护肤|美妆|彩妆|口红|粉底|精华|面霜|防晒/.test(categoryLower + nameLower)) {
    templates = SELLING_POINT_TEMPLATES.beauty;
  } else if (/服装|裙子|裤子|外套|鞋子|包包|配饰/.test(categoryLower + nameLower)) {
    templates = SELLING_POINT_TEMPLATES.fashion;
  } else if (/零食|饮料|食品|咖啡|茶|保健品/.test(categoryLower + nameLower)) {
    templates = SELLING_POINT_TEMPLATES.food;
  } else if (/手机|电脑|平板|耳机|音箱|相机|数码/.test(categoryLower + nameLower)) {
    templates = SELLING_POINT_TEMPLATES.digital;
  } else if (/收纳|清洁|家居|家具|厨具|床上/.test(categoryLower + nameLower)) {
    templates = SELLING_POINT_TEMPLATES.home;
  } else if (/母婴|婴儿|奶粉|尿裤|玩具/.test(categoryLower + nameLower)) {
    templates = SELLING_POINT_TEMPLATES['母婴'];
  } else if (/运动|跑步|健身|户外|瑜伽/.test(categoryLower + nameLower)) {
    templates = SELLING_POINT_TEMPLATES['运动户外'];
  }

  const available = templates.filter(t => !excludeList.includes(t) && t.length <= 60);
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const compressImage = (file: File, maxSizeKB: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

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

        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

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

// 折叠面板组件
interface AccordionItemProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary?: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isRequired?: boolean;
}

const AccordionItem = ({ id, title, icon, summary, children, isOpen, onToggle, isRequired }: AccordionItemProps) => (
  <div className="rounded-xl overflow-hidden" style={{
    background: 'var(--card)',
    border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border)'}`,
  }}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-5 py-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: isOpen ? 'var(--primary)' : 'var(--secondary)',
          color: isOpen ? 'var(--primary-foreground)' : 'var(--foreground)',
        }}>
          {icon}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{title}</span>
            {isRequired && (
              <Badge variant="outline" className="text-xs" style={{
                borderColor: 'var(--destructive)',
                color: 'var(--destructive)',
              }}>
                必选
              </Badge>
            )}
          </div>
          {summary && (
            <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {summary}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isOpen && (
          <Check className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        )}
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{
          color: 'var(--muted-foreground)',
        }} />
      </div>
    </button>
    {isOpen && (
      <div className="px-5 pb-5">
        {children}
      </div>
    )}
  </div>
);

const Create = () => {
  const navigate = useNavigate();
  const createProjectMutation = useCreateProject();
  const generateScriptMutation = useGenerateScript();
  const recognizeImageMutation = useRecognizeImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

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

  const [step, setStep] = useState<Step>('product');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [sellingPoints, setSellingPoints] = useState<string[]>(['']);

  const [language, setLanguage] = useState<Language>('zh-CN');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 内容风格状态（支持多种模式）
  const [styleMode, setStyleMode] = useState<StyleMode>('preset');
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(STYLE_PRESETS[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [randomSeed, setRandomSeed] = useState(0);
  
  const [videoModel, setVideoModel] = useState<VideoModel>('jimeng');
  const [duration, setDuration] = useState<number>(getModelDefaultDuration('jimeng'));
  const [projectName, setProjectName] = useState('');
  const [generatedProject, setGeneratedProject] = useState<any>(null);

  // Step 2 折叠面板状态
  const [openPanels, setOpenPanels] = useState<string[]>(['model']);

  const togglePanel = (panelId: string) => {
    setOpenPanels(prev =>
      prev.includes(panelId)
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  };

  const togglePanelAndCloseOthers = (panelId: string) => {
    setOpenPanels(prev =>
      prev.includes(panelId)
        ? prev.includes(panelId) ? prev.filter(id => id !== panelId) : prev
        : [panelId]
    );
  };

  // ========== 内容风格相关函数 ==========
  
  // 切换风格模式
  const switchStyleMode = (mode: StyleMode) => {
    setStyleMode(mode);
    if (mode === 'random') {
      // 随机模式：随机选择一个风格
      const randomIndex = Math.floor(Math.random() * STYLE_PRESETS.length);
      setSelectedStyle(STYLE_PRESETS[randomIndex]);
      setRandomSeed(prev => prev + 1);
    }
  };

  // 随机切换风格
  const shuffleStyle = () => {
    const currentIndex = STYLE_PRESETS.findIndex(s => s.value === selectedStyle?.value);
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * STYLE_PRESETS.length);
    } while (newIndex === currentIndex && STYLE_PRESETS.length > 1);
    setSelectedStyle(STYLE_PRESETS[newIndex]);
    setRandomSeed(prev => prev + 1);
  };

  // 切换标签
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // 根据选中的标签过滤风格
  const filteredStyles = selectedTags.length > 0
    ? STYLE_PRESETS.filter(style => 
        selectedTags.some(tagId => style.tags.includes(tagId))
      )
    : STYLE_PRESETS;

  // 获取当前风格的摘要文本
  const getStyleSummary = () => {
    switch (styleMode) {
      case 'preset':
        return selectedStyle ? `${selectedStyle.icon} ${selectedStyle.label}` : '请选择风格';
      case 'ai-recommend':
        return '✨ AI智能推荐';
      case 'custom':
        return customPrompt ? `📝 ${customPrompt.slice(0, 20)}${customPrompt.length > 20 ? '...' : ''}` : '请描述风格';
      case 'random':
        return selectedStyle ? `${selectedStyle.icon} ${selectedStyle.label} (随机)` : '随机风格';
      default:
        return '';
    }
  };

  // 核心卖点推荐状态
  const [activeSuggestIndex, setActiveSuggestIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [usedSuggestions, setUsedSuggestions] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sellingPointRefs = useRef<(HTMLInputElement | null)[]>([]);

  const checkAIConfigured = () => {
    try {
      const saved = localStorage.getItem('ai_api_config');
      if (saved) {
        const parsed = JSON.parse(saved) as { keys?: Record<string, string | undefined> };
        if (parsed.keys) {
          return Object.values(parsed.keys).some(v => v && typeof v === 'string' && v.trim());
        }
      }
    } catch { }
    return false;
  };

  const checkSupportsVision = () => {
    try {
      const saved = localStorage.getItem('ai_api_config');
      if (saved) {
        const parsed = JSON.parse(saved) as { supportsVision?: boolean };
        return parsed.supportsVision === true;
      }
    } catch { }
    return false;
  };

  const generateAIRecommendations = async (
    productName: string,
    category: string,
    count: number = 12,
    excludeList: string[] = []
  ): Promise<string[]> => {
    const hasAI = checkAIConfigured();

    if (hasAI) {
      try {
        const response = await fetch('/api/ai/recommend-selling-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName, category }),
        });
        if (response.ok) {
          const data = await response.json();
          return data.suggestions || [];
        }
      } catch { }
    }

    return getRecommendedSellingPoints(productName, category, count, excludeList);
  };

  // 类目选择器状态
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['fashion']);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const expandAllGroups = () => {
    setExpandedGroups(CATEGORY_GROUPS.map(g => g.id));
  };

  const collapseAllGroups = () => {
    setExpandedGroups([]);
  };

  const selectCategory = (cat: string) => {
    setCategory(cat);
    setShowCategoryDropdown(false);
    setCategorySearch('');
  };

  const filteredGroups = categorySearch.trim()
    ? CATEGORY_GROUPS.map(group => ({
        ...group,
        children: group.children.filter(cat =>
          cat.toLowerCase().includes(categorySearch.toLowerCase())
        ),
      })).filter(group => group.children.length > 0)
    : CATEGORY_GROUPS;

  const handleSellingPointFocus = async (index: number) => {
    if (!productName.trim()) {
      toast.info('请先填写商品名称');
      return;
    }

    setActiveSuggestIndex(index);
    setUsedSuggestions([]);

    const recommended = await generateAIRecommendations(productName, category);
    setSuggestions(recommended);
  };

  const selectSuggestion = async (suggestion: string) => {
    if (activeSuggestIndex !== null) {
      const currentValue = sellingPoints[activeSuggestIndex] || '';
      const separator = currentValue ? '、' : '';
      const newValue = currentValue + separator + suggestion;

      if (newValue.length > 60) {
        toast.warning('已达到60字符限制！');
        return;
      }

      updateSellingPoint(activeSuggestIndex, newValue);

      setUsedSuggestions(prev => {
        const newUsed = [...prev, suggestion];
        setIsLoadingMore(true);
        generateAIRecommendations(productName, category, 12, newUsed)
          .then(newSuggestions => {
            setSuggestions(newSuggestions);
            setIsLoadingMore(false);
          });
        return newUsed;
      });
    }
  };

  const loadMoreSuggestions = async () => {
    setIsLoadingMore(true);
    const currentUsed = usedSuggestions;
    const newUsed = [...currentUsed, ...suggestions];
    setUsedSuggestions(newUsed);
    const newSuggestions = await generateAIRecommendations(productName, category, 12, newUsed);
    setSuggestions(newSuggestions);
    setIsLoadingMore(false);
    if (newSuggestions.length === 0) {
      toast.info('已无更多推荐，请直接输入');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (activeSuggestIndex !== null) {
        const target = event.target as HTMLElement;
        if (target.closest('.selling-point-bubbles')) return;
        const inputRef = sellingPointRefs.current[activeSuggestIndex];
        if (inputRef && inputRef.contains(target)) return;
        setActiveSuggestIndex(null);
        setSuggestions([]);
        setUsedSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSuggestIndex]);

  const updateSellingPoint = (index: number, value: string) => {
    if (value.length > 60) {
      toast.warning('卖点不能超过60个字符！');
      return;
    }
    const updated = [...sellingPoints];
    updated[index] = value;
    setSellingPoints(updated);
  };

  const removeSellingPoint = (index: number) => {
    if (sellingPoints.length > 1) {
      setSellingPoints(sellingPoints.filter((_, i) => i !== index));
      if (activeSuggestIndex === index) {
        setActiveSuggestIndex(null);
        setSuggestions([]);
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const filesToProcess = Array.from(files).slice(0, 5);

    if (filesToProcess.length === 0) {
      toast.error('请选择图片');
      return;
    }

    const needsCompression = filesToProcess.some(file => file.size > 1024 * 1024);
    if (needsCompression) {
      setIsCompressing(true);
      toast.info('正在压缩图片，请稍候...');
    }

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

      setPreviewUrls(compressedImages);
      setReferenceImages(compressedImages);

      setProductName('');
      setCategory(CATEGORY_OPTIONS[0]);

      setIsRecognizing(true);
      const firstImage = compressedImages[0];

      try {
        const result = await recognizeImageMutation.mutateAsync(firstImage);

        setProductName(result.productName);

        if (result.suggestions?.categories?.includes(result.category)) {
          setCategory(result.category);
        }

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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeReferenceImage = async (index: number) => {
    const newImages = referenceImages.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    setReferenceImages(newImages);
    setPreviewUrls(newPreviews);

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
      setProductName('');
      setCategory(CATEGORY_OPTIONS[0]);
    }
  };

  const canProceedToStyle = productName.trim() && category && sellingPoints.some(sp => sp.trim());

  const handleGenerate = async () => {
    if (!projectName.trim()) {
      toast.error('请输入项目名称');
      return;
    }

    // 验证风格选择
    if (styleMode === 'preset' && !selectedStyle) {
      toast.error('请选择一个内容风格');
      return;
    }
    if (styleMode === 'custom' && !customPrompt.trim()) {
      toast.error('请输入自定义风格描述');
      return;
    }

    try {
      const projectData: CreateProjectInput = {
        name: projectName,
        style: selectedStyle,
        styleMode,
        styleCustomPrompt: customPrompt,
        styleTags: selectedTags,
        duration,
        videoModel,
        language,
        aspectRatio,
        referenceImages,
        product: {
          name: productName,
          category,
          sellingPoints: sellingPoints.filter(sp => sp.trim()),
        },
      };

      const project: any = await createProjectMutation.mutateAsync(projectData);

      let apiConfig = undefined;
      const saved = localStorage.getItem('ai_api_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          apiConfig = { provider: parsed.provider, keys: parsed.keys };
        } catch { }
      }

      const result: any = await generateScriptMutation.mutateAsync({
        projectId: project.id,
        productName,
        category,
        sellingPoints: sellingPoints.filter(sp => sp.trim()),
        style: selectedStyle,
        styleMode,
        styleCustomPrompt: customPrompt,
        styleTags: selectedTags,
        duration,
        videoModel,
        language,
        aspectRatio,
        referenceImages,
        config: apiConfig,
      });

      setGeneratedProject(result);
      setStep('result');

      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const isAlreadyFavorite = favorites.some((f: any) => f.id === result.project?.id);
      setIsFavorited(isAlreadyFavorite);

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
      <header className="border-b sticky top-0 z-40" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
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
              <CardContent className="space-y-5">
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

                {/* 商品类目选择器 */}
                <div className="space-y-2" ref={categoryRef}>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: 'var(--foreground)' }}>商品类目 *</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={expandAllGroups}
                        className="text-xs px-2 py-1 rounded hover:bg-accent/20 transition-colors"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        全部展开
                      </button>
                      <button
                        type="button"
                        onClick={collapseAllGroups}
                        className="text-xs px-2 py-1 rounded hover:bg-accent/20 transition-colors"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        全部收起
                      </button>
                    </div>
                  </div>

                  <div
                    className="w-full px-4 py-3 rounded-lg cursor-pointer flex items-center justify-between"
                    style={{
                      background: 'var(--input)',
                      border: showCategoryDropdown ? '2px solid var(--primary)' : '1px solid var(--border)',
                      color: 'var(--foreground)',
                      minHeight: '52px',
                    }}
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{CATEGORY_GROUPS.find(g => g.children.includes(category))?.icon || '📦'}</span>
                      <span className="text-base">{category || '请选择商品类目'}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {showCategoryDropdown && (
                    <div
                      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
                      style={{ background: 'rgba(0,0,0,0.5)' }}
                      onClick={() => setShowCategoryDropdown(false)}
                    >
                      <div
                        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                        style={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                            <input
                              type="text"
                              placeholder="搜索商品类目..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 rounded-xl text-base"
                              style={{
                                background: 'var(--input)',
                                color: 'var(--foreground)',
                                border: '1px solid var(--border)',
                              }}
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-3">
                          {filteredGroups.map((group) => (
                            <div key={group.id} className="mb-3">
                              <button
                                type="button"
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-semibold hover:bg-accent/30 transition-colors"
                                style={{ color: 'var(--primary)' }}
                                onClick={() => toggleGroup(group.id)}
                              >
                                <span className="text-xl">{group.icon}</span>
                                <span>{group.name}</span>
                                <span className="text-xs ml-auto opacity-60">({group.children.length})</span>
                                {expandedGroups.includes(group.id) ? (
                                  <ChevronDown className="w-5 h-5 ml-2" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 ml-2" />
                                )}
                              </button>

                              {expandedGroups.includes(group.id) && (
                                <div className="grid grid-cols-2 gap-2 mt-2 ml-2">
                                  {group.children.map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                                      style={{
                                        background: category === cat ? 'var(--primary)' : 'var(--input)',
                                        color: category === cat ? 'var(--primary-foreground)' : 'var(--foreground)',
                                        border: category === cat ? '2px solid var(--primary)' : '1px solid var(--border)',
                                      }}
                                      onClick={() => selectCategory(cat)}
                                    >
                                      {category === cat && <span className="mr-2">✓</span>}
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}

                          {filteredGroups.length === 0 && (
                            <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
                              <div className="text-4xl mb-3">🔍</div>
                              <div>未找到匹配的类目</div>
                              <div className="text-sm mt-1">试试其他关键词</div>
                            </div>
                          )}
                        </div>

                        <div className="p-4 border-t text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                          <span className="text-sm">点击外部区域或选择类目后关闭</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 核心卖点模块 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: 'var(--foreground)' }}>
                      核心卖点 *
                      <span className="ml-2 text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>
                        (最多60字，点击获取AI推荐)
                      </span>
                    </Label>
                  </div>
                  <div className="space-y-3">
                    {sellingPoints.map((sp, index) => (
                      <div key={index} className="relative">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Input
                              ref={(el) => { sellingPointRefs.current[index] = el; }}
                              placeholder={`卖点 ${index + 1} - 点击获取推荐`}
                              value={sp}
                              onChange={(e) => updateSellingPoint(index, e.target.value)}
                              onFocus={() => handleSellingPointFocus(index)}
                              className="flex-1 pr-12"
                              style={{
                                background: 'var(--input)',
                                color: 'var(--foreground)',
                                border: activeSuggestIndex === index
                                  ? '2px solid var(--primary)'
                                  : '1px solid var(--border)',
                              }}
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs cursor-pointer px-2 py-1 rounded"
                              style={{
                                color: sp.length >= 60 ? 'var(--destructive)' : 'var(--muted-foreground)',
                                background: sp.length >= 60 ? 'rgba(239,68,68,0.1)' : 'transparent',
                              }}
                              onClick={() => handleSellingPointFocus(index)}
                            >
                              {sp.length}/60
                              {sp.length >= 60 && <span className="ml-1">⚠️</span>}
                            </span>
                          </div>
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

                        {/* 圆弧形气泡推荐 */}
                        {activeSuggestIndex === index && suggestions.length > 0 && (
                          <div className="selling-point-bubbles relative mt-3">
                            <div
                              className="absolute z-50 rounded-2xl p-4 shadow-xl"
                              style={{
                                background: 'var(--card)',
                                border: '1px solid var(--primary)',
                                minWidth: '320px',
                                maxWidth: '480px',
                              }}
                            >
                              <div
                                className="absolute w-3 h-3 rotate-45 -top-1.5 left-8"
                                style={{ background: 'var(--card)', borderLeft: '1px solid var(--primary)', borderTop: '1px solid var(--primary)' }}
                              />

                              <div className="text-xs mb-3 px-1 flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                                <span className="text-base">✨</span>
                                <span>为「<strong style={{ color: 'var(--foreground)' }}>{productName}</strong>」推荐</span>
                                <Badge variant="outline" className="text-xs ml-auto" style={{
                                  borderColor: 'var(--primary)',
                                  color: 'var(--primary)',
                                }}>
                                  {suggestions.length}条可选
                                </Badge>
                              </div>

                              <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto">
                                {suggestions.map((suggestion, i) => {
                                  const rotation = (i % 5 - 2) * 2;
                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      className="bubble-tag px-3 py-2 rounded-full text-sm font-medium transition-all cursor-pointer hover:scale-105 active:scale-95"
                                      style={{
                                        background: 'linear-gradient(135deg, var(--secondary), var(--muted))',
                                        color: 'var(--foreground)',
                                        border: '1px solid var(--border)',
                                        transform: `rotate(${rotation}deg)`,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                      }}
                                      onClick={() => selectSuggestion(suggestion)}
                                    >
                                      {suggestion}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{
                                borderColor: 'var(--border)',
                              }}>
                                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                  或直接输入（≤60字）
                                </span>
                                {isLoadingMore ? (
                                  <span className="text-xs animate-pulse" style={{ color: 'var(--primary)' }}>
                                    生成中...
                                  </span>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={loadMoreSuggestions}
                                    style={{ color: 'var(--primary)' }}
                                  >
                                    🔄 换一批
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 参考图上传 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: 'var(--foreground)' }}>
                      参考图（最多5张）
                      {(isCompressing || isRecognizing) && (
                        <span className="ml-2 text-sm" style={{ color: 'var(--primary)' }}>
                          {isCompressing ? '压缩中...' : 'AI识别中...'}
                        </span>
                      )}
                    </Label>
                    {checkAIConfigured() && (
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: checkSupportsVision() ? 'var(--success)' : 'var(--muted)',
                          color: checkSupportsVision() ? 'var(--foreground)' : 'var(--muted-foreground)',
                        }}
                      >
                        {checkSupportsVision() ? '✓ AI图片识别' : '本地识别'}
                      </span>
                    )}
                  </div>
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

        {/* Step 2: Style Selection - 折叠面板设计 */}
        {step === 'style' && (
          <div className="max-w-3xl mx-auto">
            <FadeIn>
              <h2 className="text-center font-bold mb-8" style={{
                fontSize: 'var(--font-size-headline)',
                color: 'var(--foreground)',
              }}>
                视频配置
              </h2>
            </FadeIn>

            {/* 快速摘要 - 固定显示当前选择 */}
            <FadeIn>
              <Card className="mb-6" style={{
                background: 'linear-gradient(135deg, var(--primary), oklch(0.55 0.18 350))',
                border: 'none',
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getVideoModelConfig(videoModel)?.icon}</span>
                        <span style={{ color: 'var(--primary-foreground)' }}>{getVideoModelConfig(videoModel)?.name}</span>
                      </div>
                      <div className="w-px h-5 opacity-30" style={{ background: 'var(--primary-foreground)' }} />
                      <div style={{ color: 'var(--primary-foreground)' }}>
                        {selectedStyle?.icon} {selectedStyle?.label}
                      </div>
                      <div className="w-px h-5 opacity-30" style={{ background: 'var(--primary-foreground)' }} />
                      <div style={{ color: 'var(--primary-foreground)' }}>{formatDuration(duration)}</div>
                      <div className="w-px h-5 opacity-30" style={{ background: 'var(--primary-foreground)' }} />
                      <div style={{ color: 'var(--primary-foreground)' }}>{aspectRatio}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setStep('generate')}
                      disabled={!projectName.trim()}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                      }}
                    >
                      生成脚本 →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* 折叠面板区域 */}
            <Stagger className="space-y-3">
              {/* 1. 视频生成模型 */}
              <AccordionItem
                id="model"
                title="视频生成模型"
                icon={<Video className="w-5 h-5" />}
                summary={`${getVideoModelConfig(videoModel)?.icon} ${getVideoModelConfig(videoModel)?.name} · ${formatDuration(duration)}`}
                isOpen={openPanels.includes('model')}
                onToggle={() => togglePanel('model')}
                isRequired
              >
                <div className="pt-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {VIDEO_MODEL_OPTIONS.map((model) => {
                      const isSelected = videoModel === model.value;
                      return (
                        <div
                          key={model.value}
                          className={`cursor-pointer p-4 rounded-xl transition-all ${
                            isSelected ? 'ring-2 scale-[1.02]' : 'hover:scale-[1.01]'
                          }`}
                          style={{
                            background: isSelected
                              ? 'linear-gradient(135deg, var(--primary), oklch(0.55 0.18 350))'
                              : 'var(--input)',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            color: isSelected ? 'var(--primary-foreground)' : 'var(--foreground)',
                            '--tw-ring-color': 'var(--primary)',
                          } as React.CSSProperties}
                          onClick={() => {
                            setVideoModel(model.value);
                            setDuration(model.minDuration);
                            if (!model.supportedRatios.includes(aspectRatio)) {
                              setAspectRatio(model.supportedRatios[0]);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-2xl">{model.icon}</span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
                                <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>✓</span>
                              </div>
                            )}
                          </div>
                          <div className="font-semibold text-sm mb-1">{model.name}</div>
                          <div className="text-xs opacity-80">{model.provider}</div>
                          <div className="flex items-center gap-1 text-xs mt-2 opacity-70">
                            <Clock className="w-3 h-3" />
                            <span>{model.minDuration}秒起</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AccordionItem>

              {/* 2. 内容风格 */}
              <AccordionItem
                id="style"
                title="内容风格"
                icon={<Sparkles className="w-5 h-5" />}
                summary={getStyleSummary()}
                isOpen={openPanels.includes('style')}
                onToggle={() => togglePanel('style')}
              >
                <div className="pt-2 space-y-5">
                  {/* 模式切换标签 */}
                  <div className="flex gap-2 flex-wrap">
                    {/* 预设风格模式 */}
                    <button
                      onClick={() => switchStyleMode('preset')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: styleMode === 'preset' 
                          ? 'linear-gradient(135deg, var(--primary), oklch(0.55 0.18 350))'
                          : 'var(--input)',
                        color: styleMode === 'preset' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        border: `2px solid ${styleMode === 'preset' ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      <Tag className="w-4 h-4" />
                      预设风格
                    </button>
                    
                    {/* AI推荐模式 */}
                    <button
                      onClick={() => switchStyleMode('ai-recommend')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: styleMode === 'ai-recommend' 
                          ? 'linear-gradient(135deg, var(--primary), oklch(0.55 0.18 350))'
                          : 'var(--input)',
                        color: styleMode === 'ai-recommend' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        border: `2px solid ${styleMode === 'ai-recommend' ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      <Wand2 className="w-4 h-4" />
                      AI推荐
                    </button>
                    
                    {/* 自定义模式 */}
                    <button
                      onClick={() => switchStyleMode('custom')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: styleMode === 'custom' 
                          ? 'linear-gradient(135deg, var(--primary), oklch(0.55 0.18 350))'
                          : 'var(--input)',
                        color: styleMode === 'custom' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        border: `2px solid ${styleMode === 'custom' ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      自定义描述
                    </button>
                    
                    {/* 随机模式 */}
                    <button
                      onClick={() => switchStyleMode('random')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: styleMode === 'random' 
                          ? 'linear-gradient(135deg, var(--primary), oklch(0.55 0.18 350))'
                          : 'var(--input)',
                        color: styleMode === 'random' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        border: `2px solid ${styleMode === 'random' ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      <Shuffle className="w-4 h-4" />
                      随机变换
                    </button>
                  </div>

                  {/* 预设风格模式内容 */}
                  {styleMode === 'preset' && (
                    <div className="space-y-4">
                      {/* 标签筛选 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          <Tag className="w-3 h-3" />
                          按标签筛选（可多选）
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {STYLE_TAGS.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => toggleTag(tag.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all"
                              style={{
                                background: selectedTags.includes(tag.id) 
                                  ? 'var(--primary)' 
                                  : 'var(--input)',
                                color: selectedTags.includes(tag.id) 
                                  ? 'var(--primary-foreground)' 
                                  : 'var(--foreground)',
                                border: `1px solid ${selectedTags.includes(tag.id) ? 'var(--primary)' : 'var(--border)'}`,
                              }}
                            >
                              {tag.icon} {tag.name}
                            </button>
                          ))}
                          {selectedTags.length > 0 && (
                            <button
                              onClick={() => setSelectedTags([])}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                              style={{
                                background: 'transparent',
                                color: 'var(--muted-foreground)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <XIcon className="w-3 h-3" /> 清除
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 风格分类切换 */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {STYLE_CATEGORIES.map((cat) => {
                          const count = filteredStyles.filter(s => s.category === cat.id).length;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                // 按分类筛选
                                const filtered = selectedTags.length > 0
                                  ? STYLE_PRESETS.filter(s => s.category === cat.id && s.tags.some(t => selectedTags.includes(t)))
                                  : STYLE_PRESETS.filter(s => s.category === cat.id);
                                // 不需要特殊处理，filteredStyles 已经处理了
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all"
                              style={{
                                background: 'var(--input)',
                                color: 'var(--foreground)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {cat.icon} {cat.name} ({count})
                            </button>
                          );
                        })}
                      </div>

                      {/* 风格卡片网格 */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredStyles.slice(0, 24).map((style) => (
                          <HoverLift key={style.value}>
                            <div
                              className={`cursor-pointer p-3 rounded-xl text-center card-hover transition-all relative ${
                                selectedStyle?.value === style.value ? 'ring-2' : ''
                              }`}
                              style={{
                                background: selectedStyle?.value === style.value
                                  ? `linear-gradient(135deg, var(--primary), oklch(0.55 0.18 350))`
                                  : 'var(--input)',
                                border: `2px solid ${selectedStyle?.value === style.value ? 'var(--primary)' : 'var(--border)'}`,
                                color: selectedStyle?.value === style.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                                '--tw-ring-color': 'var(--primary)',
                              } as React.CSSProperties}
                              onClick={() => setSelectedStyle(style)}
                            >
                              {/* 随机模式指示器 */}
                              {styleMode === 'random' && randomSeed > 0 && (
                                <div 
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ background: 'var(--accent)' }}
                                >
                                  <Shuffle className="w-2.5 h-2.5" />
                                </div>
                              )}
                              
                              <div className="text-2xl mb-1">{style.icon}</div>
                              <h4 className="font-semibold text-sm">{style.label}</h4>
                              <p className="text-xs mt-1 opacity-80 line-clamp-2">{style.description}</p>
                              
                              {/* 标签徽章 */}
                              <div className="flex gap-1 justify-center mt-2 flex-wrap">
                                {style.tags.slice(0, 2).map((tagId) => {
                                  const tag = STYLE_TAGS.find(t => t.id === tagId);
                                  return tag ? (
                                    <span 
                                      key={tagId} 
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{ 
                                        background: 'rgba(0,0,0,0.1)',
                                        color: selectedStyle?.value === style.value ? 'inherit' : 'var(--muted-foreground)'
                                      }}
                                    >
                                      {tag.icon}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </HoverLift>
                        ))}
                      </div>

                      {filteredStyles.length > 24 && (
                        <p className="text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          还有 {filteredStyles.length - 24} 种风格，添加更多标签筛选...
                        </p>
                      )}

                      {/* 随机切换按钮 */}
                      <div className="flex justify-center">
                        <button
                          onClick={shuffleStyle}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                          style={{
                            background: 'var(--input)',
                            color: 'var(--foreground)',
                            border: '2px dashed var(--border)',
                          }}
                        >
                          <Shuffle className="w-4 h-4" />
                          随机换一个风格
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI推荐模式内容 */}
                  {styleMode === 'ai-recommend' && (
                    <div className="space-y-4">
                      <div 
                        className="p-6 rounded-xl text-center"
                        style={{
                          background: 'linear-gradient(135deg, var(--primary) 0%, oklch(0.55 0.18 350) 100%)',
                          color: 'var(--primary-foreground)',
                        }}
                      >
                        <Wand2 className="w-10 h-10 mx-auto mb-3 opacity-80" />
                        <h4 className="font-semibold text-lg mb-2">AI智能推荐风格</h4>
                        <p className="text-sm opacity-90 mb-4">
                          基于您的商品信息，AI将为您推荐最适合的视频风格
                        </p>
                        {checkAIConfigured() ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            AI 已配置，将在生成时推荐
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20">
                            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                            配置 API 密钥以启用 AI 推荐
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                        AI 模式将在生成脚本时，根据商品信息智能匹配最合适的风格组合
                      </p>
                    </div>
                  )}

                  {/* 自定义模式内容 */}
                  {styleMode === 'custom' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                          描述您想要的视频风格
                        </label>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="例如：轻松幽默的开箱风格，展示产品有趣的特点，配合快节奏剪辑..."
                          className="w-full p-3 rounded-xl text-sm resize-none"
                          rows={4}
                          style={{
                            background: 'var(--input)',
                            color: 'var(--foreground)',
                            border: `2px solid ${customPrompt.trim() ? 'var(--primary)' : 'var(--border)'}`,
                          }}
                        />
                        <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                          描述越详细，生成的脚本越符合您的预期
                        </p>
                      </div>

                      {/* 风格提示词模板 */}
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                          快速模板（点击添加到描述）
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { label: '开箱惊喜', prompt: '开箱展示产品外观和第一感受，营造惊喜氛围' },
                            { label: '教程详细', prompt: 'step by step详细讲解，从入门到精通' },
                            { label: '对比分析', prompt: '多角度对比，突出产品优势' },
                            { label: '生活场景', prompt: '融入日常生活场景，展示真实使用感' },
                            { label: '快节奏', prompt: '快节奏剪辑，配合动感音乐' },
                            { label: '治愈感', prompt: '慢节奏舒缓，营造治愈放松氛围' },
                          ].map((template) => (
                            <button
                              key={template.label}
                              onClick={() => {
                                const newPrompt = customPrompt 
                                  ? `${customPrompt}\n\n${template.prompt}`
                                  : template.prompt;
                                setCustomPrompt(newPrompt);
                              }}
                              className="px-3 py-1.5 rounded-full text-xs transition-all"
                              style={{
                                background: 'var(--input)',
                                color: 'var(--foreground)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              + {template.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 随机模式内容 */}
                  {styleMode === 'random' && (
                    <div className="space-y-4">
                      <div 
                        className="p-6 rounded-xl text-center"
                        style={{
                          background: 'var(--input)',
                          border: '2px dashed var(--border)',
                        }}
                      >
                        <Shuffle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--primary)' }} />
                        <h4 className="font-semibold text-lg mb-2">
                          {selectedStyle?.icon} {selectedStyle?.label}
                        </h4>
                        <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                          {selectedStyle?.description}
                        </p>
                        
                        {/* 风格标签 */}
                        <div className="flex gap-2 justify-center flex-wrap mb-4">
                          {selectedStyle?.tags.map((tagId) => {
                            const tag = STYLE_TAGS.find(t => t.id === tagId);
                            return tag ? (
                              <span 
                                key={tagId} 
                                className="px-2 py-1 rounded-full text-xs"
                                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                              >
                                {tag.icon} {tag.name}
                              </span>
                            ) : null;
                          })}
                        </div>

                        <button
                          onClick={shuffleStyle}
                          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium mx-auto transition-all"
                          style={{
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                          }}
                        >
                          <Shuffle className="w-4 h-4" />
                          随机换一个风格
                        </button>
                      </div>
                      
                      <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                        每次生成都会随机选择不同的风格组合，每次都是新体验
                      </p>
                    </div>
                  )}
                </div>
              </AccordionItem>

              {/* 3. 时长与比例 */}
              <AccordionItem
                id="duration"
                title="时长与比例"
                icon={<Camera className="w-5 h-5" />}
                summary={`${formatDuration(duration)} · ${aspectRatio}`}
                isOpen={openPanels.includes('duration')}
                onToggle={() => togglePanel('duration')}
              >
                <div className="space-y-6 pt-2">
                  {/* 时长选择 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>视频时长</span>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--muted-foreground)', color: 'var(--muted-foreground)' }}>
                        {getVideoModelConfig(videoModel)?.name} · 每 {getVideoModelConfig(videoModel)?.durationStep}秒递增
                      </Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {getVideoModelConfig(videoModel)?.durations.map((d) => (
                        <Button
                          key={d}
                          variant={duration === d ? 'default' : 'outline'}
                          onClick={() => setDuration(d)}
                          style={{
                            background: duration === d ? 'var(--primary)' : 'transparent',
                            color: duration === d ? 'var(--primary-foreground)' : 'var(--foreground)',
                            borderColor: duration === d ? 'var(--primary)' : 'var(--border)',
                            padding: '8px 16px',
                          }}
                        >
                          {formatDuration(d)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 比例选择 */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>视频比例</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {getVideoModelConfig(videoModel)?.supportedRatios.map((ratio) => {
                        const ratioOption = ASPECT_RATIO_OPTIONS.find(r => r.value === ratio);
                        return (
                          <div
                            key={ratio}
                            className="card-hover cursor-pointer p-4 rounded-xl text-center transition-all"
                            style={{
                              background: aspectRatio === ratio ? 'var(--primary)' : 'var(--input)',
                              border: `2px solid ${aspectRatio === ratio ? 'var(--primary)' : 'var(--border)'}`,
                              color: aspectRatio === ratio ? 'var(--primary-foreground)' : 'var(--foreground)',
                            }}
                            onClick={() => setAspectRatio(ratio)}
                          >
                            <div className="text-lg font-bold mb-1">{ratioOption?.value}</div>
                            <div className="text-xs" style={{
                              color: aspectRatio === ratio ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
                            }}>
                              {ratioOption?.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </AccordionItem>

              {/* 4. 目标语言 */}
              <AccordionItem
                id="language"
                title="目标语言"
                icon={<Globe className="w-5 h-5" />}
                summary={LANGUAGE_OPTIONS.find(l => l.value === language)?.flag + ' ' + LANGUAGE_OPTIONS.find(l => l.value === language)?.label}
                isOpen={openPanels.includes('language')}
                onToggle={() => togglePanel('language')}
              >
                <div className="pt-2">
                  {/* 语言分组搜索 */}
                  <Input
                    placeholder="搜索语言..."
                    className="mb-4"
                    style={{
                      background: 'var(--input)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-2"
                        style={{
                          background: language === lang.value ? 'var(--primary)' : 'var(--input)',
                          color: language === lang.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                          border: `1px solid ${language === lang.value ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                        onClick={() => setLanguage(lang.value)}
                      >
                        <span>{lang.flag}</span>
                        <span className="truncate">{lang.label}</span>
                        {language === lang.value && <Check className="w-4 h-4 ml-auto flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </AccordionItem>

              {/* 5. 项目设置 */}
              <AccordionItem
                id="settings"
                title="项目设置"
                icon={<Settings className="w-5 h-5" />}
                summary={projectName || '点击设置项目名称'}
                isOpen={openPanels.includes('settings')}
                onToggle={() => togglePanel('settings')}
              >
                <div className="pt-2 space-y-4">
                  <div>
                    <Label htmlFor="projectName" style={{ color: 'var(--foreground)' }}>项目名称</Label>
                    <Input
                      id="projectName"
                      placeholder="例如：美白精华带货视频"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="mt-2"
                      style={{
                        background: 'var(--input)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                  
                  {/* 配置摘要 */}
                  <div className="p-4 rounded-xl" style={{ background: 'var(--input)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>配置摘要</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">模型:</span>
                        <span className="font-medium">{getVideoModelConfig(videoModel)?.icon} {getVideoModelConfig(videoModel)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">风格:</span>
                        <span className="font-medium">{selectedStyle?.icon} {selectedStyle?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">时长:</span>
                        <span className="font-medium">{formatDuration(duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">比例:</span>
                        <span className="font-medium">{aspectRatio}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">语言:</span>
                        <span className="font-medium">{LANGUAGE_OPTIONS.find(l => l.value === language)?.flag} {LANGUAGE_OPTIONS.find(l => l.value === language)?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">商品:</span>
                        <span className="font-medium truncate">{productName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionItem>
            </Stagger>

            {/* 生成按钮 */}
            <FadeIn>
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  disabled={!projectName.trim()}
                  onClick={() => setStep('generate')}
                  className="px-12"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  开始生成脚本
                </Button>
                {!projectName.trim() && (
                  <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    请先在「项目设置」中设置项目名称
                  </p>
                )}
              </div>
            </FadeIn>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generate' && (
          <FadeIn>
            <div className="max-w-md mx-auto text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
                background: 'var(--primary)',
              }}>
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--primary-foreground)' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
                  ? 'AI编导正在根据你的商品信息创意构思'
                  : '正在使用模板生成脚本'}
              </p>

              {(createProjectMutation.isError || generateScriptMutation.isError) && (
                <div className="mt-4 p-3 rounded-lg text-sm" style={{
                  background: 'oklch(0.55 0.22 15 / 0.1)',
                  border: '1px solid oklch(0.55 0.22 15 / 0.3)',
                  color: 'var(--foreground)',
                }}>
                  <p className="font-medium mb-1">生成出错</p>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    {createProjectMutation.isError ? '创建项目失败' : '生成脚本失败'}
                  </p>
                </div>
              )}

              {!generateScriptMutation.isPending && !generatedProject && (
                <Button
                  className="mt-6"
                  onClick={handleGenerate}
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
            {/* 生成方式横幅 */}
            <FadeIn>
              {generatedProject.usedAI ? (
                <div className="mb-6 p-4 rounded-xl text-center" style={{
                  background: 'linear-gradient(135deg, oklch(0.60 0.22 15), oklch(0.55 0.18 280))',
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                    ✨ AI 创意生成
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.9)' }}>
                    本次脚本由 <strong>{generatedProject.aiProvider}</strong> 大模型实时创作
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-xl text-center" style={{
                  background: 'linear-gradient(135deg, oklch(0.75 0.18 70), oklch(0.65 0.16 55))',
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                    📋 模板生成（本地模拟）
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.9)' }}>
                    配置API密钥可获得独特创意脚本
                  </div>
                </div>
              )}
            </FadeIn>

            <FadeIn>
              <div className="text-center mb-6">
                <Badge style={{
                  background: 'var(--success)',
                  color: 'var(--success-foreground)',
                  padding: '6px 16px',
                  marginBottom: 8,
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
                  {productName} · {getVideoModelConfig(videoModel)?.icon} {getVideoModelConfig(videoModel)?.name} · {selectedStyle?.label} · {formatDuration(duration)}
                </p>
              </div>
            </FadeIn>

            {/* AI Video Prompts */}
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
                        {getVideoModelConfig(videoModel)?.icon} {getVideoModelConfig(videoModel)?.name} · {formatDuration(duration)} · {aspectRatio}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const allPrompts = generatedProject.scenes?.map((s: any) => s.visualPrompt).join('\n\n---\n\n') || '';
                        navigator.clipboard.writeText(allPrompts);
                        toast.success('已复制所有英文提示词！');
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
                          background: 'var(--background)',
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
                                toast.success('已复制该场景英文提示词！');
                              }}
                              style={{
                                color: 'var(--primary)',
                                borderColor: 'var(--primary)',
                              }}
                            >
                              复制英文
                            </Button>
                          </div>

                          <div className="mb-3 p-3 rounded" style={{
                            background: 'var(--input)',
                            border: '1px solid var(--border)',
                          }}>
                            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                              📹 Visual Prompt (English)
                            </div>
                            <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                              {scene.visualPrompt}
                            </p>
                          </div>

                          <div className="p-3 rounded" style={{
                            background: 'oklch(0.65 0.15 160 / 0.1)',
                            border: '1px solid oklch(0.65 0.15 160 / 0.3)',
                          }}>
                            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                              📝 中文描述
                            </div>
                            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                              {scene.visualPromptCN}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                            {scene.cameraMovement && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--input)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>镜头运动:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.cameraMovement}</span>
                              </div>
                            )}
                            {scene.cameraAngle && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--input)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>镜头角度:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.cameraAngle}</span>
                              </div>
                            )}
                            {scene.cameraDistance && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--input)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>景别:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.cameraDistance}</span>
                              </div>
                            )}
                            {scene.lighting && (
                              <div className="text-xs p-2 rounded" style={{ background: 'var(--input)' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>灯光:</span>
                                <span className="ml-1" style={{ color: 'var(--foreground)' }}>{scene.lighting}</span>
                              </div>
                            )}
                          </div>

                          {scene.voiceover && (
                            <div className="mt-3 p-2 rounded text-sm" style={{
                              background: 'oklch(0.75 0.18 70 / 0.1)',
                              border: '1px solid oklch(0.75 0.18 70 / 0.3)',
                              color: 'var(--foreground)',
                            }}>
                              🎤 口播: {scene.voiceover}
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
                        toast.success('已复制完整脚本！');
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
                        toast.success('已复制口播文案！');
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

            {/* 音乐推荐 */}
            <FadeIn>
              <Card className="mb-6" style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: 'var(--foreground)' }}>
                      <div className="flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        音乐推荐
                      </div>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={{ color: 'var(--muted-foreground)' }}>{generatedProject.musicStyle}</p>
                </CardContent>
              </Card>
            </FadeIn>

            {/* 使用指南 */}
            <FadeIn>
              <Card className="mb-6" style={{
                background: 'var(--card)',
                border: '1px solid var(--primary)',
              }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--foreground)' }}>💡 如何使用这些提示词</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <p><strong>Veo3.1 / Google:</strong> 直接粘贴英文提示词</p>
                    <p><strong>即梦 / 可灵:</strong> 支持中英文描述</p>
                    <p><strong>Runway Gen-3 / Pika:</strong> 推荐英文提示词</p>
                    <p><strong>Sora:</strong> 直接粘贴完整英文提示词</p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Actions */}
            <FadeIn>
              <div className="flex flex-wrap gap-3 justify-center pb-8">
                <Button
                  variant={isFavorited ? "default" : "outline"}
                  size="lg"
                  onClick={() => {
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
                      const updated = favorites.filter((f: any) => f.id !== newFavorite.id);
                      localStorage.setItem('favorites', JSON.stringify(updated));
                      setIsFavorited(false);
                      toast.success('已取消收藏');
                    } else {
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

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (window.confirm('确定要删除这个项目吗？')) {
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
                    setVideoModel('jimeng');
                    setDuration(getModelDefaultDuration('jimeng'));
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
