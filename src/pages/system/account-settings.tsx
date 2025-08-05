import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  Input,
  Button,
  Select,
  SelectItem,
  Switch,
  Avatar,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Progress,
} from "@heroui/react";
import {
  User as UserIcon,
  Shield as ShieldIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Camera as CameraIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Upload as UploadIcon,
  Key as KeyIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Building as BuildingIcon,
  UserCog as UserCogIcon,
  Save as SaveIcon,
  RefreshCw as RefreshIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import {
  updateUserProfile,
  uploadAvatar,
  changePassword,
  updateUserSettings,
  getDepartments,
  getJobTitles,
  checkEmployeeIdExists,
  type Department,
  type JobTitle,
} from "@/services/api";
import {
  getOperationLogs,
  type OperationLog as OperationLogType,
} from "@/services/operationLog";

interface UserSettings {
  theme: "light" | "dark" | "system";
  language: "zh-CN" | "en-US";
  notifications: {
    email: boolean;
    browser: boolean;
    system: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastLogin: boolean;
    allowDirectMessages: boolean;
  };
}

const defaultSettings: UserSettings = {
  theme: "system",
  language: "zh-CN",
  notifications: {
    email: true,
    browser: true,
    system: true,
  },
  privacy: {
    showOnlineStatus: true,
    showLastLogin: true,
    allowDirectMessages: true,
  },
};

export default function AccountSettingsPage() {
  const { user, updateUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState("profile");

  // 基础信息表单
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    employee_id: "",
    department_id: "",
    job_title_id: "",
  });

  // 密码表单
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 用户设置
  const [userSettings, setUserSettings] =
    useState<UserSettings>(defaultSettings);

  // 基础数据
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLogType[]>([]);

  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [employeeIdError, setEmployeeIdError] = useState("");
  const [isCheckingEmployeeId, setIsCheckingEmployeeId] = useState(false);

  // Modal 控制
  const {
    isOpen: isAvatarModalOpen,
    onOpen: onAvatarModalOpen,
    onClose: onAvatarModalClose,
  } = useDisclosure();

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const employeeIdCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化数据
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        employee_id: user.employee_id || "",
        department_id: user.department_id?.toString() || "",
        job_title_id: user.job_title_id?.toString() || "",
      });
    }

    loadDepartments();
    loadJobTitles();
    loadOperationLogs();
  }, [user]);

  // 加载部门数据
  const loadDepartments = async () => {
    try {
      const data = await getDepartments();

      setDepartments(data);
    } catch (error) {
      console.error("加载部门数据失败:", error);
    }
  };

  // 加载职称数据
  const loadJobTitles = async () => {
    try {
      const data = await getJobTitles();

      setJobTitles(data);
    } catch (error) {
      console.error("加载职称数据失败:", error);
    }
  };

  // 加载操作日志
  const loadOperationLogs = async () => {
    try {
      const data = await getOperationLogs({
        page: 1,
        page_size: 10,
        user: user?.id,
      });

      setOperationLogs(data.results || []);
    } catch (error) {
      console.error("加载操作日志失败:", error);
    }
  };

  // 工号重复检测
  const checkEmployeeIdDuplicate = useCallback(
    async (employeeId: string) => {
      if (!employeeId.trim()) {
        setEmployeeIdError("");

        return;
      }

      if (employeeId === user?.employee_id) {
        setEmployeeIdError("");

        return;
      }

      try {
        setIsCheckingEmployeeId(true);
        const result = await checkEmployeeIdExists(employeeId);

        if (result.exists) {
          setEmployeeIdError("该工号已被使用");
        } else {
          setEmployeeIdError("");
        }
      } catch (error) {
        console.error("检查工号重复失败:", error);
        setEmployeeIdError("检查工号失败，请稍后重试");
      } finally {
        setIsCheckingEmployeeId(false);
      }
    },
    [user?.employee_id],
  );

  // 工号输入处理
  const handleEmployeeIdChange = (value: string) => {
    setProfileForm({ ...profileForm, employee_id: value });

    if (employeeIdCheckTimerRef.current) {
      clearTimeout(employeeIdCheckTimerRef.current);
    }

    employeeIdCheckTimerRef.current = setTimeout(() => {
      checkEmployeeIdDuplicate(value);
    }, 500);
  };

  // 保存基础信息
  const handleSaveProfile = async () => {
    if (isSaving) return;

    // 验证必填项
    if (!profileForm.email.trim()) {
      toast.error("请填写邮箱地址");

      return;
    }

    if (employeeIdError) {
      toast.error("请修正工号错误");

      return;
    }

    try {
      setIsSaving(true);
      await updateUserProfile(profileForm);

      // 更新用户上下文
      if (user) {
        updateUser({
          ...user,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          email: profileForm.email,
          phone: profileForm.phone,
          employee_id: profileForm.employee_id,
          department_id: profileForm.department_id
            ? parseInt(profileForm.department_id)
            : null,
          job_title_id: profileForm.job_title_id
            ? parseInt(profileForm.job_title_id)
            : null,
        });
      }

      toast.success("基础信息保存成功");
    } catch (error) {
      console.error("保存基础信息失败:", error);
      toast.error("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (isChangingPassword) return;

    // 验证表单
    if (!passwordForm.current_password.trim()) {
      toast.error("请输入当前密码");

      return;
    }

    if (!passwordForm.new_password.trim()) {
      toast.error("请输入新密码");

      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error("新密码至少需要8位字符");

      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("新密码和确认密码不一致");

      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({
        old_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      // 重置表单
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      toast.success("密码修改成功");
    } catch (error) {
      console.error("修改密码失败:", error);
      toast.error("密码修改失败，请检查当前密码是否正确");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 头像上传
  const handleAvatarUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const response = await uploadAvatar(file);
      const avatarUrl = response.avatar_url;

      if (user) {
        updateUser({ ...user, avatar: avatarUrl });
      }

      toast.success("头像上传成功");
      onAvatarModalClose();
    } catch (error) {
      console.error("头像上传失败:", error);
      toast.error("头像上传失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 保存用户设置
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await updateUserSettings(userSettings);
      toast.success("设置保存成功");
    } catch (error) {
      console.error("保存设置失败:", error);
      toast.error("保存设置失败，请稍后重试");
    } finally {
      setIsSaving(false);
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
    if (strength < 25) return "danger";
    if (strength < 50) return "warning";
    if (strength < 75) return "primary";

    return "success";
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return "弱";
    if (strength < 50) return "一般";
    if (strength < 75) return "较强";

    return "强";
  };

  const passwordStrength = getPasswordStrength(passwordForm.new_password);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">账户设置</h1>
        <p className="text-gray-600 mt-1">
          管理您的账户信息、安全设置和个人偏好
        </p>
      </div>

      <Tabs
        aria-label="账户设置"
        className="w-full"
        color="primary"
        selectedKey={selectedTab}
        variant="underlined"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        {/* 基础信息标签页 */}
        <Tab
          key="profile"
          title={
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>基础信息</span>
            </div>
          }
        >
          <div className="mt-6 space-y-6">
            {/* 头像设置 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">头像设置</h3>
              </CardHeader>
              <CardBody>
                <div className="flex items-center gap-4">
                  <Avatar
                    className="w-20 h-20"
                    name={user?.username}
                    size="lg"
                    src={user?.avatar || undefined}
                  />
                  <div className="space-y-2">
                    <Button
                      color="primary"
                      startContent={<CameraIcon className="w-4 h-4" />}
                      variant="flat"
                      onPress={onAvatarModalOpen}
                    >
                      更换头像
                    </Button>
                    <p className="text-sm text-gray-500">
                      支持 JPG、PNG 格式，文件大小不超过 2MB
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 个人信息 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">个人信息</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="姓"
                    placeholder="请输入姓"
                    value={profileForm.first_name}
                    onValueChange={(value) =>
                      setProfileForm({ ...profileForm, first_name: value })
                    }
                  />
                  <Input
                    label="名"
                    placeholder="请输入名"
                    value={profileForm.last_name}
                    onValueChange={(value) =>
                      setProfileForm({ ...profileForm, last_name: value })
                    }
                  />
                  <Input
                    isRequired
                    label="邮箱地址"
                    placeholder="请输入邮箱地址"
                    startContent={
                      <MailIcon className="w-4 h-4 text-gray-400" />
                    }
                    type="email"
                    value={profileForm.email}
                    onValueChange={(value) =>
                      setProfileForm({ ...profileForm, email: value })
                    }
                  />
                  <Input
                    label="手机号码"
                    placeholder="请输入手机号码"
                    startContent={
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                    }
                    value={profileForm.phone}
                    onValueChange={(value) =>
                      setProfileForm({ ...profileForm, phone: value })
                    }
                  />
                  <Input
                    endContent={
                      isCheckingEmployeeId ? (
                        <RefreshIcon className="w-4 h-4 animate-spin text-gray-400" />
                      ) : null
                    }
                    errorMessage={employeeIdError}
                    isInvalid={!!employeeIdError}
                    label="工号"
                    placeholder="请输入工号"
                    value={profileForm.employee_id}
                    onValueChange={handleEmployeeIdChange}
                  />
                  <Select
                    label="所属部门"
                    placeholder="请选择部门"
                    selectedKeys={
                      profileForm.department_id
                        ? [profileForm.department_id]
                        : []
                    }
                    startContent={
                      <BuildingIcon className="w-4 h-4 text-gray-400" />
                    }
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;

                      setProfileForm({
                        ...profileForm,
                        department_id: key || "",
                      });
                    }}
                  >
                    {departments.map((dept) => (
                      <SelectItem key={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="职称"
                    placeholder="请选择职称"
                    selectedKeys={
                      profileForm.job_title_id ? [profileForm.job_title_id] : []
                    }
                    startContent={
                      <UserCogIcon className="w-4 h-4 text-gray-400" />
                    }
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;

                      setProfileForm({
                        ...profileForm,
                        job_title_id: key || "",
                      });
                    }}
                  >
                    {jobTitles.map((title) => (
                      <SelectItem key={title.id.toString()}>
                        {title.name} ({title.level})
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    color="primary"
                    isDisabled={!!employeeIdError}
                    isLoading={isSaving}
                    startContent={<SaveIcon className="w-4 h-4" />}
                    onPress={handleSaveProfile}
                  >
                    保存信息
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

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
          <div className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">修改密码</h3>
                <p className="text-sm text-gray-500">
                  为了账户安全，建议定期更换密码
                </p>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 max-w-md">
                  <Input
                    endContent={
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOffIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    }
                    label="当前密码"
                    placeholder="请输入当前密码"
                    startContent={<KeyIcon className="w-4 h-4 text-gray-400" />}
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.current_password}
                    onValueChange={(value) =>
                      setPasswordForm({
                        ...passwordForm,
                        current_password: value,
                      })
                    }
                  />
                  <Input
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOffIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    }
                    label="新密码"
                    placeholder="请输入新密码"
                    startContent={<KeyIcon className="w-4 h-4 text-gray-400" />}
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.new_password}
                    onValueChange={(value) =>
                      setPasswordForm({ ...passwordForm, new_password: value })
                    }
                  />
                  {passwordForm.new_password && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>密码强度</span>
                        <span
                          className={`text-${getPasswordStrengthColor(passwordStrength)}`}
                        >
                          {getPasswordStrengthText(passwordStrength)}
                        </span>
                      </div>
                      <Progress
                        color={getPasswordStrengthColor(passwordStrength)}
                        size="sm"
                        value={passwordStrength}
                      />
                    </div>
                  )}
                  <Input
                    endContent={
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    }
                    errorMessage={
                      passwordForm.confirm_password &&
                      passwordForm.new_password !==
                        passwordForm.confirm_password
                        ? "密码不一致"
                        : ""
                    }
                    isInvalid={
                      !!passwordForm.confirm_password &&
                      passwordForm.new_password !==
                        passwordForm.confirm_password
                    }
                    label="确认新密码"
                    placeholder="请再次输入新密码"
                    startContent={<KeyIcon className="w-4 h-4 text-gray-400" />}
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirm_password}
                    onValueChange={(value) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirm_password: value,
                      })
                    }
                  />
                  <Button
                    color="primary"
                    isDisabled={
                      !passwordForm.current_password ||
                      !passwordForm.new_password ||
                      !passwordForm.confirm_password ||
                      passwordForm.new_password !==
                        passwordForm.confirm_password ||
                      passwordForm.new_password.length < 8
                    }
                    isLoading={isChangingPassword}
                    onPress={handleChangePassword}
                  >
                    修改密码
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* 个人偏好标签页 */}
        <Tab
          key="preferences"
          title={
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span>个人偏好</span>
            </div>
          }
        >
          <div className="mt-6 space-y-6">
            {/* 外观设置 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">外观设置</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <Select
                    label="主题模式"
                    placeholder="选择主题"
                    selectedKeys={[userSettings.theme]}
                    onSelectionChange={(keys) => {
                      const theme = Array.from(keys)[0] as
                        | "light"
                        | "dark"
                        | "system";

                      setUserSettings({ ...userSettings, theme });
                    }}
                  >
                    <SelectItem key="light">浅色模式</SelectItem>
                    <SelectItem key="dark">深色模式</SelectItem>
                    <SelectItem key="system">跟随系统</SelectItem>
                  </Select>
                  <Select
                    label="语言设置"
                    placeholder="选择语言"
                    selectedKeys={[userSettings.language]}
                    onSelectionChange={(keys) => {
                      const language = Array.from(keys)[0] as "zh-CN" | "en-US";

                      setUserSettings({ ...userSettings, language });
                    }}
                  >
                    <SelectItem key="zh-CN">简体中文</SelectItem>
                    <SelectItem key="en-US">English</SelectItem>
                  </Select>
                </div>
              </CardBody>
            </Card>

            {/* 通知设置 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">通知设置</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">邮件通知</p>
                      <p className="text-sm text-gray-500">
                        接收重要事件的邮件通知
                      </p>
                    </div>
                    <Switch
                      isSelected={userSettings.notifications.email}
                      onValueChange={(value) =>
                        setUserSettings({
                          ...userSettings,
                          notifications: {
                            ...userSettings.notifications,
                            email: value,
                          },
                        })
                      }
                    />
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">浏览器通知</p>
                      <p className="text-sm text-gray-500">
                        在浏览器中显示通知
                      </p>
                    </div>
                    <Switch
                      isSelected={userSettings.notifications.browser}
                      onValueChange={(value) =>
                        setUserSettings({
                          ...userSettings,
                          notifications: {
                            ...userSettings.notifications,
                            browser: value,
                          },
                        })
                      }
                    />
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">系统通知</p>
                      <p className="text-sm text-gray-500">
                        接收系统相关的通知
                      </p>
                    </div>
                    <Switch
                      isSelected={userSettings.notifications.system}
                      onValueChange={(value) =>
                        setUserSettings({
                          ...userSettings,
                          notifications: {
                            ...userSettings.notifications,
                            system: value,
                          },
                        })
                      }
                    />
                  </div>
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
                      <p className="text-sm text-gray-500">
                        让其他用户看到您的在线状态
                      </p>
                    </div>
                    <Switch
                      isSelected={userSettings.privacy.showOnlineStatus}
                      onValueChange={(value) =>
                        setUserSettings({
                          ...userSettings,
                          privacy: {
                            ...userSettings.privacy,
                            showOnlineStatus: value,
                          },
                        })
                      }
                    />
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">显示最后登录时间</p>
                      <p className="text-sm text-gray-500">
                        在个人资料中显示最后登录时间
                      </p>
                    </div>
                    <Switch
                      isSelected={userSettings.privacy.showLastLogin}
                      onValueChange={(value) =>
                        setUserSettings({
                          ...userSettings,
                          privacy: {
                            ...userSettings.privacy,
                            showLastLogin: value,
                          },
                        })
                      }
                    />
                  </div>
                  <Divider />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">允许私信</p>
                      <p className="text-sm text-gray-500">
                        允许其他用户向您发送私信
                      </p>
                    </div>
                    <Switch
                      isSelected={userSettings.privacy.allowDirectMessages}
                      onValueChange={(value) =>
                        setUserSettings({
                          ...userSettings,
                          privacy: {
                            ...userSettings.privacy,
                            allowDirectMessages: value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="flex justify-end">
              <Button
                color="primary"
                isLoading={isSaving}
                startContent={<SaveIcon className="w-4 h-4" />}
                onPress={handleSaveSettings}
              >
                保存设置
              </Button>
            </div>
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
          <div className="mt-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">最近操作记录</h3>
                <p className="text-sm text-gray-500">查看您的最近操作历史</p>
              </CardHeader>
              <CardBody>
                <Table aria-label="操作日志表格">
                  <TableHeader>
                    <TableColumn>操作类型</TableColumn>
                    <TableColumn>操作描述</TableColumn>
                    <TableColumn>IP地址</TableColumn>
                    <TableColumn>操作时间</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {operationLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Chip
                            color={
                              log.operation_type === "create"
                                ? "success"
                                : log.operation_type === "update"
                                  ? "primary"
                                  : log.operation_type === "delete"
                                    ? "danger"
                                    : "default"
                            }
                            size="sm"
                          >
                            {log.operation_type_display}
                          </Chip>
                        </TableCell>
                        <TableCell>{log.description}</TableCell>
                        <TableCell>{log.ip_address}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString("zh-CN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* 头像上传模态框 */}
      <Modal isOpen={isAvatarModalOpen} onClose={onAvatarModalClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>更换头像</ModalHeader>
              <ModalBody>
                <div className="flex flex-col items-center gap-4">
                  <Avatar
                    className="w-24 h-24"
                    name={user?.username}
                    size="lg"
                    src={user?.avatar || undefined}
                  />
                  <input
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("文件大小不能超过2MB");

                          return;
                        }
                        handleAvatarUpload(file);
                      }
                    }}
                  />
                  <Button
                    color="primary"
                    isLoading={isLoading}
                    startContent={<UploadIcon className="w-4 h-4" />}
                    variant="flat"
                    onPress={() => fileInputRef.current?.click()}
                  >
                    选择图片
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                    支持 JPG、PNG 格式
                    <br />
                    文件大小不超过 2MB
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  取消
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
