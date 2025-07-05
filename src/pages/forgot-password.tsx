import React, { useState } from 'react';
import { Input, Button } from "@heroui/react";
import { Link, useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { forgotPassword } from "@/services/api";
import { User as UserIcon, ArrowLeft as ArrowLeftIcon } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      addToast({
        title: "输入错误",
        description: "请输入账号",
        color: "danger",
        timeout: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await forgotPassword({ username });
      
      addToast({
        title: "验证成功",
        description: "账号验证成功，正在跳转到重置密码页面...",
        color: "success",
        timeout: 3000,
      });
      
      // 直接跳转到重置密码页面，并传递令牌
      setTimeout(() => {
        navigate(`/reset-password?token=${response.token}&username=${response.username}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('忘记密码请求失败:', error);
      const errorMessage = error.message || '账号验证失败，请稍后重试';
      
      addToast({
        title: "验证失败",
        description: errorMessage,
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            忘记密码
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            请输入您的账号，我们将验证后跳转到重置密码页面
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <Input
              label="账号"
              type="text"
              labelPlacement="inside"
              className="w-full"
              startContent={<UserIcon className="w-4 h-4 text-gray-400" />}
              value={username}
              onValueChange={setUsername}
              isDisabled={isLoading}
              placeholder="请输入您的账号"
              isRequired
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "验证中..." : "验证账号"}
            </Button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
} 