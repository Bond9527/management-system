import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getUserInfo, logout as apiLogout, isAuthenticated } from '@/services/api';
import { addToast } from "@heroui/toast";

export interface User {
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 处理认证失效的情况
  const handleAuthenticationExpired = () => {
    if (isRedirecting) return; // 防止重复处理
    setIsRedirecting(true);
    
    setUser(null);
    apiLogout();
    
    // 显示登录过期提示
    addToast({
      title: "登录已过期",
      description: "您的登录已过期，请重新登录",
      color: "warning",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      ),
      timeout: 5000,
      shouldShowTimeoutProgress: true,
    });

    // 跳转到登录页面
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      // 保存当前路径，以便登录后返回
      sessionStorage.setItem('returnPath', currentPath);
      window.location.href = '/login?message=session_expired';
    }
  };

  // 检查用户是否已登录并获取用户信息
  const checkAuthStatus = async () => {
    try {
      if (isAuthenticated()) {
        const userInfo = await getUserInfo();
        setUser(userInfo);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Failed to get user info:', error);
      
      // 如果是认证过期错误，进行相应处理
      if (error.message === 'AUTHENTICATION_EXPIRED') {
        handleAuthenticationExpired();
      } else {
        // 其他错误也清除token
        apiLogout();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // 设置定期检查token有效性的定时器（每5分钟检查一次）
    intervalRef.current = setInterval(() => {
      if (isAuthenticated()) {
        refreshUser();
      }
    }, 5 * 60 * 1000); // 5分钟
    
    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    // 跳转到登录页面
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      if (isAuthenticated()) {
        const userInfo = await getUserInfo();
        setUser(userInfo);
      }
    } catch (error: any) {
      console.error('Failed to refresh user info:', error);
      
      // 如果是认证过期错误，进行相应处理
      if (error.message === 'AUTHENTICATION_EXPIRED') {
        handleAuthenticationExpired();
      } else {
        logout();
      }
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 