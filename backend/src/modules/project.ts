import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { CreateProjectSchema } from '../types/product.types';

const router = Router();
const prisma = new PrismaClient();

// 创建项目
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateProjectSchema.parse(req.body);
    
    // 如果提供了商品信息，先创建商品
    let productId = data.productId;
    if (data.product && !productId) {
      const product = await prisma.product.create({
        data: {
          name: data.product.name,
          price: data.product.price,
          category: data.product.category,
          sellingPoints: data.product.sellingPoints,
          images: data.product.images || [],
          videos: data.product.videos || [],
        },
      });
      productId = product.id;
    }
    
    const project = await prisma.project.create({
      data: {
        name: data.name,
        style: data.style,
        duration: data.duration,
        status: 'draft',
        productId: productId || null,
      },
      include: { product: true },
    });
    
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      console.error('Create project error:', error);
      res.status(500).json({ success: false, error: 'Failed to create project' });
    }
  }
});

// 获取项目列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        product: true,
        scenes: { orderBy: { order: 'asc' } },
        materials: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 解析每个项目的场景数据
    const parsedProjects = projects.map(project => ({
      ...project,
      scenes: project.scenes.map(scene => {
        let parsedNotes = {};
        try {
          parsedNotes = scene.notes ? JSON.parse(scene.notes) : {};
        } catch {
          parsedNotes = {};
        }
        
        return {
          ...scene,
          visualPrompt: (parsedNotes as any).visualPrompt || '',
          visualPromptCN: scene.description || '',
          cameraMovement: scene.cameraAngle?.split(',')[0]?.trim() || '',
          cameraAngle: scene.cameraAngle?.split(',')[1]?.trim() || '',
          cameraDistance: (parsedNotes as any).cameraDistance || '',
          subject: (parsedNotes as any).subject || '',
          action: (parsedNotes as any).action || '',
          environment: (parsedNotes as any).environment || '',
          lighting: (parsedNotes as any).lighting || '',
          mood: (parsedNotes as any).mood || '',
          colorTone: (parsedNotes as any).colorTone || '',
          transition: (parsedNotes as any).transition || '',
          musicSuggestion: (parsedNotes as any).musicSuggestion || '',
          startTime: (parsedNotes as any).startTime ?? scene.order * scene.duration,
          endTime: (parsedNotes as any).endTime ?? (scene.order + 1) * scene.duration,
        };
      }),
    }));
    
    res.json({ success: true, data: parsedProjects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: 'Failed to get projects' });
  }
});

// 获取单个项目
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        product: true,
        scenes: { orderBy: { order: 'asc' } },
        materials: true,
      },
    });
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // 解析场景的 notes 字段，展开完整的AI视频生成数据
    const parsedProject = {
      ...project,
      scenes: project.scenes.map(scene => {
        let parsedNotes = {};
        try {
          parsedNotes = scene.notes ? JSON.parse(scene.notes) : {};
        } catch {
          parsedNotes = {};
        }
        
        return {
          ...scene,
          // 展开AI视频生成专用字段
          visualPrompt: (parsedNotes as any).visualPrompt || '',
          visualPromptCN: scene.description || '',
          cameraMovement: scene.cameraAngle?.split(',')[0]?.trim() || '',
          cameraAngle: scene.cameraAngle?.split(',')[1]?.trim() || '',
          cameraDistance: (parsedNotes as any).cameraDistance || '',
          subject: (parsedNotes as any).subject || '',
          action: (parsedNotes as any).action || '',
          environment: (parsedNotes as any).environment || '',
          lighting: (parsedNotes as any).lighting || '',
          mood: (parsedNotes as any).mood || '',
          colorTone: (parsedNotes as any).colorTone || '',
          transition: (parsedNotes as any).transition || '',
          musicSuggestion: (parsedNotes as any).musicSuggestion || '',
          startTime: (parsedNotes as any).startTime ?? scene.order * scene.duration,
          endTime: (parsedNotes as any).endTime ?? (scene.order + 1) * scene.duration,
        };
      }),
    };
    
    res.json({ success: true, data: parsedProject });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: 'Failed to get project' });
  }
});

// 更新项目
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, scriptContent, voiceover, musicStyle } = req.body;
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(scriptContent && { scriptContent }),
        ...(voiceover && { voiceover }),
        ...(musicStyle && { musicStyle }),
      },
    });
    
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// 删除项目
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 先删除关联的 scenes 和 materials
    await prisma.scene.deleteMany({ where: { projectId: id } });
    await prisma.material.deleteMany({ where: { projectId: id } });
    
    await prisma.project.delete({
      where: { id },
    });
    
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

export default router;
