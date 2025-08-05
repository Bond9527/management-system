import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Button,
  Input,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Switch,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Selection,
} from "@heroui/react";
import {
  Search as SearchIcon,
  Plus as PlusIcon,
  ChevronDown as ChevronDownIcon,
  MoreVertical as VerticalDotsIcon,
} from "lucide-react";
import { addToast } from "@heroui/toast";

import { api, checkEmployeeIdExists } from "@/services/api";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useAuth } from "@/context/AuthContext";

interface SystemUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string;
  last_login_display: string;
  profile: {
    id: number;
    role: string;
    role_id: number;
    role_display: string;
    department: string;
    department_id: number;
    job_title: string;
    job_title_id: number;
    phone: string;
    employee_id: string;
    avatar_url: string | null;
    status: "active" | "inactive" | "disabled";
    status_display: string;
    is_active: boolean;
  } | null;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface JobTitle {
  id: number;
  name: string;
  level: string;
  description?: string;
}

interface Role {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
}

interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  department: string;
  job_title: string;
  role: string;
  phone: string;
  employee_id: string;
}

// 表格列定义
const columns = [
  { name: "用户", uid: "name", sortable: true },
  { name: "角色", uid: "role", sortable: true },
  { name: "部门", uid: "department" },
  { name: "职称", uid: "job_title" },
  { name: "状态", uid: "status", sortable: true },
  { name: "操作", uid: "actions" },
];

// 状态选项
const statusOptions = [
  { name: "激活", uid: "active" },
  { name: "禁用", uid: "inactive" },
];

// 工具函数
function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "role",
  "department",
  "status",
  "actions",
];

