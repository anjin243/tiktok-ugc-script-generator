import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Product,
  Project,
  CreateProductInput,
  CreateProjectInput,
  GenerateScriptInput,
  ApiResponse,
} from '@/types';

// ============ Products ============

// 获取商品列表
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Product[]>>('/products');
      return response.data.data || [];
    },
  });
}

// 获取单个商品
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// 创建商品
export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await apiClient.post<ApiResponse<Product>>('/products', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// 删除商品
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ============ Projects ============

// 获取项目列表
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Project[]>>('/projects');
      return response.data.data || [];
    },
  });
}

// 获取单个项目
export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// 创建项目
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await apiClient.post<ApiResponse<Project>>('/projects', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// 更新项目
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const response = await apiClient.put<ApiResponse<Project>>(`/projects/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

// 删除项目
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ============ Generate ============

// 生成脚本
export function useGenerateScript() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: GenerateScriptInput) => {
      const response = await apiClient.post<ApiResponse<{ project: Project; script: string; scenes: any[]; voiceover: string; musicStyle: string }>>('/generate/script', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ============ File Upload ============

// 上传图片
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<ApiResponse<{ url: string }>>('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data?.url || '';
    },
  });
}

// ============ Image Recognition ============

export interface RecognizeResult {
  productName: string;
  category: string;
  confidence: number;
  suggestions: {
    categories: string[];
  };
  apiStatus?: 'success' | 'failed' | 'not_configured';
  apiProvider?: string;
  apiProviderName?: string;
  apiError?: string;
}

// 识别图片中的商品信息
export function useRecognizeImage() {
  return useMutation({
    mutationFn: async (imageBase64: string): Promise<RecognizeResult> => {
      // 获取保存的配置
      const saved = localStorage.getItem('ai_api_config');
      let config = null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          config = {
            provider: parsed.provider,
            keys: parsed.keys,
          };
        } catch (e) {
          console.error('Parse config error:', e);
        }
      }

      const response = await apiClient.post<ApiResponse<RecognizeResult>>('/recognize/image', {
        image: imageBase64,
        config,
      });
      return response.data.data;
    },
  });
}
