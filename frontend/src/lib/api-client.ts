import axios from 'axios';

// 检测当前环境，决定 API 基础地址
const getBaseURL = () => {
  // 在浏览器环境中检测是否在预览环境
  if (typeof window !== 'undefined') {
    // 如果是预览环境，使用当前端口（因为 Vite 代理会转发）
    // Vite 开发服务器会代理 /api 请求到后端
    return '/api';
  }
  return '/api';
};

/**
 * Axios instance configured for API requests
 */
export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Type-safe error handler for API errors
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

export default apiClient;
