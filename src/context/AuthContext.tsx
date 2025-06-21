import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserInfo, logout as apiLogout, isAuthenticated } from '@/services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  department?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
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

  // 检查用户是否已登录并获取用户信息
  const checkAuthStatus = async () => {
    try {
      if (isAuthenticated()) {
        const userInfo = await getUserInfo();
        setUser(userInfo);
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
      // 如果获取用户信息失败，清除token
      apiLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      if (isAuthenticated()) {
        const userInfo = await getUserInfo();
        setUser(userInfo);
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 