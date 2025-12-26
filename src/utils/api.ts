import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, ApiError } from '@/types';

// API base URL - will be replaced with actual Cloudflare Workers URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Generic request function
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw error;
  }
}

// HTTP method helpers
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<ApiResponse<T>>({ ...config, method: 'GET', url }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<ApiResponse<T>>({ ...config, method: 'POST', url, data }),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<ApiResponse<T>>({ ...config, method: 'PUT', url, data }),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<ApiResponse<T>>({ ...config, method: 'PATCH', url, data }),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<ApiResponse<T>>({ ...config, method: 'DELETE', url }),
};

// File upload helper
export async function uploadFile(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<{ url: string; fileName: string; fileSize: number }>> {
  const formData = new FormData();
  formData.append('file', file);

  return request({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
}

// Export the axios instance for direct use if needed
export default api;
