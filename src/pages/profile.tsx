import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Select,
  SelectItem,
  Button,
  Input,
} from "@heroui/react";
import { addToast } from "@heroui/toast";

import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/Avatar";
import {
  getJobTitles,
  updateUserJobTitle,
  JobTitle,
  getDepartments,
  updateUserDepartment,
  Department,
  updateUserEmployeeId,
  checkEmployeeIdExists,
} from "@/services/api";

// 根据用户状态、职位级别和角色分配头像颜色
const getAvatarColor = (user: any) => {
  // 优先考虑用户状态
  if (!user?.is_active) return "danger";

  // 考虑系统权限
  if (user?.is_superuser) return "warning";

  // 根据职位级别设置颜色
  if (user?.job_title) {
    const jobTitle = user.job_title;

    // 正高级职位 - 紫色
    if (jobTitle.includes("资深经理") || jobTitle.includes("正高级")) {
      return "secondary";
    }

    // 副高级职位 - 蓝色
    if (
      jobTitle.includes("高级工程师") ||
      jobTitle.includes("课长") ||
      jobTitle.includes("副经理") ||
      jobTitle.includes("经理") ||
      jobTitle.includes("副高级")
    ) {
      return "primary";
    }

    // 中级职位 - 绿色
    if (
      jobTitle.includes("工程师") ||
      jobTitle.includes("组长") ||
      jobTitle.includes("副组长") ||
      jobTitle.includes("副课长") ||
      jobTitle.includes("中级")
    ) {
      return "success";
    }

    // 初级职位 - 默认色
    if (
      jobTitle.includes("技术员") ||
      jobTitle.includes("助理") ||
      jobTitle.includes("事务员") ||
      jobTitle.includes("初级")
    ) {
      return "default";
    }
  }

  // 根据角色设置颜色（备用逻辑）
  if (user?.username === "admin") return "warning";
  if (user?.is_staff) return "secondary";
  if (user?.department) return "primary";

  // 默认颜色
  return "success";
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [employeeIdError, setEmployeeIdError] = useState<string>("");
  const [isCheckingEmployeeId, setIsCheckingEmployeeId] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const employeeIdCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadJobTitles();
    loadDepartments();
  }, []);

  useEffect(() => {
    console.log("用户数据更新:", user);
    // 重置选择状态
    setSelectedJobTitle("");
    setSelectedDepartment("");
    setEmployeeId("");

    // 等待用户数据和职称/部门数据都加载完成后再设置选中状态
    if (user?.job_title_id && jobTitles.length > 0) {
      console.log("设置职称ID:", user.job_title_id);
      setSelectedJobTitle(user.job_title_id.toString());
    }
    if (user?.department_id && departments.length > 0) {
      console.log("设置部门ID:", user.department_id);
      setSelectedDepartment(user.department_id.toString());
    }
    if (user?.employee_id) {
      console.log("设置工号:", user.employee_id);
      setEmployeeId(user.employee_id);
    }
  }, [user, jobTitles, departments]);

  // 检查是否有变更
  useEffect(() => {
    const departmentChanged =
      selectedDepartment !== (user?.department_id?.toString() || "");
    const jobTitleChanged =
      selectedJobTitle !== (user?.job_title_id?.toString() || "");
    const employeeIdChanged = employeeId !== (user?.employee_id || "");

    setHasChanges(departmentChanged || jobTitleChanged || employeeIdChanged);
  }, [selectedDepartment, selectedJobTitle, employeeId, user]);

  const loadJobTitles = async () => {
    try {
      setIsLoading(true);
      const titles = await getJobTitles();

      console.log("职称列表:", titles);
      setJobTitles(titles);
    } catch (error) {
      console.error("获取职称列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const depts = await getDepartments();

      setDepartments(depts);
    } catch (error) {
      console.error("获取部门列表失败:", error);
    }
  };

  const handleJobTitleChange = async (value: string) => {
    setSelectedJobTitle(value);
  };

  const handleDepartmentChange = async (value: string) => {
    setSelectedDepartment(value);
  };

  // 工号重复检测（防抖）
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
    setEmployeeId(value);

    // 清除之前的定时器
    if (employeeIdCheckTimerRef.current) {
      clearTimeout(employeeIdCheckTimerRef.current);
    }

    // 设置新的防抖定时器（500ms后检查）
    employeeIdCheckTimerRef.current = setTimeout(() => {
      checkEmployeeIdDuplicate(value);
    }, 500);
  };

  // 统一的保存方法
  const handleSaveProfile = useCallback(async () => {
    if (isUpdating) return;

    // 验证必填项
    if (!selectedDepartment) {
      addToast({
        title: "请选择部门",
        color: "warning",
      });

      return;
    }

    if (!selectedJobTitle) {
      addToast({
        title: "请选择职称",
        color: "warning",
      });

      return;
    }

    if (!employeeId.trim()) {
      addToast({
        title: "请填写工号",
        color: "warning",
      });

      return;
    }

    if (employeeIdError) {
      addToast({
        title: "该工号已被使用，请使用其他工号",
        color: "warning",
      });

      return;
    }

    try {
      setIsUpdating(true);
      let updatedUser = user;

      // 更新部门（如果有变更）
      if (selectedDepartment !== (user?.department_id?.toString() || "")) {
        const departmentId = parseInt(selectedDepartment);

        updatedUser = await updateUserDepartment(departmentId);
      }

      // 更新职称（如果有变更）
      if (selectedJobTitle !== (user?.job_title_id?.toString() || "")) {
        const jobTitleId = parseInt(selectedJobTitle);

        updatedUser = await updateUserJobTitle(jobTitleId);
      }

      // 更新工号（如果有变更）
      if (employeeId !== (user?.employee_id || "")) {
        updatedUser = await updateUserEmployeeId(employeeId);
      }

      // 更新本地用户信息
      if (updatedUser) {
        updateUser({
          department: updatedUser.department,
          department_id: updatedUser.department_id,
          job_title: updatedUser.job_title,
          job_title_id: updatedUser.job_title_id,
          employee_id: updatedUser.employee_id,
        });
      }

      // 清除之前的toast定时器
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      // 延迟显示toast，避免重复
      toastTimerRef.current = setTimeout(() => {
        addToast({
          title: "个人资料更新成功",
          color: "success",
        });
      }, 100);
    } catch (error) {
      console.error("更新个人资料失败:", error);
      addToast({
        title: "更新个人资料失败",
        color: "danger",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [
    selectedDepartment,
    selectedJobTitle,
    employeeId,
    updateUser,
    isUpdating,
    user,
  ]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (employeeIdCheckTimerRef.current) {
        clearTimeout(employeeIdCheckTimerRef.current);
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>请先登录</p>
        </div>
      </div>
    );
  }

  const handleAvatarChange = (avatarUrl: string | null) => {
    console.log("Avatar changed:", avatarUrl);
    // 这里可以添加额外的处理逻辑
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="w-full">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-md">个人资料</p>
              <p className="text-small text-default-500">管理您的个人信息</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="flex flex-col items-center space-y-6">
              {/* 头像部分 */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar
                  color={getAvatarColor(user)}
                  isBordered={true}
                  isEditable={true}
                  name={user.username}
                  size="lg"
                  src={user.avatar || undefined}
                  onAvatarChange={handleAvatarChange}
                />
                <div className="text-center">
                  <p className="text-lg font-semibold">{user.username}</p>
                  <p className="text-small text-default-500">
                    悬停头像进行编辑
                  </p>
                </div>
              </div>

              <Divider className="my-4" />

              {/* 用户信息 */}
              <div className="w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      用户名
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.username}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      邮箱
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      部门 <span className="text-red-500">*</span>
                    </label>
                    <Select
                      isRequired
                      aria-label="选择部门"
                      isLoading={isLoading}
                      placeholder="请选择部门"
                      selectedKeys={
                        selectedDepartment
                          ? new Set([selectedDepartment])
                          : new Set()
                      }
                      value={selectedDepartment}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;

                        handleDepartmentChange(value || "");
                      }}
                    >
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.id.toString()}
                          aria-label={`部门: ${dept.name}`}
                          textValue={dept.name}
                        >
                          {dept.name}
                        </SelectItem>
                      ))}
                    </Select>
                    {user.department && (
                      <p className="text-xs text-gray-500 mt-1">
                        当前部门: {user.department}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      职称 <span className="text-red-500">*</span>
                    </label>
                    <Select
                      isRequired
                      aria-label="选择职称"
                      isLoading={isLoading}
                      placeholder="请选择职称"
                      selectedKeys={
                        selectedJobTitle
                          ? new Set([selectedJobTitle])
                          : new Set()
                      }
                      value={selectedJobTitle}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;

                        handleJobTitleChange(value || "");
                      }}
                    >
                      {jobTitles.map((title) => {
                        const textValue = `${title.name} (${title.level})`;

                        return (
                          <SelectItem
                            key={title.id.toString()}
                            aria-label={`职称: ${textValue}`}
                            textValue={textValue}
                          >
                            {title.name} ({title.level})
                          </SelectItem>
                        );
                      })}
                    </Select>
                    {user.job_title && (
                      <p className="text-xs text-gray-500 mt-1">
                        当前职称: {user.job_title}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      工号 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      isRequired
                      endContent={
                        isCheckingEmployeeId ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        ) : null
                      }
                      errorMessage={employeeIdError}
                      isInvalid={!!employeeIdError}
                      maxLength={50}
                      placeholder="请输入工号"
                      type="text"
                      value={employeeId}
                      onValueChange={handleEmployeeIdChange}
                    />
                    {user.employee_id && !employeeIdError && (
                      <p className="text-xs text-gray-500 mt-1">
                        当前工号: {user.employee_id}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      电话
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.phone || "未设置"}
                    </p>
                  </div>
                </div>

                {/* 统一的保存按钮 */}
                <div className="flex justify-center pt-4">
                  <Button
                    className="min-w-32"
                    color="primary"
                    isDisabled={!hasChanges || !!employeeIdError}
                    isLoading={isUpdating}
                    size="md"
                    onPress={handleSaveProfile}
                  >
                    {isUpdating ? "保存中..." : "保存修改"}
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 头像功能说明 */}
        <Card className="w-full mt-6">
          <CardHeader>
            <p className="text-md">头像功能说明</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 将鼠标悬停在头像上显示编辑选项</p>
              <p>• 点击编辑按钮可以上传或删除头像</p>
              <p>• 支持JPG、PNG、GIF格式的图片</p>
              <p>• 文件大小限制：5MB</p>
              <p>• 部门、职称和工号为必填项，修改后点击"保存修改"按钮</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
