import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Film, ImagePlus, ShieldCheck, Sparkles, StopCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ReferenceImage {
  id: string
  file: File
  previewUrl: string
}

interface Estimate {
  callCount: number
  secondsPerCall: number
  totalBillableSeconds: number
  pricePerSecondUsd: number
  estimatedTotalUsd: number
  currency: string
  disclaimer: string
}

interface Scene {
  index: number
  title: string
  status: string
  progress: number
  previewUrl?: string
  publishable?: boolean
  error?: string
}

interface Task {
  id: string
  status: string
  estimate: Estimate
  costAuthorizedAt?: string
  stopFutureScenes: boolean
  scenes: Scene[]
  warnings: string[]
}

interface Capabilities {
  apiKeyConfigured: boolean
  explicitConfirmationPhrase: string
  autoRetryPaidGeneration: boolean
  modelLifecycleNotice: string
}

const fieldClass = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground'

const AiVideo = () => {
  const [productName, setProductName] = useState('')
  const [sellingPoints, setSellingPoints] = useState('')
  const [targetMarket, setTargetMarket] = useState('Malaysia')
  const [modelDescription, setModelDescription] = useState('虚构的25至35岁马来西亚成年女性，休闲运动穿搭')
  const [usageScene, setUsageScene] = useState('户外运动场与日常健身场景')
  const [videoStyle, setVideoStyle] = useState('写实手持TikTok UGC')
  const [immutableDetails, setImmutableDetails] = useState('')
  const [videoLanguage, setVideoLanguage] = useState('Malay')
  const [subtitleMode, setSubtitleMode] = useState<'malay' | 'bilingual'>('bilingual')
  const [model, setModel] = useState<'sora-2' | 'sora-2-pro'>('sora-2')
  const [size, setSize] = useState<'720x1280' | '1024x1792'>('720x1280')
  const [clipSeconds, setClipSeconds] = useState<4 | 8>(4)
  const [sceneCount, setSceneCount] = useState<3 | 4>(4)
  const [images, setImages] = useState<ReferenceImage[]>([])
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [task, setTask] = useState<Task | null>(null)
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null)
  const [feeConfirmed, setFeeConfirmed] = useState(false)
  const [confirmationPhrase, setConfirmationPhrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const previewUrlsRef = useRef<string[]>([])

  const sellingPointList = useMemo(() => sellingPoints.split(/\r?\n/).map(item => item.trim()).filter(Boolean), [sellingPoints])
  const immutableDetailList = useMemo(() => immutableDetails.split(/\r?\n/).map(item => item.trim()).filter(Boolean), [immutableDetails])

  useEffect(() => {
    fetch('/api/ai-video/capabilities')
      .then(response => response.json())
      .then(payload => setCapabilities(payload.data))
      .catch(() => setCapabilities(null))
  }, [])

  useEffect(() => {
    previewUrlsRef.current = images.map(image => image.previewUrl)
  }, [images])

  useEffect(() => () => previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url)), [])

  useEffect(() => {
    if (!task || !task.scenes.some(scene => ['queued', 'in_progress'].includes(scene.status))) return
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/ai-video/tasks/${task.id}`)
      if (!response.ok) return
      const payload = await response.json()
      setTask(payload.data)
    }, 1500)
    return () => window.clearInterval(timer)
  }, [task])

  useEffect(() => {
    if (model === 'sora-2') setSize('720x1280')
    setEstimate(null)
    setTask(null)
    setFeeConfirmed(false)
    setConfirmationPhrase('')
  }, [model, size, clipSeconds, sceneCount])

  const inputPayload = () => ({
    productName,
    sellingPoints: sellingPointList,
    targetMarket,
    modelDescription,
    usageScene,
    videoStyle,
    immutableDetails: immutableDetailList,
    videoLanguage,
    subtitleMode,
    model,
    size,
    clipSeconds,
    sceneCount,
  })

  const validate = (needsImages = false) => {
    if (!productName.trim() || sellingPointList.length === 0 || immutableDetailList.length === 0) {
      setMessage('请填写商品名称、至少一个真实卖点和至少一个禁止改变的产品细节。')
      return false
    }
    if (!targetMarket.trim() || !modelDescription.trim() || !usageScene.trim() || !videoStyle.trim()) {
      setMessage('请完整填写目标市场、真人模特、使用场景和视频风格。')
      return false
    }
    if (needsImages && (images.length < 1 || images.length > 4)) {
      setMessage('请上传1至4张真实产品参考图。')
      return false
    }
    return true
  }

  const parseResponse = async (response: Response) => {
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.message || '请求失败')
    return payload.data
  }

  const calculateEstimate = async () => {
    setMessage('')
    if (!validate()) return
    setBusy(true)
    try {
      const response = await fetch('/api/ai-video/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputPayload()),
      })
      setEstimate(await parseResponse(response))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '费用估算失败')
    } finally {
      setBusy(false)
    }
  }

  const createTask = async () => {
    setMessage('')
    if (!validate(true) || !estimate) {
      if (!estimate) setMessage('请先计算并查看费用。')
      return
    }
    const form = new FormData()
    images.forEach(image => form.append('images', image.file, image.file.name))
    form.append('metadata', JSON.stringify(inputPayload()))
    setBusy(true)
    try {
      const response = await fetch('/api/ai-video/tasks', { method: 'POST', body: form })
      setTask(await parseResponse(response))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '任务创建失败')
    } finally {
      setBusy(false)
    }
  }

  const authorizeCost = async () => {
    if (capabilities?.apiKeyConfigured !== true) {
      setMessage('无法确认费用：后端尚未配置 OPENAI_API_KEY。请先在后端进程环境变量中配置密钥并重启后端；不要把密钥粘贴到网页或聊天中。')
      return
    }
    if (!task || !feeConfirmed || confirmationPhrase !== capabilities?.explicitConfirmationPhrase) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/ai-video/tasks/${task.id}/authorize-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed: true,
          confirmationPhrase,
          acceptedEstimatedCostUsd: task.estimate.estimatedTotalUsd,
        }),
      })
      setTask(await parseResponse(response))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '费用确认失败')
    } finally {
      setBusy(false)
    }
  }

  const generateScene = async (sceneIndex: number) => {
    if (!task) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/ai-video/tasks/${task.id}/scenes/${sceneIndex}/generate`, { method: 'POST' })
      setTask(await parseResponse(response))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '镜头提交失败')
    } finally {
      setBusy(false)
    }
  }

  const reviewScene = async (sceneIndex: number, approved: boolean) => {
    if (!task) return
    const notes = approved ? '' : window.prompt('请说明Logo、颜色、结构、数量或配件错误：')?.trim()
    if (!approved && !notes) return
    const response = await fetch(`/api/ai-video/tasks/${task.id}/scenes/${sceneIndex}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approved,
        review: {
          productColorCorrect: approved,
          structureCorrect: approved,
          logoAcceptable: approved,
          quantityCorrect: approved,
          accessoriesCorrect: approved,
          notes,
        },
      }),
    })
    try {
      setTask(await parseResponse(response))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '镜头审核失败')
    }
  }

  const cancelFuture = async () => {
    if (!task) return
    const response = await fetch(`/api/ai-video/tasks/${task.id}/cancel-future-scenes`, { method: 'POST' })
    try {
      setTask(await parseResponse(response))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '取消失败')
    }
  }

  const addImages = (files: FileList | null) => {
    if (!files) return
    setImages(current => {
      const next = Array.from(files).slice(0, Math.max(0, 4 - current.length)).map(file => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }))
      return [...current, ...next]
    })
  }

  const removeImage = (index: number) => setImages(current => {
    URL.revokeObjectURL(current[index].previewUrl)
    return current.filter((_, itemIndex) => itemIndex !== index)
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-6xl py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回首页</Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-3xl font-bold">真人AI视频</h1><p className="mt-2 text-muted-foreground">产品参考图＋描述 → Sora真人动态镜头 → 逐镜审核 → FFmpeg成片</p></div>
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <div className="mb-6 flex gap-2 rounded-xl border border-border bg-card p-2">
          <Link className="rounded-lg px-4 py-2 text-sm hover:bg-muted" to="/ugc-export">图片广告模式 · 免费FFmpeg</Link>
          <span className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">真人AI视频 · 付费模型</span>
        </div>

        <div className="mb-6 space-y-2 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
          <p><AlertTriangle className="mr-2 inline h-4 w-4" /><strong>本页包含付费API操作。</strong>创建任务和计算费用不会调用模型；费用确认与生成镜头是两个独立步骤。</p>
          <p>后端密钥：{capabilities?.apiKeyConfigured ? '已配置' : '未配置'}；自动付费重试：关闭。</p>
          {capabilities?.modelLifecycleNotice && <p>{capabilities.modelLifecycleNotice}</p>}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card><CardHeader><CardTitle>1. 商品与真人镜头描述</CardTitle><CardDescription>只输入已验证事实；真人必须是虚构成年人。</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div><Label>商品名称</Label><Input value={productName} onChange={event => setProductName(event.target.value)} /></div>
                <div><Label>目标市场</Label><Input value={targetMarket} onChange={event => setTargetMarket(event.target.value)} /></div>
                <div className="md:col-span-2"><Label>真实卖点（每行一个）</Label><textarea className={`${fieldClass} min-h-24`} value={sellingPoints} onChange={event => setSellingPoints(event.target.value)} /></div>
                <div className="md:col-span-2"><Label>真人模特描述</Label><Input value={modelDescription} onChange={event => setModelDescription(event.target.value)} /></div>
                <div><Label>使用场景</Label><Input value={usageScene} onChange={event => setUsageScene(event.target.value)} /></div>
                <div><Label>视频风格</Label><Input value={videoStyle} onChange={event => setVideoStyle(event.target.value)} /></div>
                <div className="md:col-span-2"><Label>禁止改变的产品细节（每行一个）</Label><textarea className={`${fieldClass} min-h-24`} value={immutableDetails} onChange={event => setImmutableDetails(event.target.value)} /></div>
                <div><Label>视频语言</Label><Input value={videoLanguage} onChange={event => setVideoLanguage(event.target.value)} /></div>
                <div><Label>字幕</Label><select className={fieldClass} value={subtitleMode} onChange={event => setSubtitleMode(event.target.value as typeof subtitleMode)}><option value="malay">马来语</option><option value="bilingual">马来语＋中文</option></select></div>
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle>2. 产品参考图</CardTitle><CardDescription>1–4张JPEG、PNG或WebP；每次API调用只使用其中一张input_reference。</CardDescription></CardHeader>
              <CardContent><label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6"><ImagePlus className="h-5 w-5" />选择真实商品图<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => addImages(event.target.files)} /></label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image, index) => <div key={image.id} className="relative overflow-hidden rounded-lg border border-border"><img src={image.previewUrl} className="aspect-[9/16] w-full object-cover" alt={`参考图${index + 1}`} /><button className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white" onClick={() => removeImage(index)}><X className="h-4 w-4" /></button><div className="p-2 text-center text-xs">参考图 {index + 1}</div></div>)}</div>
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle>3. 模型与费用</CardTitle><CardDescription>默认使用较低费用的sora-2；不会自动切换到Pro。</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div><Label>模型</Label><select className={fieldClass} value={model} onChange={event => setModel(event.target.value as typeof model)}><option value="sora-2">sora-2（默认）</option><option value="sora-2-pro">sora-2-pro（较高费用）</option></select></div>
                <div><Label>竖屏规格</Label><select className={fieldClass} value={size} onChange={event => setSize(event.target.value as typeof size)} disabled={model === 'sora-2'}><option value="720x1280">720×1280</option>{model === 'sora-2-pro' && <option value="1024x1792">1024×1792</option>}</select></div>
                <div><Label>每镜时长</Label><select className={fieldClass} value={clipSeconds} onChange={event => setClipSeconds(Number(event.target.value) as 4 | 8)}><option value={4}>4秒（推荐）</option><option value={8}>8秒</option></select></div>
                <div><Label>镜头数量</Label><select className={fieldClass} value={sceneCount} onChange={event => setSceneCount(Number(event.target.value) as 3 | 4)}><option value={4}>4个</option><option value={3}>3个</option></select></div>
                <Button className="md:col-span-2" variant="outline" onClick={calculateEstimate} disabled={busy}>计算调用次数与预计费用</Button>
                {estimate && <div className="md:col-span-2 rounded-lg border border-border bg-muted/30 p-4"><p className="text-lg font-semibold">预计 {estimate.callCount} 次调用 · {estimate.totalBillableSeconds} 计费秒 · 约 ${estimate.estimatedTotalUsd.toFixed(2)} USD</p><p className="mt-1 text-xs text-muted-foreground">${estimate.pricePerSecondUsd.toFixed(2)}/秒；{estimate.disclaimer}</p></div>}
              </CardContent>
            </Card>

            {message && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">{message}</div>}
            <Button size="lg" className="w-full" onClick={createTask} disabled={busy || !estimate}>创建任务（不会调用付费API）</Button>
          </div>

          <div className="space-y-6">
            <Card className="lg:sticky lg:top-6"><CardHeader><CardTitle>费用确认与逐镜生成</CardTitle><CardDescription>任务创建后仍需明确确认；每次只生成一个镜头。</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {!task ? <div className="rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">先在左侧创建无费用任务</div> : <>
                  <div className="rounded-lg border border-border p-3 text-sm">任务：{task.id}<br />状态：{task.status}<br />估算上限：${task.estimate.estimatedTotalUsd.toFixed(2)} USD</div>
                  {message && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{message}</div>}
                  {!task.costAuthorizedAt && <div className="space-y-3 rounded-lg border border-warning/50 bg-warning/10 p-4">
                    {capabilities?.apiKeyConfigured !== true && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"><strong>费用确认暂不可用：</strong>后端未配置 <code>OPENAI_API_KEY</code>。请先在后端进程环境变量中配置并重启后端。密钥不要粘贴到本页或聊天中。</div>}
                    <label className="flex gap-2 text-sm"><input type="checkbox" checked={feeConfirmed} onChange={event => setFeeConfirmed(event.target.checked)} />我已查看调用次数和预计费用，并理解失败镜头也可能产生费用。</label>
                    <Input placeholder={`输入“${capabilities?.explicitConfirmationPhrase ?? '确认付费生成'}”`} value={confirmationPhrase} onChange={event => setConfirmationPhrase(event.target.value)} />
                    <Button className="w-full" onClick={authorizeCost} disabled={busy || capabilities?.apiKeyConfigured !== true || !feeConfirmed || confirmationPhrase !== capabilities?.explicitConfirmationPhrase}><ShieldCheck className="mr-2 h-4 w-4" />{capabilities?.apiKeyConfigured === false ? '请先配置后端 API 密钥' : '确认费用（仍不生成）'}</Button>
                  </div>}
                  {task.costAuthorizedAt && <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm"><CheckCircle2 className="mr-2 inline h-4 w-4" />费用已确认。点击某个镜头的生成按钮时才会发生一次付费调用。</div>}
                  <div className="space-y-3">{task.scenes.map(scene => {
                    const earlierApproved = task.scenes.slice(0, scene.index - 1).every(item => item.status === 'approved')
                    return <div key={scene.index} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2"><div><strong>镜头{scene.index}</strong> · {scene.title}</div><span className="text-xs">{scene.status} {scene.progress}%</span></div>
                      {scene.previewUrl && <video className="mt-3 aspect-[9/16] max-h-96 w-full rounded bg-black" controls src={scene.previewUrl} />}
                      {scene.error && <p className="mt-2 text-xs text-destructive">{scene.error}</p>}
                      {scene.status === 'planned' && task.costAuthorizedAt && <Button className="mt-3 w-full" onClick={() => generateScene(scene.index)} disabled={busy || !earlierApproved || task.stopFutureScenes}><Film className="mr-2 h-4 w-4" />{scene.index === 1 ? '生成第一个4秒真人测试镜头（付费）' : `生成镜头${scene.index}（付费）`}</Button>}
                      {scene.status === 'awaiting_review' && <div className="mt-3 flex gap-2"><Button className="flex-1" onClick={() => reviewScene(scene.index, true)}>颜色/结构/Logo/数量/配件均正确</Button><Button variant="destructive" onClick={() => reviewScene(scene.index, false)}>不可发布</Button></div>}
                      {scene.publishable === true && <p className="mt-2 text-xs text-success">已确认可进入最终成片。</p>}
                      {scene.publishable === false && <p className="mt-2 text-xs text-destructive">已标记不可发布，不会进入最终成片。</p>}
                    </div>
                  })}</div>
                  {!task.stopFutureScenes && <Button variant="outline" className="w-full" onClick={cancelFuture}><StopCircle className="mr-2 h-4 w-4" />取消所有后续镜头生成</Button>}
                </>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiVideo
