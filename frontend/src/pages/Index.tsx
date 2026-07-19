import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives';
import { UGC_STYLE_OPTIONS } from '@/types';
import { Zap, Globe, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero Section */}
      <section className="relative" style={{
        background: 'linear-gradient(180deg, oklch(0.12 0.015 250) 0%, var(--background) 100%)',
        padding: 'var(--spacing-3xl) 0',
      }}>
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{
              background: 'oklch(0.25 0.02 15 / 0.3)',
              border: '1px solid oklch(0.60 0.22 15 / 0.4)',
              color: '#f8b4b4',
            }}>
              <span className="text-sm font-medium">✨ AI 驱动 · 8种风格 · 多语言</span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="font-bold mb-6 leading-tight" style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'var(--foreground)',
            }}>
              一键生成<br />
              <span style={{
                background: 'linear-gradient(135deg, oklch(0.60 0.22 15), oklch(0.70 0.18 350))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                带货视频脚本
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="mb-8 max-w-xl mx-auto" style={{
              color: 'var(--muted-foreground)',
              fontSize: '1.1rem',
            }}>
              输入商品信息，AI 自动生成专业 UGC 风格带货脚本、分镜、AI视频提示词和口播文案
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/create">
                <Button size="lg" style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                }}>
                  <Zap className="w-5 h-5 mr-2" />
                  立即开始创作
                </Button>
              </Link>
              <Link to="/ugc-export">
                <Button size="lg" variant="outline" style={{
                  borderColor: 'var(--primary)',
                  color: 'var(--foreground)',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                }}>
                  <Zap className="w-5 h-5 mr-2" />
                  基础 MP4 自动导出
                </Button>
              </Link>
              <Link to="/ai-video">
                <Button size="lg" variant="outline" style={{
                  borderColor: 'var(--warning)',
                  color: 'var(--foreground)',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                }}>
                  <Zap className="w-5 h-5 mr-2" />
                  真人AI视频（付费）
                </Button>
              </Link>
              <Link to="/projects">
                <Button size="lg" variant="outline" style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                }}>
                  查看我的项目
                </Button>
              </Link>
            </div>
          </FadeIn>

          {/* Feature Pills */}
          <FadeIn delay={400}>
            <div className="flex flex-wrap gap-3 justify-center mt-10">
              {[
                { icon: '🎬', text: '分镜脚本' },
                { icon: '✨', text: 'AI提示词' },
                { icon: '🎤', text: '口播文案' },
                { icon: '🎵', text: '音乐推荐' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <span>{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16" style={{ background: 'var(--background)' }}>
        <div className="container mx-auto px-4">
          <FadeIn>
            <h2 className="text-center font-bold mb-3" style={{
              fontSize: 'var(--font-size-headline)',
              color: 'var(--foreground)',
            }}>
              支持 {UGC_STYLE_OPTIONS.length} 种 UGC 风格
            </h2>
            <p className="text-center mb-10" style={{ color: 'var(--muted-foreground)' }}>
              选择最适合你的带货场景
            </p>
          </FadeIn>

          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {UGC_STYLE_OPTIONS.map((style) => (
              <HoverLift key={style.value}>
                <div
                  className="card-hover p-5 rounded-xl text-center cursor-pointer"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="text-3xl mb-2">{style.icon}</div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    {style.label}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {style.description}
                  </p>
                </div>
              </HoverLift>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12" style={{ background: 'var(--card)' }}>
        <div className="container mx-auto px-4">
          <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              {
                icon: Zap,
                title: '快速生成',
                desc: '秒级响应，即时生成专业脚本',
                color: 'var(--theme-red)'
              },
              {
                icon: Globe,
                title: '多语言支持',
                desc: '支持16种语言，助力跨境电商',
                color: 'var(--theme-blue)'
              },
              {
                icon: Shield,
                title: '版权合规',
                desc: '原创内容，避免侵权风险',
                color: 'var(--success)'
              },
            ].map((item) => (
              <HoverLift key={item.title}>
                <div className="p-5 rounded-xl flex items-center gap-4" style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                }}>
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}20` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
                      {item.title}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </HoverLift>
            ))}
          </Stagger>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16" style={{ background: 'var(--background)' }}>
        <div className="container mx-auto px-4">
          <FadeIn>
            <h2 className="text-center font-bold mb-10" style={{
              fontSize: 'var(--font-size-headline)',
              color: 'var(--foreground)',
            }}>
              三步完成创作
            </h2>
          </FadeIn>

          <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: '01', title: '输入商品信息', desc: '填写商品名称、卖点、价格等信息' },
              { step: '02', title: '选择风格配置', desc: '选择UGC风格、视频比例和语言' },
              { step: '03', title: '一键生成', desc: 'AI自动生成完整脚本和提示词' },
            ].map((item) => (
              <HoverLift key={item.step}>
                <div className="p-6 rounded-xl text-center relative" style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}>
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                    }}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2 mt-1" style={{
                    color: 'var(--foreground)',
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>{item.desc}</p>
                </div>
              </HoverLift>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{
        background: 'linear-gradient(135deg, oklch(0.60 0.22 15), oklch(0.55 0.20 350))'
      }}>
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="font-bold mb-4 text-2xl" style={{ color: 'white' }}>
              开始创作你的第一个带货视频
            </h2>
            <p className="mb-6 text-base opacity-90" style={{ color: 'rgba(255,255,255,0.85)' }}>
              完全免费，立即体验 AI 脚本生成
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <Link to="/create">
              <Button size="lg" style={{
                background: 'white',
                color: 'oklch(0.60 0.22 15)',
                padding: '14px 36px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
              }}>
                立即开始免费使用
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t" style={{
        borderColor: 'var(--border)',
        background: 'var(--background)',
      }}>
        <div className="container mx-auto px-4 text-center">
          <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--font-size-label)' }}>
            TikTok UGC 视频脚本生成器 · 让带货内容创作更简单
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