export default function UsersPage() {
  const { user: currentAuthUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableKey, setTableKey] = useState(0); // 用于强制刷新表格
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string;
    direction: "ascending" | "descending";
  }>({
    column: "name",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // 基础数据
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Modal states
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isPasswordOpen,
    onOpen: onPasswordOpen,
    onClose: onPasswordClose,
  } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [createFormData, setCreateFormData] = useState<UserFormData>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    is_active: true,
    is_staff: false,
    is_superuser: false,
    department: "",
    job_title: "",
    role: "",
    phone: "",
    employee_id: "",
  });

  const [editFormData, setEditFormData] = useState<UserFormData>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    is_active: true,
    is_staff: false,
    is_superuser: false,
    department: "",
    job_title: "",
    role: "",
    phone: "",
    employee_id: "",
  });

  // 用户状态管理
  const [userStatusState, setUserStatusState] = useState<
    "active" | "inactive" | "disabled"
  >("active");

  // 工号重复检测
  const [employeeIdError, setEmployeeIdError] = useState<string>("");
  const [isCheckingEmployeeId, setIsCheckingEmployeeId] = useState(false);
  const employeeIdCheckTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const hasSearchFilter = Boolean(filterValue);

  // 工号重复检测（防抖）
  const checkEmployeeIdDuplicate = useCallback(
    async (employeeId: string, excludeUserId?: number) => {
      if (!employeeId.trim()) {
        setEmployeeIdError("");

        return;
      }

      // 如果是编辑模式且工号没有变化，不需要检查
      if (excludeUserId && currentUser?.profile?.employee_id === employeeId) {
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
    [currentUser?.profile?.employee_id],
  );

  // 工号输入处理
  const handleEmployeeIdChange = (value: string) => {
    setCreateFormData({ ...createFormData, employee_id: value });

    // 清除之前的定时器
    if (employeeIdCheckTimerRef.current) {
      clearTimeout(employeeIdCheckTimerRef.current);
    }

    // 设置新的防抖定时器（500ms后检查）
    employeeIdCheckTimerRef.current = setTimeout(() => {
      checkEmployeeIdDuplicate(value, currentUser?.id);
    }, 500);
  };

  // 权限检查函数
  const canManageUser = useCallback(
    (targetUser: SystemUser): boolean => {
      if (!currentAuthUser) {
        console.log("权限检查失败: 当前用户未登录");

        return false;
      }

      // 不能管理自己（防止误操作）
      if (targetUser.id === currentAuthUser.id) {
        console.log("权限检查失败: 不能管理自己的账户");

        return false;
      }

      // 如果当前用户是超级管理员，可以管理所有用户（除了自己）
      if (
        currentAuthUser.username === "admin" ||
        (currentAuthUser as any).is_superuser === true
      ) {
        console.log("权限检查通过: 超级管理员权限");

        return true;
      }

      // 不能管理超级管理员
      if (targetUser.is_superuser) {
        console.log("权限检查失败: 不能管理超级管理员");

        return false;
      }

      // 角色层级检查
      const currentUserRole = (currentAuthUser as any).role?.name;
      const targetUserRole = targetUser.profile?.role;

      console.log("角色检查:", { currentUserRole, targetUserRole });

      // 定义角色层级（数字越小权限越高）
      const roleHierarchy: Record<string, number> = {
        admin: 1, // 最高级别
        manager: 2, // 中级管理
        operator: 3, // 操作员
        user: 4, // 普通用户
      };

      const currentRoleLevel = roleHierarchy[currentUserRole || ""] || 99;
      const targetRoleLevel = roleHierarchy[targetUserRole || ""] || 99;

      // 只能管理角色级别低于自己的用户
      if (currentRoleLevel >= targetRoleLevel) {
        console.log("权限检查失败: 角色级别不足", {
          currentLevel: currentRoleLevel,
          targetLevel: targetRoleLevel,
          message: `${currentUserRole} 不能管理 ${targetUserRole}`,
        });

        return false;
      }

      // 如果当前用户不是管理员级别（is_staff），不能管理管理员用户
      if (targetUser.is_staff && !(currentAuthUser as any).is_staff) {
        console.log("权限检查失败: 普通用户不能管理管理员");

        return false;
      }

      console.log("权限检查通过: 角色层级允许管理");

      return true;
    },
    [currentAuthUser],
  );

  // 权限不足时的提示函数
  const showPermissionDenied = useCallback((reason?: string) => {
    const message = reason || "权限不足";

    console.log("显示权限不足提示:", message);
    addToast({
      title: "错误",
      description: message,
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
  }, []);

  // 计算表头列
  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid),
    );
  }, [visibleColumns]);

  // 过滤用户
  const filteredItems = useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.username.toLowerCase().includes(filterValue.toLowerCase()) ||
          user.email.toLowerCase().includes(filterValue.toLowerCase()) ||
          (user.first_name &&
            user.first_name
              .toLowerCase()
              .includes(filterValue.toLowerCase())) ||
          (user.last_name &&
            user.last_name.toLowerCase().includes(filterValue.toLowerCase())),
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredUsers = filteredUsers.filter((user) => {
        const status = user.is_active ? "active" : "inactive";

        return Array.from(statusFilter).includes(status);
      });
    }

    return filteredUsers;
  }, [users, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  // 分页数据
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  // 排序数据
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let first, second;

      switch (sortDescriptor.column) {
        case "name":
          first = a.username;
          second = b.username;
          break;
        case "role":
          first = a.profile?.role || "";
          second = b.profile?.role || "";
          break;
        case "status":
          first = a.is_active ? "active" : "inactive";
          second = b.is_active ? "active" : "inactive";
          break;
        default:
          first = a.username;
          second = b.username;
          break;
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: "1", // 前端分页
        page_size: "1000", // 获取所有数据
        search: "",
        ordering: "username",
      });

      const response = await api.get(`/users/?${params.toString()}`);

      setUsers(response.results || []);
      setTotalUsers(response.count || 0);
    } catch (error: any) {
      console.error("获取用户列表详细错误:", error);
      let errorMessage = "获取用户列表失败";

      if (error.message) {
        if (error.message.includes("401")) {
          errorMessage = "认证失败，请重新登录";
        } else if (error.message.includes("403")) {
          errorMessage = "权限不足，无法访问用户列表";
        } else if (error.message.includes("404")) {
          errorMessage = "API接口不存在";
        } else if (error.message.includes("500")) {
          errorMessage = "服务器内部错误";
        } else {
          errorMessage = `API错误: ${error.message}`;
        }
      }

      addToast({
        title: "错误",
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchJobTitles();
    fetchRoles();
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (employeeIdCheckTimerRef.current) {
        clearTimeout(employeeIdCheckTimerRef.current);
      }
    };
  }, []);

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments/");

      setDepartments(response.results || response || []);
    } catch (error) {
      console.error("获取部门列表失败:", error);
    }
  };

  // 获取职称列表
  const fetchJobTitles = async () => {
    try {
      const response = await api.get("/job-titles/");

      setJobTitles(response.results || response || []);
    } catch (error) {
      console.error("获取职称列表失败:", error);
    }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles/");

      setRoles(response.results || response || []);
    } catch (error) {
      console.error("获取角色列表失败:", error);
    }
  };

  // 创建用户
  const handleCreateUser = async () => {
    if (!createFormData.employee_id.trim()) {
      addToast({
        title: "错误",
        description: "工号不能为空",
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

      return;
    }

    if (employeeIdError) {
      addToast({
        title: "错误",
        description: "该工号已被使用，请使用其他工号",
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

      return;
    }

    try {
      const userData = {
        ...createFormData,
        department: createFormData.department
          ? parseInt(createFormData.department)
          : null,
        job_title: createFormData.job_title
          ? parseInt(createFormData.job_title)
          : null,
        role: createFormData.role ? parseInt(createFormData.role) : null,
      };

      await api.post("/users/", userData);
      addToast({
        title: "成功",
        description: "用户创建成功",
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
      resetForm();
      onCreateClose();
      await fetchUsers();

      // 强制刷新表格组件
      setTableKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("创建用户失败:", error);
      const errorMessage =
        error.response?.data?.error || error.message || "创建用户失败";

      addToast({
        title: "错误",
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
    }
  };

  // 更新用户
  const handleUpdateUser = async () => {
    if (!currentUser) return;

    // 检查权限
    if (!canManageUser(currentUser)) {
      showPermissionDenied();

      return;
    }

    if (employeeIdError) {
      addToast({
        title: "错误",
        description: "该工号已被使用，请使用其他工号",
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

      return;
    }

    try {
      const userData = {
        ...editFormData,
        department: editFormData.department
          ? parseInt(editFormData.department)
          : null,
        job_title: editFormData.job_title
          ? parseInt(editFormData.job_title)
          : null,
        role: editFormData.role ? parseInt(editFormData.role) : null,
      };

      // 更新用户基本信息
      await api.put(`/users/${currentUser.id}/`, userData);

      // 如果状态有变化，同时更新状态
      const currentStatus =
        currentUser.profile?.status ||
        (currentUser.is_active ? "active" : "disabled");

      if (userStatusState !== currentStatus) {
        await api.post(`/users/${currentUser.id}/toggle_status/`, {
          status: userStatusState,
        });
      }

      addToast({
        title: "成功",
        description: "用户更新成功",
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

      // 重置编辑表单
      setEditFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        confirm_password: "",
        is_active: true,
        is_staff: false,
        is_superuser: false,
        department: "",
        job_title: "",
        role: "",
        phone: "",
        employee_id: "",
      });

      onEditClose();

      // 强制刷新用户列表，确保显示最新数据
      await fetchUsers();

      // 强制刷新表格组件
      setTableKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("更新用户失败:", error);
      if (error.response?.status === 403) {
        showPermissionDenied();
      } else {
        const errorMessage =
          error.response?.data?.error || error.message || "更新用户失败";

        addToast({
          title: "错误",
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
      }
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!currentUser) return;

    // 检查权限
    if (!canManageUser(currentUser)) {
      showPermissionDenied();

      return;
    }

    if (createFormData.password !== createFormData.confirm_password) {
      addToast({
        title: "错误",
        description: "密码和确认密码不匹配",
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

      return;
    }

    try {
      await api.post(`/users/${currentUser.id}/reset_password/`, {
        password: createFormData.password,
        confirm_password: createFormData.confirm_password,
      });
      addToast({
        title: "成功",
        description: "密码重置成功",
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
      resetForm();
      onPasswordClose();
    } catch (error: any) {
      console.error("重置密码失败:", error);
      if (error.response?.status === 403) {
        showPermissionDenied();
      } else {
        const errorMessage =
          error.response?.data?.error || error.message || "重置密码失败";

        addToast({
          title: "错误",
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
      }
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    const user = users.find((u) => u.id === userId);

    setCurrentUser(user || null);
    onDeleteOpen();
  };

  const confirmDeleteUser = async () => {
    if (!currentUser) return;

    // 检查权限
    if (!canManageUser(currentUser)) {
      showPermissionDenied();
      onDeleteClose();

      return;
    }

    try {
      await api.delete(`/users/${currentUser.id}/`);
      addToast({
        title: "成功",
        description: "用户删除成功",
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
      onDeleteClose();
      setCurrentUser(null);
      await fetchUsers();

      // 强制刷新表格组件
      setTableKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("删除用户失败:", error);
      if (error.response?.status === 403) {
        showPermissionDenied();
      } else {
        const errorMessage =
          error.response?.data?.error || error.message || "删除用户失败";

        addToast({
          title: "错误",
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
      }
    }
  };

  // 获取当前用户状态
  const getCurrentUserStatus = () => {
    if (currentUser?.profile?.status) {
      return currentUser.profile.status;
    }

    return createFormData.is_active ? "active" : "disabled";
  };

  // 设置用户状态
  const setUserStatus = (status: "active" | "inactive" | "disabled") => {
    setUserStatusState(status);
    // 同时更新is_active字段以保持兼容性
    setCreateFormData({ ...createFormData, is_active: status === "active" });
  };

  const resetForm = () => {
    setCreateFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
      is_active: true,
      is_staff: false,
      is_superuser: false,
      department: "",
      job_title: "",
      role: "",
      phone: "",
      employee_id: "",
    });
    setUserStatusState("active");
    setEmployeeIdError("");
    setIsCheckingEmployeeId(false);
  };

  const openEditModal = (user: SystemUser) => {
    // 确保基础数据已加载
    if (!departments.length || !jobTitles.length || !roles.length) {
      addToast({
        title: "加载中",
        description: "正在加载基础数据，请稍后再试",
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
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        ),
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });

      return;
    }

    setCurrentUser(user);

    // 使用profile中的ID进行匹配
    const userDepartmentId = user.profile?.department_id;
    const userJobTitleId = user.profile?.job_title_id;
    const userRoleId = user.profile?.role_id;

    // 设置编辑表单数据
    setEditFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      password: "",
      confirm_password: "",
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
      department: userDepartmentId ? userDepartmentId.toString() : "",
      job_title: userJobTitleId ? userJobTitleId.toString() : "",
      role: userRoleId ? userRoleId.toString() : "",
      phone: user.profile?.phone || "",
      employee_id: user.profile?.employee_id || "",
    });

    // 设置用户状态
    setUserStatus(getCurrentUserStatus());
    onEditOpen();
  };

  const openViewModal = (user: SystemUser) => {
    setCurrentUser(user);
    onViewOpen();
  };

  const openPasswordModal = (user: SystemUser) => {
    setCurrentUser(user);
    setCreateFormData({
      ...createFormData,
      password: "",
      confirm_password: "",
    });
    onPasswordOpen();
  };

  // 处理排序变化
  const handleSortChange = useCallback((descriptor: any) => {
    setSortDescriptor({
      column: String(descriptor.column),
      direction: descriptor.direction,
    });
  }, []);

  // 渲染单元格
  const renderCell = useCallback(
    (user: SystemUser, columnKey: React.Key): React.ReactNode => {
      const cellValue = user[columnKey as keyof SystemUser];

      switch (columnKey) {
        case "name":
          // 根据用户状态、职位级别和角色分配头像颜色
          const getAvatarColor = (user: SystemUser) => {
            // 优先考虑用户状态
            if (user.profile?.status === "disabled") return "danger"; // 被禁用 - 红色
            if (user.profile?.status === "inactive") return "default"; // 未激活 - 灰色

            // 考虑系统权限
            if (user.is_superuser) return "warning";

            // 根据职位级别设置颜色
            if (user.profile?.job_title) {
              const jobTitle = user.profile.job_title;

              // 正高级职位 - 紫色
              if (
                jobTitle.includes("资深经理") ||
                jobTitle.includes("正高级")
              ) {
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
            if (user.profile?.role === "管理员") return "primary";
            if (user.is_staff) return "secondary";

            // 默认颜色
            return "success";
          };

          return (
            <User
              avatarProps={{
                radius: "lg",
                isBordered: true,
                color: getAvatarColor(user),
                src:
                  user.profile?.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
              }}
              description={user.email}
              name={
                user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.username
              }
            >
              {user.email}
            </User>
          );
        case "role":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {user.profile?.role || "未分配"}
              </p>
              <p className="text-bold text-tiny capitalize text-default-400">
                {user.profile?.department || "无部门"}
              </p>
            </div>
          );
        case "department":
          return (
            <Chip
              className="capitalize"
              color="primary"
              size="sm"
              variant="flat"
            >
              {user.profile?.department || "未分配"}
            </Chip>
          );
        case "job_title":
          return (
            <Chip
              className="capitalize"
              color="secondary"
              size="sm"
              variant="flat"
            >
              {user.profile?.job_title || "未分配"}
            </Chip>
          );
        case "status":
          const getStatusColor = (status: string) => {
            switch (status) {
              case "active":
                return "success"; // 激活 - 绿色
              case "inactive":
                return "default"; // 未激活 - 灰色
              case "disabled":
                return "danger"; // 禁用 - 红色
              default:
                return "default";
            }
          };

          return (
            <Chip
              className="capitalize"
              color={getStatusColor(user.profile?.status || "inactive")}
              size="sm"
              variant="flat"
            >
              {user.profile?.status_display || "未激活"}
            </Chip>
          );
        case "actions":
          const hasPermission = canManageUser(user);

          return (
            <div className="relative flex justify-end items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <VerticalDotsIcon className="text-default-300 w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="view" onPress={() => openViewModal(user)}>
                    查看详情
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    className={!hasPermission ? "text-default-300" : ""}
                    isDisabled={!hasPermission}
                    onPress={() => {
                      if (hasPermission) {
                        openEditModal(user);
                      } else {
                        showPermissionDenied();
                      }
                    }}
                  >
                    编辑用户
                  </DropdownItem>
                  <DropdownItem
                    key="password"
                    className={!hasPermission ? "text-default-300" : ""}
                    isDisabled={!hasPermission}
                    onPress={() => {
                      if (hasPermission) {
                        openPasswordModal(user);
                      } else {
                        showPermissionDenied();
                      }
                    }}
                  >
                    重置密码
                  </DropdownItem>

                  <DropdownItem
                    key="delete"
                    className={
                      !hasPermission ? "text-default-300" : "text-danger"
                    }
                    color={hasPermission ? "danger" : "default"}
                    isDisabled={!hasPermission}
                    onPress={() => {
                      if (hasPermission) {
                        handleDeleteUser(user.id);
                      } else {
                        showPermissionDenied();
                      }
                    }}
                  >
                    删除用户
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return String(cellValue || "");
      }
    },
    [departments, jobTitles, roles, users],
  );

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onSearchChange = useCallback((value: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  // 顶部内容
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="搜索用户名、邮箱..."
            startContent={<SearchIcon className="w-4 h-4" />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={
                    <ChevronDownIcon className="text-small w-4 h-4" />
                  }
                  variant="flat"
                >
                  状态
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="状态筛选"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={
                    <ChevronDownIcon className="text-small w-4 h-4" />
                  }
                  variant="flat"
                >
                  列显示
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="表格列"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              color="primary"
              endContent={<PlusIcon className="w-4 h-4" />}
              onPress={onCreateOpen}
            >
              添加用户
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            共 {totalUsers} 个用户
          </span>
          <div className="flex items-center gap-2">
            <span className="text-default-400 text-small">每页显示:</span>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  className="min-w-16"
                  endContent={
                    <ChevronDownIcon className="text-small w-3 h-3" />
                  }
                  size="sm"
                  variant="flat"
                >
                  {rowsPerPage}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="每页显示数量"
                selectedKeys={[rowsPerPage.toString()]}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  setRowsPerPage(Number(selectedKey));
                  setPage(1);
                }}
              >
                <DropdownItem key="5">5</DropdownItem>
                <DropdownItem key="10">10</DropdownItem>
                <DropdownItem key="15">15</DropdownItem>
                <DropdownItem key="20">20</DropdownItem>
                <DropdownItem key="25">25</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    totalUsers,
    rowsPerPage,
    onSearchChange,
    hasSearchFilter,
  ]);

  // 底部内容
  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "已选择所有项目"
            : `已选择 ${selectedKeys.size} / ${filteredItems.length} 项`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            上一页
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            下一页
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, filteredItems.length, page, pages, hasSearchFilter]);

  const handleError = (message: string) => {
    addToast({
      title: "错误",
      description: message,
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
  };

  const handleSuccess = (message: string) => {
    addToast({
      title: "成功",
      description: message,
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
  };

  const handleInfo = (message: string) => {
    addToast({
      title: message,
      color: "primary",
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
          <line x1="12" x2="12" y1="16" y2="12" />
          <line x1="12" x2="12" y1="8" y2="8" />
        </svg>
      ),
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    });
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">用户管理</h1>
            <p className="text-small text-default-500">管理系统用户信息</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Table
            key={tableKey}
            isHeaderSticky
            aria-label="用户管理表格"
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            classNames={{
              wrapper: "max-h-[382px]",
            }}
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            sortDescriptor={sortDescriptor}
            topContent={topContent}
            topContentPlacement="outside"
            onSelectionChange={setSelectedKeys}
            onSortChange={handleSortChange}
          >
            <TableHeader columns={headerColumns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.uid === "actions" ? "center" : "start"}
                  allowsSorting={column.sortable}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={"没有找到用户"}
              isLoading={loading}
              items={sortedItems}
            >
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 创建用户模态框 */}
      <Modal
        isOpen={isCreateOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={onCreateClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">添加用户</ModalHeader>
          <ModalBody>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="用户名"
                  placeholder="请输入用户名"
                  value={createFormData.username}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      username: e.target.value,
                    })
                  }
                />
                <Input
                  label="邮箱"
                  placeholder="请输入邮箱"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  endContent={
                    isCheckingEmployeeId ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : null
                  }
                  errorMessage={employeeIdError}
                  isInvalid={!!employeeIdError}
                  label="工号"
                  placeholder="请输入工号"
                  value={createFormData.employee_id}
                  onChange={(e) => handleEmployeeIdChange(e.target.value)}
                />
                <Input
                  label="电话"
                  placeholder="请输入电话号码"
                  value={createFormData.phone}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="姓"
                  placeholder="请输入姓"
                  value={createFormData.first_name}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      first_name: e.target.value,
                    })
                  }
                />
                <Input
                  label="名"
                  placeholder="请输入名"
                  value={createFormData.last_name}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      last_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="密码"
                  placeholder="请输入密码"
                  type="password"
                  value={createFormData.password}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      password: e.target.value,
                    })
                  }
                />
                <Input
                  isRequired
                  label="确认密码"
                  placeholder="请再次输入密码"
                  type="password"
                  value={createFormData.confirm_password}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      confirm_password: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="部门"
                  placeholder="请选择部门"
                  selectedKeys={
                    createFormData.department ? [createFormData.department] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    setCreateFormData({
                      ...createFormData,
                      department: selectedKey || "",
                    });
                  }}
                >
                  {departments.map((dept) => (
                    <SelectItem key={dept.id.toString()} textValue={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="职称"
                  placeholder="请选择职称"
                  selectedKeys={
                    createFormData.job_title ? [createFormData.job_title] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    setCreateFormData({
                      ...createFormData,
                      job_title: selectedKey || "",
                    });
                  }}
                >
                  {jobTitles.map((jt) => (
                    <SelectItem
                      key={jt.id.toString()}
                      textValue={`${jt.name} (${jt.level})`}
                    >
                      {jt.name} ({jt.level})
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="角色"
                  placeholder="请选择角色"
                  selectedKeys={
                    createFormData.role ? [createFormData.role] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    setCreateFormData({
                      ...createFormData,
                      role: selectedKey || "",
                    });
                  }}
                >
                  {roles.map((role) => (
                    <SelectItem key={role.id.toString()} textValue={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </Select>
                <div />
              </div>
              <div className="flex gap-4">
                <Switch
                  isSelected={createFormData.is_active}
                  onValueChange={(checked) =>
                    setCreateFormData({ ...createFormData, is_active: checked })
                  }
                >
                  激活状态
                </Switch>
                <Switch
                  isSelected={createFormData.is_staff}
                  onValueChange={(checked) =>
                    setCreateFormData({ ...createFormData, is_staff: checked })
                  }
                >
                  员工状态
                </Switch>
                <Switch
                  isSelected={createFormData.is_superuser}
                  onValueChange={(checked) =>
                    setCreateFormData({
                      ...createFormData,
                      is_superuser: checked,
                    })
                  }
                >
                  超级用户
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onCreateClose}>
              取消
            </Button>
            <Button
              color="primary"
              isDisabled={!!employeeIdError}
              onPress={handleCreateUser}
            >
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        isOpen={isEditOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={onEditClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">编辑用户</ModalHeader>
          <ModalBody>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="用户名"
                  placeholder="请输入用户名"
                  value={editFormData.username}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      username: e.target.value,
                    })
                  }
                />
                <Input
                  label="邮箱"
                  placeholder="请输入邮箱"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  endContent={
                    isCheckingEmployeeId ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : null
                  }
                  errorMessage={employeeIdError}
                  isInvalid={!!employeeIdError}
                  label="工号"
                  placeholder="请输入工号"
                  value={editFormData.employee_id}
                  onChange={(e) => handleEmployeeIdChange(e.target.value)}
                />
                <Input
                  label="电话"
                  placeholder="请输入电话号码"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="姓"
                  placeholder="请输入姓"
                  value={editFormData.first_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      first_name: e.target.value,
                    })
                  }
                />
                <Input
                  label="名"
                  placeholder="请输入名"
                  value={editFormData.last_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      last_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="部门"
                  placeholder="请选择部门"
                  selectedKeys={
                    editFormData.department ? [editFormData.department] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    setEditFormData({
                      ...editFormData,
                      department: selectedKey || "",
                    });
                  }}
                >
                  {departments.map((dept) => (
                    <SelectItem key={dept.id.toString()} textValue={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="职称"
                  placeholder="请选择职称"
                  selectedKeys={
                    editFormData.job_title ? [editFormData.job_title] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    setEditFormData({
                      ...editFormData,
                      job_title: selectedKey || "",
                    });
                  }}
                >
                  {jobTitles.map((jt) => (
                    <SelectItem
                      key={jt.id.toString()}
                      textValue={`${jt.name} (${jt.level})`}
                    >
                      {jt.name} ({jt.level})
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="角色"
                  placeholder="请选择角色"
                  selectedKeys={editFormData.role ? [editFormData.role] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    setEditFormData({
                      ...editFormData,
                      role: selectedKey || "",
                    });
                  }}
                >
                  {roles.map((role) => (
                    <SelectItem key={role.id.toString()} textValue={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </Select>
                <div />
              </div>

              {/* 用户状态选择 */}
              <div className="space-y-4">
                <div>
                  <label className="text-small font-medium mb-2 block">
                    用户状态
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        checked={userStatusState === "active"}
                        name="user-status-edit"
                        type="radio"
                        onChange={() => setUserStatus("active")}
                      />
                      <span>激活</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        checked={userStatusState === "inactive"}
                        name="user-status-edit"
                        type="radio"
                        onChange={() => setUserStatus("inactive")}
                      />
                      <span>未激活</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        checked={userStatusState === "disabled"}
                        name="user-status-edit"
                        type="radio"
                        onChange={() => setUserStatus("disabled")}
                      />
                      <span>禁用</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onEditClose}>
              取消
            </Button>
            <Button
              color="primary"
              isDisabled={!!employeeIdError}
              onPress={handleUpdateUser}
            >
              更新
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 重置密码模态框 */}
      <Modal isOpen={isPasswordOpen} onOpenChange={onPasswordClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">重置密码</ModalHeader>
          <ModalBody>
            <div className="grid gap-4">
              <Input
                isRequired
                label="新密码"
                placeholder="请输入新密码"
                type="password"
                value={createFormData.password}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    password: e.target.value,
                  })
                }
              />
              <Input
                isRequired
                label="确认密码"
                placeholder="请再次输入新密码"
                type="password"
                value={createFormData.confirm_password}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    confirm_password: e.target.value,
                  })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onPasswordClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleResetPassword}>
              重置密码
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 查看用户模态框 */}
      <Modal isOpen={isViewOpen} size="lg" onOpenChange={onViewClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">用户详情</ModalHeader>
          <ModalBody>
            {currentUser && (
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <User
                    avatarProps={{
                      radius: "lg",
                      src:
                        currentUser.profile?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.username}`,
                      size: "lg",
                    }}
                    description={currentUser.email}
                    name={
                      currentUser.first_name && currentUser.last_name
                        ? `${currentUser.first_name} ${currentUser.last_name}`
                        : currentUser.username
                    }
                  />
                  <div>
                    <Chip
                      color={
                        currentUser.profile?.status === "active"
                          ? "success"
                          : currentUser.profile?.status === "inactive"
                            ? "default"
                            : "danger"
                      }
                      variant="flat"
                    >
                      {currentUser.profile?.status_display ||
                        (currentUser.is_active ? "激活" : "禁用")}
                    </Chip>
                  </div>
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-small text-default-500">用户名</p>
                    <p className="font-medium">{currentUser.username}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">邮箱</p>
                    <p className="font-medium">{currentUser.email}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">角色</p>
                    <p className="font-medium">
                      {currentUser.profile?.role || "未分配"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">部门</p>
                    <p className="font-medium">
                      {currentUser.profile?.department || "未分配"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">职称</p>
                    <p className="font-medium">
                      {currentUser.profile?.job_title || "未分配"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">工号</p>
                    <p className="font-medium">
                      {currentUser.profile?.employee_id || "未填写"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">电话</p>
                    <p className="font-medium">
                      {currentUser.profile?.phone || "未填写"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">员工状态</p>
                    <p className="font-medium">
                      {currentUser.is_staff ? "是" : "否"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">超级用户</p>
                    <p className="font-medium">
                      {currentUser.is_superuser ? "是" : "否"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">注册时间</p>
                    <p className="font-medium">
                      {new Date(currentUser.date_joined).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">最后登录</p>
                    <p className="font-medium">
                      {currentUser.last_login_display || "从未登录"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onViewClose}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        message={`确定要删除用户 "${currentUser?.username}" 吗？此操作不可撤销。`}
        title="删除用户"
        onClose={onDeleteClose}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}
