import { useAuthStore } from '../stores/authStore';

const API_BASE = '/api';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    }
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    }
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    }
    return response.json();
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    }
    return response.json();
  },
};

export const authApi = {
  login: (email: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((res) => res.json()),

  register: (data: { email: string; password: string; name: string; companyName?: string }) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  getMe: () => api.get('/auth/me'),
};

export const riskApi = {
  getAll: (params?: { category?: string; status?: string; level?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return api.get(`/risks${queryParams ? `?${queryParams}` : ''}`);
  },

  getById: (id: string) => api.get(`/risks/${id}`),

  create: (data: any) => api.post('/risks', data),

  update: (id: string, data: any) => api.put(`/risks/${id}`, data),

  delete: (id: string) => api.delete(`/risks/${id}`),

  getStats: () => api.get('/risks/stats/overview'),
};
