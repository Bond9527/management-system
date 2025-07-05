import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Input,
  Button,
  Switch,
  Select,
  SelectItem,
  Divider,
  Chip,
  Link,
} from "@heroui/react";
import { 
  Shield as ShieldIcon, 
  Settings as SettingsIcon, 
  History as HistoryIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Key as KeyIcon,
  Globe as GlobalIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Monitor as MonitorIcon,
  Lock as LockIcon,
} from "lucide-react";
import { useThemeManager, type ThemeMode } from "@/hooks/useThemeManager";
import OperationLogsTab from "@/components/OperationLogsTab";
import { changePassword } from "@/services/api";
import { addToast } from "@heroui/toast";

export default function AccountSettingsPage() {
  const [selectedTab, setSelectedTab] = useState("security");
  const { themeMode, currentTheme, setThemeMode, systemTheme } = useThemeManager();
  
  // 密码修改表单
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 系统偏好设置
  const [preferences, setPreferences] = useState({
    language: 'zh-CN',
    privacy: {
      showOnlineStatus: true,
      showLastLogin: true,
      allowDirectMessages: true,
    },
  });

  const handleChangePassword = async () => {
    if (!passwordForm.current_password.trim()) {
      addToast({
        title: "错误",
        description: "请输入当前密码",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }
    
    if (!passwordForm.new_password.trim()) {
      addToast({
        title: "错误",
        description: "请输入新密码",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      addToast({
        title: "错误",
        description: "新密码至少需要8位字符",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      addToast({
        title: "错误",
        description: "新密码和确认密码不一致",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }
    
    try {
      await changePassword({
        old_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      
      addToast({
        title: "成功",
        description: "密码修改成功",
        color: "success",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
        ),
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      console.error('修改密码失败:', error);
      const errorMessage = error.message || '密码修改失败，请检查当前密码是否正确';
      addToast({
        title: "错误",
        description: errorMessage,
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
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

  const passwordStrength = getPasswordStrength(passwordForm.new_password);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">账户设置</h1>
        <p className="text-gray-600 mt-1">管理您的账户安全、系统偏好和隐私设置</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>个人信息（头像、部门、职称等）请前往</span>
          <Link href="/profile" color="primary" size="sm">
            个人资料页面
          </Link>
          <span>进行修改</span>
        </div>
      </div>

      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key as string)}
        aria-label="账户设置"
        color="primary"
        variant="underlined"
        className="w-full"
      >
        {/* 安全设置标签页 */}
        <Tab 
          key="security" 
          title={
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-4 h-4" />
              <span>安全设置</span>
            </div>
          }
        >
          <div className="mt-6 space-y-6">
            {/* 密码管理 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <KeyIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="text-lg font-semibold">修改密码</h3>
                    <p className="text-sm text-gray-500">为了账户安全，建议定期更换密码</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 max-w-md">
                  <Input
                    label="当前密码"
                    placeholder="请输入当前密码"
                    type={showCurrentPassword ? "text" : "password"}
                    startContent={<LockIcon className="w-4 h-4 text-gray-400" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="focus:outline-none"
                      >
                        {showCurrentPassword ? (
                          <EyeOffIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    }
                    value={passwordForm.current_password}
                    onValueChange={(value) => setPasswordForm({ ...passwordForm, current_password: value })}
                  />
                  <Input
                    label="新密码"
                    placeholder="请输入新密码"
                    type={showNewPassword ? "text" : "password"}
                    startContent={<LockIcon className="w-4 h-4 text-gray-400" />}
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
                    value={passwordForm.new_password}
                    onValueChange={(value) => setPasswordForm({ ...passwordForm, new_password: value })}
                    description="密码长度至少8位，建议包含大小写字母、数字和特殊字符"
                  />
                  {passwordForm.new_password && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>密码强度</span>
                        <Chip
                          size="sm"
                          color={getPasswordStrengthColor(passwordStrength)}
                          variant="flat"
                        >
                          {getPasswordStrengthText(passwordStrength)}
                        </Chip>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength < 25 ? 'bg-red-500' :
                            passwordStrength < 50 ? 'bg-yellow-500' :
                            passwordStrength < 75 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <Input
                    label="确认新密码"
                    placeholder="请再次输入新密码"
                    type={showConfirmPassword ? "text" : "password"}
                    startContent={<LockIcon className="w-4 h-4 text-gray-400" />}
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
                    value={passwordForm.confirm_password}
                    onValueChange={(value) => setPasswordForm({ ...passwordForm, confirm_password: value })}
                    isInvalid={passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password}
                    errorMessage={
                      passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password
                        ? "密码不一致"
                        : ""
                    }
                  />
                  <Button
                    color="primary"
                    onPress={handleChangePassword}
                    isDisabled={
                      !passwordForm.current_password ||
                      !passwordForm.new_password ||
                      !passwordForm.confirm_password ||
                      passwordForm.new_password !== passwordForm.confirm_password ||
                      passwordForm.new_password.length < 8
                    }
                  >
                    修改密码
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* 账户状态 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">账户状态</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">账户状态</p>
                      <p className="text-sm text-gray-500">当前账户状态</p>
                    </div>
                    <Chip color="success" variant="flat">
                      正常
                    </Chip>
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">最后登录</p>
                      <p className="text-sm text-gray-500">上次登录时间和IP</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>2024-01-15 14:30</p>
                      <p>192.168.1.100</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* 系统偏好标签页 */}
        <Tab 
          key="preferences" 
          title={
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span>系统偏好</span>
            </div>
          }
        >
          <div className="mt-6 space-y-6">
            {/* 外观设置 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MoonIcon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">外观设置</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div>
                    <Select
                      label="主题模式"
                      placeholder="选择主题"
                      selectedKeys={[themeMode]}
                      onSelectionChange={(keys) => {
                        const mode = Array.from(keys)[0] as ThemeMode;
                        setThemeMode(mode);
                        addToast({
                          title: "成功",
                          description: `已切换到${mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统'}模式`,
                          color: "success",
                          icon: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 12l2 2 4-4"/>
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          ),
                          timeout: 3000,
                          shouldShowTimeoutProgress: true,
                        });
                      }}
                      startContent={
                        themeMode === 'light' ? <SunIcon className="w-4 h-4" /> :
                        themeMode === 'dark' ? <MoonIcon className="w-4 h-4" /> :
                        <MonitorIcon className="w-4 h-4" />
                      }
                      description={
                        themeMode === 'system' 
                          ? `当前跟随系统设置，系统主题为${systemTheme === 'dark' ? '深色' : '浅色'}模式` 
                          : `当前主题：${currentTheme === 'dark' ? '深色' : '浅色'}模式`
                      }
                    >
                      <SelectItem key="light" startContent={<SunIcon className="w-4 h-4" />}>
                        浅色模式
                      </SelectItem>
                      <SelectItem key="dark" startContent={<MoonIcon className="w-4 h-4" />}>
                        深色模式  
                      </SelectItem>
                      <SelectItem key="system" startContent={<MonitorIcon className="w-4 h-4" />}>
                        跟随系统
                      </SelectItem>
                    </Select>
                    
                    {/* 主题预览 */}
                    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-medium mb-2">主题预览</p>
                      <div className="flex gap-3">
                        <div className="flex-1 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md">
                          <div className="w-4 h-4 bg-blue-500 rounded mb-2"></div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">当前主题效果</div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 self-center">
                          {themeMode === 'system' ? '自动切换' : themeMode === 'light' ? '浅色主题' : '深色主题'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Select
                    label="语言设置"
                    placeholder="选择语言"
                    selectedKeys={[preferences.language]}
                    onSelectionChange={(keys) => {
                      const language = Array.from(keys)[0] as string;
                      setPreferences({ ...preferences, language });
                    }}
                    startContent={<GlobalIcon className="w-4 h-4" />}
                    description="更改语言设置需要刷新页面生效"
                  >
                    <SelectItem key="zh-CN" startContent={<span className="text-sm">🇨🇳</span>}>
                      简体中文
                    </SelectItem>
                    <SelectItem key="en-US" startContent={<span className="text-sm">🇺🇸</span>}>
                      English
                    </SelectItem>
                  </Select>
                </div>
              </CardBody>
            </Card>

            

            {/* 隐私设置 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">隐私设置</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">显示在线状态</p>
                      <p className="text-sm text-gray-500">让其他用户看到您的在线状态</p>
                    </div>
                    <Switch
                      isSelected={preferences.privacy.showOnlineStatus}
                      onValueChange={(value) => 
                        setPreferences({
                          ...preferences,
                          privacy: { ...preferences.privacy, showOnlineStatus: value }
                        })
                      }
                    />
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">显示最后登录时间</p>
                      <p className="text-sm text-gray-500">在个人资料中显示最后登录时间</p>
                    </div>
                    <Switch
                      isSelected={preferences.privacy.showLastLogin}
                      onValueChange={(value) => 
                        setPreferences({
                          ...preferences,
                          privacy: { ...preferences.privacy, showLastLogin: value }
                        })
                      }
                    />
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">允许私信</p>
                      <p className="text-sm text-gray-500">允许其他用户向您发送私信</p>
                    </div>
                    <Switch
                      isSelected={preferences.privacy.allowDirectMessages}
                      onValueChange={(value) => 
                        setPreferences({
                          ...preferences,
                          privacy: { ...preferences.privacy, allowDirectMessages: value }
                        })
                      }
                    />
                  </div>
                </div>
              </CardBody>
            </Card>


          </div>
        </Tab>

        {/* 操作日志标签页 */}
        <Tab 
          key="logs" 
          title={
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" />
              <span>操作日志</span>
            </div>
          }
        >
          <OperationLogsTab />
        </Tab>
      </Tabs>
    </div>
  );
} 