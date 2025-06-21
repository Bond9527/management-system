import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, LoginRequest } from "@/services/api";
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
        const { username: savedUsername, password: savedPassword, rememberMe: savedRememberMe } = JSON.parse(savedLoginInfo) as SavedLoginInfo;
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
        password
      };
      setSubmitted(formData);

      try {
        // 调用登录API
        const response = await login(formData);
        console.log("Login successful:", response);

        // 更新认证上下文
        authLogin(response.user);

        // 处理记住密码
        if (rememberMe) {
          const loginInfo: SavedLoginInfo = {
            username,
            password,
            rememberMe: true
          };
          localStorage.setItem("loginInfo", JSON.stringify(loginInfo));
        } else {
          localStorage.removeItem("loginInfo");
        }

        // 登录成功后跳转到首页
        navigate("/dashboard");
      } catch (error) {
        console.error("Login failed:", error);
        setErrors([error instanceof Error ? error.message : "登录失败，请检查用户名和密码"]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            欢迎回来
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            请登录您的账号
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="账号"
              type="username"
              labelPlacement="inside"
              className="w-full"
              isClearable
              onClear={() => {
                setUsername("");
                setErrors([]);
              }}
              value={username}
              onValueChange={setUsername}
              isInvalid={errors.includes("请输入账号")}
              errorMessage={errors.includes("请输入账号") ? "请输入账号" : ""}
              isDisabled={isLoading}
            />
            
            <Input
              label="密码"
              type={showPassword ? "text" : "password"}
              labelPlacement="inside"
              className="w-full"
              value={password}
              onValueChange={setPassword}
              isInvalid={errors.includes("请输入密码")}
              errorMessage={errors.includes("请输入密码") ? "请输入密码" : ""}
              isDisabled={isLoading}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              }
            />
          </div>

          {/* 显示API错误信息 */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox
                isSelected={rememberMe}
                onValueChange={setRememberMe}
                size="sm"
                color="primary"
                isDisabled={isLoading}
              >
                记住我
              </Checkbox>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                忘记密码?
              </a>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              isLoading={isLoading}
              disabled={isLoading}
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
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 