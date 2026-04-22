import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { CreateProductSchema } from '../types/product.types';

const router = Router();
const prisma = new PrismaClient();

// 创建商品
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateProductSchema.parse(req.body);
    
    const product = await prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        category: data.category,
        sellingPoints: data.sellingPoints,
        images: data.images,
        videos: data.videos,
      },
    });
    
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      console.error('Create product error:', error);
      res.status(500).json({ success: false, error: 'Failed to create product' });
    }
  }
});

// 获取商品列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

// 获取单个商品
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: { projects: true },
    });
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, error: 'Failed to get product' });
  }
});

// 删除商品
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.product.delete({
      where: { id },
    });
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

export default router;
