import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";

import { register, RegisterRequest } from "@/services/api";

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
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      setErrors([]);

      const formData: FormData = {
        username,
        email,
        password,
        confirmPassword,
      };

      setSubmitted(formData);

      try {
        // 调用注册API
        const registerData: RegisterRequest = {
          username,
          email,
          password,
        };

        const response = await register(registerData);

        console.log("Registration successful:", response);

        // 显示成功提示
        addToast({
          title: "注册成功",
          description: "账号创建成功，正在跳转到登录页面...",
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
          timeout: 3000,
          shouldShowTimeoutProgress: true,
        });

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error) {
        console.error("Registration failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "注册失败，请重试";

        // 显示错误提示
        addToast({
          title: "注册失败",
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
    } else {
      // 显示表单验证错误
      const errorList = errors.join("、");

      addToast({
        title: "表单验证失败",
        description: `请检查以下问题：${errorList}`,
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
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            创建账号
          </h2>
          <p className="mt-3 text-sm text-gray-600">请填写以下信息完成注册</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-7">
            <Input
              isClearable
              className="w-full"
              classNames={{
                input: "h-12",
                inputWrapper:
                  "h-12 bg-gray-50/50 hover:bg-gray-100/50 focus-within:bg-white/80 backdrop-blur-sm",
              }}
              errorMessage={
                errors.includes("请输入用户名") ? "请输入用户名" : ""
              }
              isDisabled={isLoading}
              isInvalid={errors.includes("请输入用户名")}
              label="用户名"
              labelPlacement="outside"
              type="username"
              value={username}
              onClear={() => {
                setUsername("");
                setErrors([]);
              }}
              onValueChange={setUsername}
            />

            <Input
              isClearable
              className="w-full"
              classNames={{
                input: "h-12",
                inputWrapper:
                  "h-12 bg-gray-50/50 hover:bg-gray-100/50 focus-within:bg-white/80 backdrop-blur-sm",
              }}
              errorMessage={errors.includes("请输入账号") ? "请输入账号" : ""}
              isDisabled={isLoading}
              isInvalid={errors.includes("请输入账号")}
              label="账号"
              labelPlacement="outside"
              type="text"
              value={email}
              onClear={() => {
                setEmail("");
                setErrors([]);
              }}
              onValueChange={setEmail}
            />

            <Input
              className="w-full"
              classNames={{
                input: "h-12",
                inputWrapper:
                  "h-12 bg-gray-50/50 hover:bg-gray-100/50 focus-within:bg-white/80 backdrop-blur-sm",
              }}
              endContent={
                <button
                  className="focus:outline-none text-gray-400 hover:text-gray-600 transition-colors"
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
              errorMessage={
                errors.includes("请输入密码")
                  ? "请输入密码"
                  : errors.includes("密码长度至少为6位")
                    ? "密码长度至少为6位"
                    : ""
              }
              isDisabled={isLoading}
              isInvalid={
                errors.includes("请输入密码") ||
                errors.includes("密码长度至少为6位")
              }
              label="密码"
              labelPlacement="outside"
              type={showPassword ? "text" : "password"}
              value={password}
              onValueChange={setPassword}
            />

            <Input
              className="w-full"
              classNames={{
                input: "h-12",
                inputWrapper:
                  "h-12 bg-gray-50/50 hover:bg-gray-100/50 focus-within:bg-white/80 backdrop-blur-sm",
              }}
              endContent={
                <button
                  className="focus:outline-none text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
              errorMessage={
                errors.includes("请确认密码")
                  ? "请确认密码"
                  : errors.includes("两次输入的密码不一致")
                    ? "两次输入的密码不一致"
                    : ""
              }
              isDisabled={isLoading}
              isInvalid={
                errors.includes("请确认密码") ||
                errors.includes("两次输入的密码不一致")
              }
              label="确认密码"
              labelPlacement="outside"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              color="primary"
              isDisabled={isLoading}
              isSelected={agreeTerms}
              size="sm"
              onValueChange={setAgreeTerms}
            />
            <div className="flex-1 text-sm text-gray-700">
              我已阅读并同意
              <button
                className="text-blue-600 hover:text-blue-500 ml-1 underline"
                type="button"
                onClick={() => setShowTermsModal(true)}
              >
                服务条款
              </button>
            </div>
          </div>

          <div>
            <Button
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              disabled={isLoading}
              isLoading={isLoading}
              type="submit"
            >
              {isLoading ? "注册中..." : "创建账号"}
            </Button>
          </div>
        </form>

        {submitted && !isLoading && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              注册信息: <code>{JSON.stringify(submitted)}</code>
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            已有账号?{" "}
            <Link
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              to="/login"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>

      {/* 服务条款弹窗 */}
      <Modal
        isOpen={showTermsModal}
        scrollBehavior="inside"
        size="lg"
        onClose={() => setShowTermsModal(false)}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">服务条款</h3>
            <p className="text-sm text-gray-500">请仔细阅读以下条款</p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  1. 服务说明
                </h4>
                <p>
                  欢迎使用我们的管理系统。本系统提供企业资源管理、库存管理、用户管理等功能，旨在帮助企业提高运营效率。
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  2. 用户责任
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>用户应妥善保管账号密码，不得将账号提供给他人使用</li>
                  <li>用户应遵守相关法律法规，不得利用系统进行违法活动</li>
                  <li>用户应及时更新个人信息，确保信息的准确性</li>
                  <li>用户应合理使用系统资源，不得恶意占用或破坏系统</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  3. 隐私保护
                </h4>
                <p>
                  我们承诺保护用户隐私，不会向第三方泄露用户的个人信息，除非：
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>获得用户明确同意</li>
                  <li>法律法规要求</li>
                  <li>为保护用户或公众安全</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  4. 数据安全
                </h4>
                <p>我们采用行业标准的安全措施保护用户数据，包括但不限于：</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>数据加密传输和存储</li>
                  <li>定期安全审计</li>
                  <li>访问权限控制</li>
                  <li>数据备份和恢复</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  5. 服务变更
                </h4>
                <p>
                  我们保留随时修改或终止服务的权利，但会提前通知用户。重大变更将通过系统公告或邮件方式通知。
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  6. 免责声明
                </h4>
                <p>
                  在法律允许的范围内，我们不对因以下原因造成的损失承担责任：
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>不可抗力因素</li>
                  <li>用户操作不当</li>
                  <li>第三方服务故障</li>
                  <li>系统维护或升级</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  7. 联系方式
                </h4>
                <p>如您对本服务条款有任何疑问，请联系我们的客服团队：</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>邮箱：support@company.com</li>
                  <li>电话：400-123-4567</li>
                  <li>工作时间：周一至周五 9:00-18:00</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-blue-800 text-xs">
                  <strong>重要提示：</strong>
                  注册即表示您已阅读、理解并同意遵守上述所有条款。如果您不同意任何条款，请勿使用本系统。
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => {
                setShowTermsModal(false);
                setAgreeTerms(true);
              }}
            >
              我已阅读并同意
            </Button>
            <Button
              color="default"
              variant="flat"
              onClick={() => setShowTermsModal(false)}
            >
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
