# UGC 带货视频生成工具

## 产品概述

UGC 带货视频生成工具是一款专为电商创作者设计的 AI 驱动视频内容生成平台。用户只需输入商品信息和卖点，即可自动生成真实、接地气的 UGC 风格带货视频脚本、分镜和素材，帮助商家和创作者快速产出高质量带货内容。

## 核心功能

### 1. 商品信息管理
- 输入商品名称、价格、卖点
- 上传商品图片和视频素材
- 选择商品类目（美妆、数码、服饰、食品等）
- 保存商品信息到项目库

### 2. UGC 风格选择
- **开箱测评**：从拆快递开始的沉浸式体验
- **使用分享**：真实使用场景展示
- **对比测评**：多产品对比分析
- **剧情植入**：融入生活故事场景
- **口播讲解**：类似直播带货风格

### 3. AI 脚本生成
- 根据商品信息和风格自动生成带货脚本
- 支持自定义时长（15s/30s/60s）
- 智能提取核心卖点
- 自动生成分镜描述
- 提供拍摄建议和注意事项

### 4. 素材生成
- AI 生成商品展示图片
- 生成口播文案
- 推荐背景音乐风格
- 提供拍摄场景建议

### 5. 项目管理
- 保存历史项目
- 复用已创建的脚本
- 导出脚本和素材包
- 项目列表展示

## 用户故事

### 商家用户
> "作为一个淘宝店主，我希望快速生成多条 UGC 风格的带货视频脚本，让我的商品能以更真实的方式展示给消费者。"

### 内容创作者
> "作为一个短视频博主，我希望有一个工具能帮我快速生成带货内容创意，节省脚本创作时间。"

### MCN 机构
> "作为一个 MCN 运营，我希望批量生成不同风格的带货脚本，用于指导旗下达人的内容创作。"

## 页面结构

### 首页 (/)
- Hero 区域：产品介绍和价值主张
- 功能亮点展示
- 快速开始入口

### 创建页面 (/create)
- 步骤 1：输入商品信息
- 步骤 2：选择 UGC 风格
- 步骤 3：生成脚本和素材
- 步骤 4：预览和导出

### 项目库 (/projects)
- 历史项目列表
- 搜索和筛选
- 编辑和删除功能

## 数据模型

### Product（商品）
```typescript
interface Product {
  id: string;
  name: string;           // 商品名称
  price: number;          // 价格
  category: string;       // 类目
  sellingPoints: string[];// 卖点列表
  images: string[];       // 商品图片URL
  videos: string[];       // 商品视频URL
  createdAt: Date;
}
```

### Project（项目）
```typescript
interface Project {
  id: string;
  name: string;           // 项目名称
  product: Product;       // 关联商品
  style: UGCStyle;        // UGC风格
  duration: number;       // 视频时长（秒）
  script: Script;         // 生成的脚本
  materials: Material[];  // 生成的素材
  status: 'draft' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Script（脚本）
```typescript
interface Script {
  id: string;
  content: string;        // 完整脚本内容
  scenes: Scene[];        // 分镜列表
  voiceover: string;      // 口播文案
  musicStyle: string;     // 推荐音乐风格
}
```

### Scene（分镜）
```typescript
interface Scene {
  id: string;
  order: number;          // 顺序
  duration: number;       // 时长（秒）
  description: string;    // 画面描述
  voiceover: string;      // 该段的口播内容
  cameraAngle: string;    // 拍摄角度建议
  notes: string;          // 拍摄注意事项
}
```

### Material（素材）
```typescript
interface Material {
  id: string;
  type: 'image' | 'text';
  content: string;        // 图片URL或文本内容
  prompt?: string;        // 生成提示词
}
```

## API 端点

### 商品管理
- `POST /api/product` - 创建商品
- `GET /api/product/:id` - 获取商品详情
- `GET /api/products` - 获取商品列表

### 项目管理
- `POST /api/project` - 创建项目
- `GET /api/project/:id` - 获取项目详情
- `GET /api/projects` - 获取项目列表
- `PUT /api/project/:id` - 更新项目
- `DELETE /api/project/:id` - 删除项目

### 脚本生成
- `POST /api/generate/script` - 生成带货脚本
- `POST /api/generate/materials` - 生成素材（图片）

## 技术栈

- **前端**: React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Express + TypeScript + Prisma
- **数据库**: PostgreSQL
- **AI 服务**: 腾讯混元大模型（脚本生成）、腾讯 AI 绘画（素材生成）
