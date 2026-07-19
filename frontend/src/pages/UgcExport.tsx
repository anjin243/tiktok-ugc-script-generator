import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, Download, Film, GripVertical, Music, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ImageItem {
  id: string
  file: File
  previewUrl: string
}

interface VideoTask {
  id: string
  status: 'queued' | 'rendering' | 'completed' | 'failed'
  progress: number
  outputPath?: string
  outputUrl?: string
  downloadUrl?: string
  warnings: string[]
  error?: string
}

interface Capabilities {
  ffmpeg: boolean
  ffprobe: boolean
  freeMalayTts: boolean
  voiceoverUploadSupported: boolean
  musicUploadSupported: boolean
}

const fieldClass = 'w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground'

const UgcExport = () => {
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('运动户外')
  const [targetAudience, setTargetAudience] = useState('')
  const [sellingPoints, setSellingPoints] = useState('')
  const [brandAuthorization, setBrandAuthorization] = useState<'confirmed' | 'unclear' | 'unbranded'>('unclear')
  const [noUpfEvidence, setNoUpfEvidence] = useState(false)
  const [noWaterproofEvidence, setNoWaterproofEvidence] = useState(false)
  const [subtitleMode, setSubtitleMode] = useState<'malay' | 'bilingual'>('malay')
  const [ttsMode, setTtsMode] = useState<'auto' | 'upload' | 'none'>('auto')
  const [images, setImages] = useState<ImageItem[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [voiceover, setVoiceover] = useState<File | null>(null)
  const [music, setMusic] = useState<File | null>(null)
  const [task, setTask] = useState<VideoTask | null>(null)
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const previewUrlsRef = useRef<string[]>([])

  useEffect(() => {
    fetch('/api/ugc-video/capabilities')
      .then(response => response.json())
      .then(payload => setCapabilities(payload.data))
      .catch(() => setCapabilities(null))
  }, [])

  useEffect(() => {
    previewUrlsRef.current = images.map(image => image.previewUrl)
  }, [images])

  useEffect(() => () => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    if (!task || !['queued', 'rendering'].includes(task.status)) return
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/ugc-video/tasks/${task.id}`)
      if (!response.ok) return
      const payload = await response.json()
      setTask(payload.data)
    }, 1200)
    return () => window.clearInterval(timer)
  }, [task])

  const sellingPointList = useMemo(
    () => sellingPoints.split(/\r?\n/).map(value => value.trim()).filter(Boolean),
    [sellingPoints]
  )

  const addImages = (files: FileList | null) => {
    if (!files) return
    setImages(current => {
      const availableSlots = Math.max(0, 8 - current.length)
      const next = Array.from(files).slice(0, availableSlots).map(file => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }))
      return [...current, ...next]
    })
  }

  const removeImage = (index: number) => {
    setImages(current => {
      URL.revokeObjectURL(current[index].previewUrl)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return
    setImages(current => {
      const next = [...current]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const submit = async () => {
    setMessage('')
    if (!productName.trim() || !category.trim() || !targetAudience.trim() || sellingPointList.length === 0) {
      setMessage('请完整填写商品名称、类目、目标用户和至少一个真实卖点。')
      return
    }
    if (images.length < 3 || images.length > 8) {
      setMessage('请上传并排序 3 至 8 张真实商品图片。')
      return
    }
    if (ttsMode === 'upload' && !voiceover) {
      setMessage('你选择了上传配音，请先选择 MP3、WAV 或 M4A 文件。')
      return
    }

    const formData = new FormData()
    images.forEach(image => formData.append('images', image.file, image.file.name))
    if (voiceover) formData.append('voiceover', voiceover, voiceover.name)
    if (music) formData.append('music', music, music.name)
    formData.append('metadata', JSON.stringify({
      productName,
      category,
      targetAudience,
      sellingPoints: sellingPointList,
      brandAuthorization,
      noUpfEvidence,
      noWaterproofEvidence,
      subtitleMode,
      ttsMode,
    }))

    setSubmitting(true)
    try {
      const response = await fetch('/api/ugc-video/tasks', { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || '任务创建失败')
      setTask(payload.data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '任务创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-6xl py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link to="/" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> 返回首页
            </Link>
            <h1 className="text-3xl font-bold">基础 UGC 视频自动导出</h1>
            <p className="mt-2 text-muted-foreground">真实图片 + Skill 合规脚本 + 本地 FFmpeg，输出 15 秒竖屏 MP4。</p>
          </div>
          <Film className="h-12 w-12 text-primary" />
        </div>

        <div className="mb-6 rounded-lg border border-border bg-card p-4 text-sm">
          <strong>本地能力：</strong>{' '}
          {capabilities
            ? `FFmpeg ${capabilities.ffmpeg && capabilities.ffprobe ? '可用' : '未就绪'}；免费马来语 TTS ${capabilities.freeMalayTts ? '可用' : '未检测到，可上传配音'}`
            : '正在检测……'}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. 商品资料</CardTitle>
                <CardDescription>只填写已确认事实；不自动强化未经验证的性能声明。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div><Label>商品名称</Label><Input value={productName} onChange={event => setProductName(event.target.value)} /></div>
                <div><Label>类目</Label><Input value={category} onChange={event => setCategory(event.target.value)} /></div>
                <div className="md:col-span-2"><Label>目标用户</Label><Input value={targetAudience} onChange={event => setTargetAudience(event.target.value)} /></div>
                <div className="md:col-span-2">
                  <Label>真实卖点（每行一个）</Label>
                  <textarea className={`${fieldClass} min-h-28`} value={sellingPoints} onChange={event => setSellingPoints(event.target.value)} />
                </div>
                <div>
                  <Label>品牌授权</Label>
                  <select className={fieldClass} value={brandAuthorization} onChange={event => setBrandAuthorization(event.target.value as typeof brandAuthorization)}>
                    <option value="unclear">不明确，必须提示风险</option><option value="confirmed">已确认</option><option value="unbranded">无品牌商品</option>
                  </select>
                </div>
                <div>
                  <Label>字幕版本</Label>
                  <select className={fieldClass} value={subtitleMode} onChange={event => setSubtitleMode(event.target.value as typeof subtitleMode)}>
                    <option value="malay">马来语</option><option value="bilingual">马来语 + 中文</option>
                  </select>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={noUpfEvidence} onChange={event => setNoUpfEvidence(event.target.checked)} /> 暂无 UPF 检测报告</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={noWaterproofEvidence} onChange={event => setNoWaterproofEvidence(event.target.checked)} /> 暂无完全防水测试</label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>2. 图片上传与排序</CardTitle><CardDescription>3–8 张；仅 JPEG、PNG、WebP；每张不超过 8MB。</CardDescription></CardHeader>
              <CardContent>
                <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 hover:bg-muted/30">
                  <Upload className="h-5 w-5" /> 选择真实商品图片
                  <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => addImages(event.target.files)} />
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {images.map((image, index) => (
                    <div key={image.id} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={event => event.preventDefault()} onDrop={() => { if (draggedIndex !== null) moveImage(draggedIndex, index); setDraggedIndex(null) }} className="relative overflow-hidden rounded-lg border border-border bg-muted">
                      <img src={image.previewUrl} alt={`商品图 ${index + 1}`} className="aspect-[9/16] w-full object-cover" />
                      <div className="absolute left-1 top-1 rounded bg-black/70 px-2 py-1 text-xs text-white">{index + 1}</div>
                      <button onClick={() => removeImage(index)} className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white"><X className="h-4 w-4" /></button>
                      <div className="flex items-center justify-center gap-1 bg-card p-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <button onClick={() => moveImage(index, index - 1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></button>
                        <button onClick={() => moveImage(index, index + 1)} disabled={index === images.length - 1}><ArrowDown className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>3. 音频</CardTitle><CardDescription>背景音乐自动压低至口播音量的约 18%。</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>口播方式</Label>
                  <select className={fieldClass} value={ttsMode} onChange={event => setTtsMode(event.target.value as typeof ttsMode)}>
                    <option value="auto">优先免费本地马来语 TTS</option><option value="upload">上传配音</option><option value="none">不使用口播</option>
                  </select>
                </div>
                <div><Label>配音文件</Label><Input type="file" accept="audio/mpeg,audio/wav,audio/mp4" onChange={event => setVoiceover(event.target.files?.[0] || null)} /></div>
                <div className="md:col-span-2"><Label><Music className="mr-1 inline h-4 w-4" />背景音乐</Label><Input type="file" accept="audio/mpeg,audio/wav,audio/mp4" onChange={event => setMusic(event.target.files?.[0] || null)} /></div>
              </CardContent>
            </Card>

            {message && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">{message}</div>}
            <Button size="lg" onClick={submit} disabled={submitting || task?.status === 'queued' || task?.status === 'rendering'} className="w-full">
              {submitting ? '正在创建任务…' : '生成 15 秒 MP4'}
            </Button>
          </div>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader><CardTitle>视频预览</CardTitle><CardDescription>1080×1920 · 9:16 · 15秒 · H.264 MP4</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {task?.status === 'completed' && task.outputUrl ? (
                <video className="mx-auto aspect-[9/16] max-h-[640px] w-full rounded-xl bg-black" controls src={task.outputUrl} />
              ) : (
                <div className="flex aspect-[9/16] items-center justify-center rounded-xl bg-black text-center text-sm text-white/60">
                  {task ? `${task.status} · ${task.progress}%` : '生成后在此预览'}
                </div>
              )}
              {task?.outputPath && <p className="break-all text-xs text-muted-foreground">{task.outputPath}</p>}
              {task?.warnings?.map(warning => <div key={warning} className="rounded border border-warning/40 bg-warning/10 p-3 text-xs">{warning}</div>)}
              {task?.error && <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm">{task.error}</div>}
              {task?.status === 'completed' && task.downloadUrl && (
                <a href={task.downloadUrl}><Button className="w-full" variant="outline"><Download className="mr-2 h-4 w-4" />下载 MP4</Button></a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UgcExport
