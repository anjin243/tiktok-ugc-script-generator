import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives';
import { UGC_STYLE_OPTIONS } from '@/types';

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ 
        background: 'linear-gradient(to bottom, var(--hero), var(--background))',
        padding: 'var(--spacing-3xl) 0',
      }}>
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ 
              background: 'var(--secondary)',
              color: 'var(--primary)',
            }}>
              <span className="text-sm font-medium">AI 驱动 UGC 视频创作</span>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <h1 className="font-bold mb-6" style={{ 
              fontSize: 'var(--font-size-display)',
              color: 'var(--foreground)',
              lineHeight: 1.2,
            }}>
              一键生成<br />
              <span style={{ color: 'var(--primary)' }}>带货视频脚本</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="mb-8 max-w-2xl mx-auto" style={{ 
              fontSize: 'var(--font-size-headline)',
              color: 'var(--muted-foreground)',
            }}>
              输入商品信息，AI 自动生成真实、接地气的 UGC 风格带货视频脚本、分镜和素材
            </p>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/create">
                <Button size="lg" className="text-lg font-semibold px-8 py-6" style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  boxShadow: 'var(--glow-primary)',
                }}>
                  立即开始创作
                </Button>
              </Link>
              <Link to="/projects">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}>
                  查看我的项目
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
        
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{
            background: 'var(--primary)',
          }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{
            background: 'var(--accent)',
          }} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" style={{ background: 'var(--background)' }}>
        <div className="container mx-auto px-4">
          <FadeIn>
            <h2 className="text-center font-bold mb-12" style={{ 
              fontSize: 'var(--font-size-headline)',
              color: 'var(--foreground)',
            }}>
              支持 5 种 UGC 风格
            </h2>
          </FadeIn>
          
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {UGC_STYLE_OPTIONS.map((style) => (
              <HoverLift key={style.value}>
                <div className="p-6 rounded-xl text-center" style={{ 
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}>
                  <div className="text-4xl mb-4">{style.icon}</div>
                  <h3 className="font-semibold mb-2" style={{ 
                    fontSize: 'var(--font-size-title)',
                    color: 'var(--foreground)',
                  }}>
                    {style.label}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {style.description}
                  </p>
                </div>
              </HoverLift>
            ))}
          </Stagger>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ background: 'var(--card)' }}>
        <div className="container mx-auto px-4">
          <FadeIn>
            <h2 className="text-center font-bold mb-12" style={{ 
              fontSize: 'var(--font-size-headline)',
              color: 'var(--foreground)',
            }}>
              三步完成创作
            </h2>
          </FadeIn>
          
          <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: '输入商品信息', desc: '填写商品名称、卖点、价格等信息' },
              { step: '02', title: '选择 UGC 风格', desc: '选择开箱、使用、对比等风格' },
              { step: '03', title: '生成脚本', desc: 'AI 自动生成脚本和分镜' },
            ].map((item) => (
              <HoverLift key={item.step}>
                <div className="p-8 rounded-xl text-center" style={{ 
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                }}>
                  <div className="text-5xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2" style={{ 
                    fontSize: 'var(--font-size-title)',
                    color: 'var(--foreground)',
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>{item.desc}</p>
                </div>
              </HoverLift>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ background: 'var(--background)' }}>
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="font-bold mb-6" style={{ 
              fontSize: 'var(--font-size-headline)',
              color: 'var(--foreground)',
            }}>
              开始创作你的第一个带货视频
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Link to="/create">
              <Button size="lg" className="text-lg font-semibold px-12 py-6" style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                boxShadow: 'var(--glow-primary)',
              }}>
                免费开始
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ 
        borderColor: 'var(--border)',
        background: 'var(--background)',
      }}>
        <div className="container mx-auto px-4 text-center">
          <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--font-size-label)' }}>
            UGC 带货视频生成工具 - 让带货内容创作更简单
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
