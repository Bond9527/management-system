import React, { useState, useEffect } from 'react';
import { Input, Button, Progress, useToast } from "@heroui/react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "@/services/api";
import { 
  Key as KeyIcon, 
  Eye as EyeIcon, 
  EyeOff as EyeOffIcon,
  CheckCircle as CheckCircleIcon,
  ArrowLeft as ArrowLeftIcon
} from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');
  const username = searchParams.get('username');
  
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  });
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        title: "错误",
        description: "重置令牌缺失，请重新申请密码重置",
        status: "error",
      });
      navigate('/forgot-password');
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.new_password.trim()) {
      toast({
        title: "错误",
        description: "请输入新密码",
        status: "error",
      });
      return;
    }
    
    if (formData.new_password.length < 8) {
      toast({
        title: "错误",
        description: "新密码至少需要8位字符",
        status: "error",
      });
      return;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      toast({
        title: "错误",
        description: "两次输入的密码不一致",
        status: "error",
      });
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword({
        token: token!,
        new_password: formData.new_password,
      });
      
      setIsSuccess(true);
      toast({
        title: "成功",
        description: "密码重置成功！",
        status: "success",
      });
    } catch (error: any) {
      console.error('重置密码失败:', error);
      toast({
        title: "错误",
        description: error.message || "密码重置失败，请稍后重试",
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 密码强度检测
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 25) return 'danger';
    if (strength < 50) return 'warning';
    if (strength < 75) return 'primary';
    return 'success';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return '弱';
    if (strength < 50) return '一般';
    if (strength < 75) return '较强';
    return '强';
  };

  const passwordStrength = getPasswordStrength(formData.new_password);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              密码重置成功
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              您的密码已成功重置，现在可以使用新密码登录了。
            </p>
          </div>
          
          <div className="mt-8">
            <Link
              to="/login"
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return null; // 重定向处理中
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            重置密码
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {username ? `为账号 "${username}" 设置新密码` : '请输入您的新密码'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                label="新密码"
                type={showNewPassword ? "text" : "password"}
                labelPlacement="inside"
                className="w-full"
                startContent={<KeyIcon className="w-4 h-4 text-gray-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="focus:outline-none"
                  >
                    {showNewPassword ? (
                      <EyeOffIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                }
                value={formData.new_password}
                onValueChange={(value) => setFormData({ ...formData, new_password: value })}
                isDisabled={isLoading}
                placeholder="请输入新密码"
                description="密码长度至少8位，建议包含大小写字母、数字和特殊字符"
                isRequired
              />
              
              {formData.new_password && (
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>密码强度</span>
                    <span className={`text-${getPasswordStrengthColor(passwordStrength)}`}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <Progress
                    value={passwordStrength}
                    color={getPasswordStrengthColor(passwordStrength)}
                    size="sm"
                  />
                </div>
              )}
            </div>

            <Input
              label="确认新密码"
              type={showConfirmPassword ? "text" : "password"}
              labelPlacement="inside"
              className="w-full"
              startContent={<KeyIcon className="w-4 h-4 text-gray-400" />}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              }
              value={formData.confirm_password}
              onValueChange={(value) => setFormData({ ...formData, confirm_password: value })}
              isDisabled={isLoading}
              placeholder="请再次输入新密码"
              isInvalid={formData.confirm_password && formData.new_password !== formData.confirm_password}
              errorMessage={
                formData.confirm_password && formData.new_password !== formData.confirm_password
                  ? "密码不一致"
                  : ""
              }
              isRequired
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              isLoading={isLoading}
              disabled={
                isLoading ||
                !formData.new_password ||
                !formData.confirm_password ||
                formData.new_password !== formData.confirm_password ||
                formData.new_password.length < 8
              }
            >
              {isLoading ? "重置中..." : "重置密码"}
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