const API_BASE_URL = 'http://localhost:8000/api';

// 简单的API客户端
export const api = {
  get: async (url: string, config?: { params?: Record<string, any> }) => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let fullUrl = `${API_BASE_URL}${url}`;
    if (config?.params) {
      const params = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      fullUrl += `?${params.toString()}`;
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  post: async (url: string, data?: any) => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  put: async (url: string, data?: any) => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  delete: async (url: string) => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  msg: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  department?: string;
  position?: string;
}

// 获取存储的token
const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// 设置token
const setToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

// 移除token
const removeToken = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// 通用请求函数 - 导出供其他模块使用
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// 登录API
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiRequest<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  // 保存token
  setToken(response.access);
  localStorage.setItem('refresh_token', response.refresh);
  
  return response;
};

// 注册API
export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  return apiRequest<RegisterResponse>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// 获取用户信息API
export const getUserInfo = async (): Promise<UserInfo> => {
  return apiRequest<UserInfo>('/user/');
};

// 刷新token API
export const refreshToken = async (): Promise<{ access: string }> => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) {
    throw new Error('No refresh token available');
  }

  const response = await apiRequest<{ access: string }>('/auth/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  });

  setToken(response.access);
  return response;
};

// 登出
export const logout = (): void => {
  removeToken();
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return !!getToken();
}; 