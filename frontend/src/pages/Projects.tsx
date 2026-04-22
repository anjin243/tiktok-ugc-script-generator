import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives';
import { useProjects, useDeleteProject } from '@/hooks/use-api';
import { UGC_STYLE_OPTIONS, type Project } from '@/types';
import { toast } from 'sonner';

const Projects = () => {
  const { data: projects, isLoading } = useProjects();
  const deleteProjectMutation = useDeleteProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  
  // 过滤项目
  const filteredProjects = projects?.filter((project: Project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // 删除项目
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`确定要删除项目"${name}"吗？`)) {
      try {
        await deleteProjectMutation.mutateAsync(id);
        toast.success('项目已删除');
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="font-bold" style={{ 
              fontSize: 'var(--font-size-title)',
              color: 'var(--foreground)',
            }}>
              UGC 视频生成
            </h1>
          </Link>
          <Link to="/create">
            <Button style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}>
              + 新建项目
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <FadeIn>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold" style={{ 
              fontSize: 'var(--font-size-headline)',
              color: 'var(--foreground)',
            }}>
              我的项目
            </h2>
            
            {/* Search */}
            <Input
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
              style={{
                background: 'var(--input)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
        </FadeIn>
        
        {/* Loading */}
        {isLoading && (
          <div className="text-center py-20">
            <p style={{ color: 'var(--muted-foreground)' }}>加载中...</p>
          </div>
        )}
        
        {/* Empty */}
        {!isLoading && filteredProjects?.length === 0 && (
          <FadeIn>
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="font-semibold mb-2" style={{ 
                fontSize: 'var(--font-size-title)',
                color: 'var(--foreground)',
              }}>
                还没有项目
              </h3>
              <p className="mb-6" style={{ color: 'var(--muted-foreground)' }}>
                创建你的第一个带货视频项目吧
              </p>
              <Link to="/create">
                <Button style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}>
                  开始创作
                </Button>
              </Link>
            </div>
          </FadeIn>
        )}
        
        {/* Project List */}
        {!isLoading && filteredProjects && filteredProjects.length > 0 && (
          <Stagger className="space-y-4">
            {filteredProjects.map((project: Project) => (
              <HoverLift key={project.id}>
                <Card style={{ 
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}>
                  <CardHeader className="cursor-pointer" onClick={() => 
                    setExpandedProject(expandedProject === project.id ? null : project.id)
                  }>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle style={{ color: 'var(--foreground)' }}>
                            {project.name}
                          </CardTitle>
                          <Badge style={{ 
                            background: project.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                            color: project.status === 'completed' ? 'var(--success-foreground)' : 'var(--warning-foreground)',
                          }}>
                            {project.status === 'completed' ? '已完成' : '草稿'}
                          </Badge>
                        </div>
                        <CardDescription style={{ color: 'var(--muted-foreground)' }}>
                          {project.product?.name || '未关联商品'} · 
                          {UGC_STYLE_OPTIONS.find(s => s.value === project.style)?.label} · 
                          {project.duration}秒 · 
                          {formatDate(project.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg 
                          className="w-5 h-5 transition-transform" 
                          style={{ 
                            color: 'var(--muted-foreground)',
                            transform: expandedProject === project.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          }} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Expanded Content */}
                  {expandedProject === project.id && (
                    <CardContent>
                      {project.status === 'completed' && project.scenes.length > 0 && (
                        <>
                          {/* Script */}
                          {project.scriptContent && (
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                                脚本内容
                              </h4>
                              <pre className="whitespace-pre-wrap text-sm p-4 rounded-lg" style={{ 
                                background: 'var(--background)',
                                color: 'var(--foreground)',
                              }}>
                                {project.scriptContent}
                              </pre>
                            </div>
                          )}
                          
                          {/* Scenes */}
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                              分镜详情 ({project.scenes.length} 个)
                            </h4>
                            <div className="space-y-2">
                              {project.scenes.map((scene) => (
                                <div key={scene.id} className="p-3 rounded-lg" style={{ 
                                  background: 'var(--background)',
                                  border: '1px solid var(--border)',
                                }}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                                      分镜 {scene.order}
                                    </Badge>
                                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                      {scene.duration}秒
                                    </span>
                                  </div>
                                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                                    {scene.description}
                                  </p>
                                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                    口播：{scene.voiceover}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Music Style */}
                          {project.musicStyle && (
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                                推荐音乐
                              </h4>
                              <p style={{ color: 'var(--muted-foreground)' }}>{project.musicStyle}</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {project.status === 'draft' && (
                        <div className="text-center py-4">
                          <p style={{ color: 'var(--muted-foreground)' }}>
                            项目尚未完成生成
                          </p>
                          <Link to="/create">
                            <Button className="mt-2" variant="outline" style={{ 
                              color: 'var(--foreground)',
                              borderColor: 'var(--border)',
                            }}>
                              继续编辑
                            </Button>
                          </Link>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(project.id, project.name)}
                          style={{ color: 'var(--destructive)', borderColor: 'var(--border)' }}
                        >
                          删除项目
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </HoverLift>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
};

export default Projects;
