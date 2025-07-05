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
      console.log('POST 错误详情:', errorData);
      
      // 处理验证错误 - 显示详细的字段错误信息
      if (response.status === 400 && errorData) {
        const errorMessages = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        throw new Error(errorMessages.length > 0 ? errorMessages.join('; ') : `HTTP error! status: ${response.status}`);
      }
      
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
      console.log('PUT 错误详情:', errorData);
      
      // 处理验证错误 - 显示详细的字段错误信息
      if (response.status === 400 && errorData) {
        const errorMessages = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        throw new Error(errorMessages.length > 0 ? errorMessages.join('; ') : `HTTP error! status: ${response.status}`);
      }
      
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

    // 检查响应是否有内容，如果没有内容则返回空对象
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      // 如果没有JSON内容，返回空对象表示成功
      return {};
    }
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
  department_id?: number;
  job_title?: string;
  job_title_id?: number;
  phone?: string;
  employee_id?: string;
  avatar?: string | null;
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
export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const makeRequest = async (token?: string | null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {})
    } as Record<string, string>;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 特别处理401错误
      if (response.status === 401) {
        // 尝试刷新token
        try {
          const newTokenData = await refreshToken();
          // 使用新token重试请求
          return makeRequest(newTokenData.access);
        } catch (refreshError) {
          // 如果刷新token失败，抛出认证过期错误
          throw new Error('AUTHENTICATION_EXPIRED');
        }
      }
      
      // 其他错误正常处理
      let errorMessage = errorData.error || errorData.detail || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  };

  try {
    const token = localStorage.getItem('access_token');
    return await makeRequest(token);
  } catch (error) {
    if (error instanceof Error) {
      // 如果是认证过期错误，直接抛出
      if (error.message === 'AUTHENTICATION_EXPIRED') {
        throw error;
      }
      
      console.error('API Request Failed:', {
        endpoint,
        error: error.message,
        requestOptions: {
          method: options.method,
          headers: options.headers,
          body: options.body ? JSON.parse(options.body as string) : undefined
        }
      });
    }
    throw error;
  }
};

// 登录API
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // 保存token
  setToken(data.access);
  localStorage.setItem('refresh_token', data.refresh);
  
  return data;
};

// 注册API
export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE_URL}/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// 获取用户信息API
export const getUserInfo = async (): Promise<UserInfo> => {
  return apiRequest<UserInfo>('/user/info/');
};

// 刷新token API
export const refreshToken = async (): Promise<{ access: string }> => {
  const refresh = localStorage.getItem('refresh_token');
  console.log('Refresh token debug:', {
    hasRefreshToken: !!refresh,
    refreshTokenLength: refresh?.length,
    refreshTokenPreview: refresh ? refresh.substring(0, 50) + '...' : null
  });
  
  if (!refresh) {
    throw new Error('No refresh token available');
  }

  // 直接调用fetch，避免使用apiRequest造成无限递归
  const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  });

  console.log('Refresh token response:', {
    status: response.status,
    statusText: response.statusText
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Refresh token error:', errorData);
    throw new Error(errorData.error || errorData.detail || 'Failed to refresh token');
  }

  const data = await response.json();
  console.log('New access token received:', {
    hasNewToken: !!data.access,
    newTokenLength: data.access?.length,
    newTokenPreview: data.access ? data.access.substring(0, 50) + '...' : null
  });
  
  setToken(data.access);
  return data;
};

// 登出
export const logout = (): void => {
  removeToken();
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  const token = getToken();
  const refreshToken = localStorage.getItem('refresh_token');
  
  // 添加JWT token检查
  if (token) {
    try {
      // 简单的JWT解码（仅用于调试）
      const base64Payload = token.split('.')[1];
      if (base64Payload) {
        const payload = JSON.parse(atob(base64Payload));
        const now = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp < now;
        
        console.log('JWT Token Analysis:', {
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          tokenPreview: token.substring(0, 20) + '...',
          userId: payload.user_id,
          issuedAt: new Date(payload.iat * 1000).toISOString(),
          expiresAt: new Date(payload.exp * 1000).toISOString(),
          isExpired,
          timeUntilExpiry: isExpired ? 'EXPIRED' : `${payload.exp - now} seconds`
        });
        
        // 如果token已过期但有refresh token，则返回true让refresh逻辑处理
        return !isExpired || !!refreshToken;
      }
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return false;
    }
  }
  
  console.log('Authentication check:', { 
    hasToken: !!token, 
    hasRefreshToken: !!refreshToken,
    tokenPreview: token ? token.substring(0, 20) + '...' : null
  });
  return !!token;
};

// 上传头像API
export const uploadAvatar = async (file: File): Promise<{ message: string; avatar_url: string | null }> => {
  const token = getToken();
  const formData = new FormData();
  formData.append('avatar', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/upload-avatar/`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// 删除头像API
export const deleteAvatar = async (): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>('/delete-avatar/', {
    method: 'DELETE',
  });
};

// 获取职称列表
export interface JobTitle {
  id: number;
  name: string;
  level: string;
}

export const getJobTitles = async (): Promise<JobTitle[]> => {
  return apiRequest<JobTitle[]>('/job-titles/');
};

// 获取部门列表
export interface Department {
  id: number;
  name: string;
  description?: string;
}

export const getDepartments = async (): Promise<Department[]> => {
  return apiRequest<Department[]>('/departments/');
};

// 更新用户职称
export const updateUserJobTitle = async (jobTitleId: number | null): Promise<UserInfo> => {
  return apiRequest<UserInfo>('/user/info/', {
    method: 'PUT',
    body: JSON.stringify({ job_title: jobTitleId }),
  });
};

// 更新用户部门
export const updateUserDepartment = async (departmentId: number | null): Promise<UserInfo> => {
  return apiRequest<UserInfo>('/user/info/', {
    method: 'PUT',
    body: JSON.stringify({ department: departmentId }),
  });
};

export const updateUserEmployeeId = async (employeeId: string): Promise<UserInfo> => {
  return apiRequest<UserInfo>('/user/info/', {
    method: 'PUT',
    body: JSON.stringify({
      employee_id: employeeId
    }),
  });
};

// 检查工号是否重复
export const checkEmployeeIdExists = async (employeeId: string): Promise<{ exists: boolean }> => {
  return apiRequest<{ exists: boolean }>('/check-employee-id/', {
    method: 'POST',
    body: JSON.stringify({
      employee_id: employeeId
    }),
  });
};

// 修改密码
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>('/change-password/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 忘记密码
export interface ForgotPasswordRequest {
  username: string;
}

export interface ForgotPasswordResponse {
  message: string;
  token: string;
  username: string;
}

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
  const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// 重置密码
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export const resetPassword = async (data: ResetPasswordRequest): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/reset-password/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}; 