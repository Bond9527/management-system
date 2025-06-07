import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<FormData | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const validateForm = () => {
    const newErrors: string[] = [];
    if (!username.trim()) {
      newErrors.push("请输入用户名");
    }
    if (!email.trim()) {
      newErrors.push("请输入账号");
    }
    if (!password.trim()) {
      newErrors.push("请输入密码");
    } else if (password.length < 6) {
      newErrors.push("密码长度至少为6位");
    }
    if (!confirmPassword.trim()) {
      newErrors.push("请确认密码");
    } else if (password !== confirmPassword) {
      newErrors.push("两次输入的密码不一致");
    }
    if (!agreeTerms) {
      newErrors.push("请同意服务条款");
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      const formData: FormData = {
        username,
        email,
        password,
        confirmPassword
      };
      setSubmitted(formData);
      console.log("Form submitted:", formData);
      // 注册成功后跳转到登录页
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            创建账号
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            请填写以下信息完成注册
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-7">
            <Input
              label="用户名"
              type="username"
              labelPlacement="outside"
              className="w-full"
              isClearable
              onClear={() => {
                setUsername("");
                setErrors([]);
              }}
              value={username}
              onValueChange={setUsername}
              isInvalid={errors.includes("请输入用户名")}
              errorMessage={errors.includes("请输入用户名") ? "请输入用户名" : ""}
              classNames={{
                input: "h-12",
                inputWrapper: "h-12 bg-gray-50/50 hover:bg-gray-100/50 focus-within:bg-white/80 backdrop-blur-sm",
              }}
            />

            <Input
              label="账号"
              type="text"
              labelPlacement="outside"
              className="w-full"
              isClearable
              onClear={() => {
                setEmail("");
                setErrors([]);
              }}
              value={email}
              onValueChange={setEmail}
              isInvalid={errors.includes("请输入账号")}
              errorMessage={errors.includes("请输入账号") ? "请输入账号" : ""}
              classNames={{
                input: "h-12",
                inputWrapper: "h-12 bg-gray-50/50 hover:bg-gray-100/50 focus-within:bg-white/80 backdrop-blur-sm",
              }}
            />
            
            <Input
              label="密码"
              type={showPassword ? "text" : "password"}
              labelPlacement="outside"
              className="w-full"
              value={password}
              onValueChange={setPassword}
              isInvalid={errors.includes("请输入密码") || errors.includes("密码长度至少为6位")}
              errorMessage={errors.includes("请输入密码") ? "请输入密码" :
                          errors.includes("密码长度至少为6位") ? "密码长度至少为6位" : ""}
              classNames={{
                input: "h-12",
                inputWrapper: "h-12 bg-gray-50/50 hover:bg-gray-100/50 focus-within:bg-white/80 backdrop-blur-sm",
              }}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none text-gray-400 hover:text-gray-600 transition-colors"
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

            <Input
              label="确认密码"
              type={showConfirmPassword ? "text" : "password"}
              labelPlacement="outside"
              className="w-full"
              value={confirmPassword}
              onValueChange={setConfirmPassword}
              isInvalid={errors.includes("请确认密码") || errors.includes("两次输入的密码不一致")}
              errorMessage={errors.includes("请确认密码") ? "请确认密码" :
                          errors.includes("两次输入的密码不一致") ? "两次输入的密码不一致" : ""}
              classNames={{
                input: "h-12",
                inputWrapper: "h-12 bg-gray-50/50 hover:bg-gray-100/50 focus-within:bg-white/80 backdrop-blur-sm",
              }}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="focus:outline-none text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
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

          <div className="flex items-center">
            <Checkbox
              isSelected={agreeTerms}
              onValueChange={setAgreeTerms}
              size="sm"
              color="primary"
            >
              我已阅读并同意
              <Link to="/terms" className="text-blue-600 hover:text-blue-500 ml-1">
                服务条款
              </Link>
            </Checkbox>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              注册
            </Button>
          </div>
        </form>

        {submitted && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              注册信息: <code>{JSON.stringify(submitted)}</code>
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            已有账号?{" "}
            <Link to="/" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 