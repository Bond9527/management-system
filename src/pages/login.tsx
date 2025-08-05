import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { addToast } from "@heroui/toast";
import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import { login } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface FormData {
  username: string;
  password: string;
}

interface SavedLoginInfo {
  username: string;
  password: string;
  rememberMe: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<FormData | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 从 localStorage 读取保存的登录信息
  useEffect(() => {
    const savedLoginInfo = localStorage.getItem("loginInfo");

    if (savedLoginInfo) {
      try {
        const {
          username: savedUsername,
          password: savedPassword,
          rememberMe: savedRememberMe,
        } = JSON.parse(savedLoginInfo) as SavedLoginInfo;

        if (savedRememberMe) {
          setUsername(savedUsername);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Failed to parse saved login info:", error);
        localStorage.removeItem("loginInfo");
      }
    }
  }, []);

  // 检查URL参数中的消息
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const messageParam = searchParams.get("message");

    if (messageParam === "session_expired") {
      addToast({
        title: "会话过期",
        description: "您的登录会话已过期，请重新登录",
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
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  }, [location]);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!username.trim()) {
      newErrors.push("请输入账号");
    }
    if (!password.trim()) {
      newErrors.push("请输入密码");
    }
    setErrors(newErrors);

    return newErrors.length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      setErrors([]);

      const formData: FormData = {
        username,
        password,
      };

      setSubmitted(formData);

      try {
        // 调用登录API
        const response = await login(formData);

        // 显示成功提示
        addToast({
          title: "登录成功",
          description: "正在跳转...",
          color: "success",
          icon: (
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          ),
          timeout: 2000,
          shouldShowTimeoutProgress: true,
        });

        // 更新认证上下文
        authLogin(response.user);

        // 处理记住密码
        if (rememberMe) {
          const loginInfo: SavedLoginInfo = {
            username,
            password,
            rememberMe: true,
          };

          localStorage.setItem("loginInfo", JSON.stringify(loginInfo));
        } else {
          localStorage.removeItem("loginInfo");
        }

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          // 检查是否有返回路径
          const returnPath = sessionStorage.getItem("returnPath");

          if (returnPath) {
            sessionStorage.removeItem("returnPath"); // 清除保存的路径
            navigate(returnPath);
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      } catch (error) {
        console.error("Login failed:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "登录失败，请检查用户名和密码";

        // 显示错误提示
        addToast({
          title: "登录失败",
          description: errorMessage,
          color: "danger",
          icon: (
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" x2="9" y1="9" y2="15" />
              <line x1="9" x2="15" y1="9" y2="15" />
            </svg>
          ),
          timeout: 5000,
          shouldShowTimeoutProgress: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">欢迎回来</h2>
          <p className="mt-2 text-sm text-gray-600">请登录您的账号</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              isClearable
              className="w-full"
              errorMessage={errors.includes("请输入账号") ? "请输入账号" : ""}
              isDisabled={isLoading}
              isInvalid={errors.includes("请输入账号")}
              label="账号"
              labelPlacement="inside"
              type="username"
              value={username}
              onClear={() => {
                setUsername("");
                setErrors([]);
              }}
              onValueChange={setUsername}
            />

            <Input
              className="w-full"
              endContent={
                <button
                  className="focus:outline-none"
                  disabled={isLoading}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              }
              errorMessage={errors.includes("请输入密码") ? "请输入密码" : ""}
              isDisabled={isLoading}
              isInvalid={errors.includes("请输入密码")}
              label="密码"
              labelPlacement="inside"
              type={showPassword ? "text" : "password"}
              value={password}
              onValueChange={setPassword}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox
                color="primary"
                isDisabled={isLoading}
                isSelected={rememberMe}
                size="sm"
                onValueChange={setRememberMe}
              >
                记住我
              </Checkbox>
            </div>

            <div className="text-sm">
              <Link
                className="font-medium text-blue-600 hover:text-blue-500"
                to="/forgot-password"
              >
                忘记密码?
              </Link>
            </div>
          </div>

          <div>
            <Button
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              disabled={isLoading}
              isLoading={isLoading}
              type="submit"
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </div>
        </form>

        {submitted && !isLoading && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              登录信息: <code>{JSON.stringify(submitted)}</code>
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            还没有账号?{" "}
            <Link
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              to="/register"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
