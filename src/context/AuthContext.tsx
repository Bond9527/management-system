import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { addToast } from "@heroui/toast";

import {
  getUserInfo,
  logout as apiLogout,
  isAuthenticated,
  refreshToken,
} from "@/services/api";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  department_id?: number | null;
  job_title?: string;
  job_title_id?: number | null;
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
    throw new Error("useAuth must be used within an AuthProvider");
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
  const lastRefreshAttempt = useRef<number>(0);

  // 处理认证失效的情况
  const handleAuthenticationExpired = () => {
    if (isRedirecting) return; // 防止重复处理
    setIsRedirecting(true);

    console.log("🔐 认证已过期，开始处理...");

    setUser(null);
    apiLogout();

    // 显示登录过期提示
    addToast({
      title: "登录已过期",
      description: "您的登录已过期，请重新登录",
      color: "warning",
      icon: (
        <svg
          fill="none"
          height="20"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="20"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      timeout: 5000,
      shouldShowTimeoutProgress: true,
    });

    // 跳转到登录页面
    const currentPath = window.location.pathname;

    if (currentPath !== "/login" && currentPath !== "/register") {
      // 保存当前路径，以便登录后返回
      sessionStorage.setItem("returnPath", currentPath);
      window.location.href = "/login?message=session_expired";
    }
  };

  // 检查用户是否已登录并获取用户信息
  const checkAuthStatus = async () => {
    try {
      console.log("🔐 开始检查认证状态...");
      
      if (isAuthenticated()) {
        console.log("✅ Token有效，获取用户信息...");
        const userInfo = await getUserInfo();
        setUser(userInfo);
        console.log("✅ 用户信息获取成功:", userInfo);
      } else {
        console.log("❌ Token无效，尝试刷新...");
        
        // 尝试自动刷新token
        try {
          console.log("🔄 尝试自动刷新token...");
          const newTokenData = await refreshToken();
          console.log("✅ Token刷新成功:", newTokenData);
          
          // 重新获取用户信息
          const userInfo = await getUserInfo();
          setUser(userInfo);
          console.log("✅ 用户重新认证成功:", userInfo);
        } catch (refreshError) {
          console.log("❌ Token刷新失败，用户需要重新登录:", refreshError);
          setUser(null);
          apiLogout();
        }
      }
    } catch (error: any) {
      console.error("❌ 认证状态检查失败:", error);

      // 如果是认证过期错误，尝试刷新token
      if (error.message === "AUTHENTICATION_EXPIRED") {
        console.log("🔄 认证过期，尝试刷新token...");
        try {
          const newTokenData = await refreshToken();
          console.log("✅ Token刷新成功:", newTokenData);
          
          // 重新获取用户信息
          const userInfo = await getUserInfo();
          setUser(userInfo);
          console.log("✅ 用户重新认证成功:", userInfo);
        } catch (refreshError) {
          console.log("❌ Token刷新失败，处理认证过期:", refreshError);
          handleAuthenticationExpired();
        }
      } else {
        // 其他错误也清除token
        console.log("❌ 其他认证错误，清除token");
        apiLogout();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    // 设置定期检查token有效性的定时器（每15分钟检查一次）
    intervalRef.current = setInterval(
      async () => {
        // 如果用户未登录，不执行刷新
        if (!isAuthenticated()) {
          console.log("User not authenticated, skipping token refresh");

          return;
        }

        const now = Date.now();

        // 确保两次刷新之间至少间隔5分钟
        if (now - lastRefreshAttempt.current < 5 * 60 * 1000) {
          console.log("Skipping refresh, too soon since last attempt");

          return;
        }

        try {
          // 先尝试刷新token
          console.log("Attempting to refresh token...");
          await refreshToken();
          lastRefreshAttempt.current = now;

          // 然后刷新用户信息
          console.log("Token refreshed, updating user info...");
          await refreshUser();
        } catch (error) {
          console.error("Failed to refresh token:", error);
          // 如果刷新失败，清除定时器并处理认证过期
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          handleAuthenticationExpired();
        }
      },
      15 * 60 * 1000,
    ); // 15分钟

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    lastRefreshAttempt.current = Date.now(); // 记录登录时间
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    lastRefreshAttempt.current = 0;
    // 跳转到登录页面
    window.location.href = "/login";
  };

  const refreshUser = async () => {
    try {
      if (!isAuthenticated()) {
        console.log("User not authenticated, skipping user info refresh");

        return;
      }

      const now = Date.now();

      // 确保两次刷新之间至少间隔1分钟
      if (now - lastRefreshAttempt.current < 60 * 1000) {
        console.log("Skipping user info refresh, too soon since last attempt");

        return;
      }

      console.log("Fetching user info...");
      const userInfo = await getUserInfo();

      setUser(userInfo);
      lastRefreshAttempt.current = now;
    } catch (error: any) {
      console.error("Failed to refresh user info:", error);

      if (error.message === "AUTHENTICATION_EXPIRED") {
        handleAuthenticationExpired();
      } else {
        // 其他错误尝试刷新token
        try {
          console.log(
            "Attempting to refresh token due to user info fetch failure...",
          );
          await refreshToken();
          console.log("Token refreshed, retrying user info fetch...");
          const userInfo = await getUserInfo();

          setUser(userInfo);
          lastRefreshAttempt.current = Date.now();
        } catch (refreshError) {
          console.error(
            "Failed to refresh token after user info fetch failure:",
            refreshError,
          );
          handleAuthenticationExpired();
        }
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
