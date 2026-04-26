import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function useResearchApi() {
  const { token } = useAuthStore();

  const authFetch = async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(`${API_BASE}/api/v1/research${path}`, { ...options, headers });
  };

  return { authFetch, API_BASE };
}
