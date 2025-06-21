import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Tooltip,
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
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Pagination,
} from "@heroui/react";
import { Search as SearchIcon, Plus as PlusIcon, Edit as EditIcon, Trash2 as DeleteIcon, Eye as EyeIcon, Key as KeyIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { api } from "@/services/api";

interface User {
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
    role_display: string;
    department: string;
    position: string;
    job_title: string;
    phone: string;
    is_active: boolean;
  } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    is_active: true,
    is_staff: false,
    is_superuser: false,
  });

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "10",
        search: searchTerm,
        ordering: "username",
      });
      
      if (filterStatus !== "all") {
        params.append("is_active", filterStatus === "active" ? "true" : "false");
      }
      
      const response = await api.get(`/users/?${params}`);
      setUsers(response.data.results || response.data);
      setTotalPages(Math.ceil((response.data.count || response.data.length) / 10));
    } catch (error) {
      console.error("获取用户列表失败:", error);
      toast.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, filterStatus]);

  // 创建用户
  const handleCreateUser = async () => {
    try {
      const response = await api.post("/users/", formData);
      toast.success("用户创建成功");
      onCreateClose();
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("创建用户失败:", error);
      toast.error(error.response?.data?.message || "创建用户失败");
    }
  };

  // 更新用户
  const handleUpdateUser = async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.put(`/users/${currentUser.id}/`, formData);
      toast.success("用户更新成功");
      onEditClose();
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("更新用户失败:", error);
      toast.error(error.response?.data?.message || "更新用户失败");
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.post(`/users/${currentUser.id}/reset_password/`, {
        password: formData.password,
        confirm_password: formData.confirm_password,
      });
      toast.success("密码重置成功");
      onPasswordClose();
      resetForm();
    } catch (error: any) {
      console.error("重置密码失败:", error);
      toast.error(error.response?.data?.message || "重置密码失败");
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    if (!confirm("确定要删除这个用户吗？")) return;
    
    try {
      await api.delete(`/users/${userId}/`);
      toast.success("用户删除成功");
      fetchUsers();
    } catch (error: any) {
      console.error("删除用户失败:", error);
      toast.error(error.response?.data?.message || "删除用户失败");
    }
  };

  // 切换用户状态
  const handleToggleStatus = async (userId: number) => {
    try {
      const response = await api.post(`/users/${userId}/toggle_status/`);
      toast.success(response.data.message);
      fetchUsers();
    } catch (error: any) {
      console.error("切换用户状态失败:", error);
      toast.error(error.response?.data?.message || "切换用户状态失败");
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
      is_active: true,
      is_staff: false,
      is_superuser: false,
    });
  };

  // 打开编辑模态框
  const openEditModal = (user: User) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: "",
      confirm_password: "",
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
    });
    onEditOpen();
  };

  // 打开查看模态框
  const openViewModal = (user: User) => {
    setCurrentUser(user);
    onViewOpen();
  };

  // 打开密码重置模态框
  const openPasswordModal = (user: User) => {
    setCurrentUser(user);
    resetForm();
    onPasswordOpen();
  };

  const columns = [
    { name: "用户信息", uid: "user" },
    { name: "角色", uid: "role" },
    { name: "部门/职位", uid: "department" },
    { name: "状态", uid: "status" },
    { name: "最后登录", uid: "last_login" },
    { name: "操作", uid: "actions" },
  ];

  const renderCell = (user: User, columnKey: React.Key) => {
    switch (columnKey) {
      case "user":
        return (
          <User
            avatarProps={{ radius: "lg", src: "" }}
            description={user.email}
            name={`${user.first_name} ${user.last_name}`}
          >
            {user.username}
          </User>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">
              {user.profile?.role_display || "无角色"}
            </p>
            {user.is_superuser && (
              <Chip color="danger" size="sm" variant="flat">
                超级管理员
              </Chip>
            )}
            {user.is_staff && !user.is_superuser && (
              <Chip color="warning" size="sm" variant="flat">
                管理员
              </Chip>
            )}
          </div>
        );
      case "department":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">
              {user.profile?.department || "未分配"}
            </p>
            <p className="text-bold text-tiny capitalize text-default-400">
              {user.profile?.position || "未分配"}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={user.is_active ? "success" : "danger"}
            size="sm"
            variant="flat"
          >
            {user.is_active ? "激活" : "禁用"}
          </Chip>
        );
      case "last_login":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">
              {user.last_login_display || "从未登录"}
            </p>
          </div>
        );
      case "actions":
        return (
          <div className="flex gap-2">
            <Tooltip content="查看详情">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => openViewModal(user)}
              >
                <EyeIcon className="text-default-300" />
              </Button>
            </Tooltip>
            <Tooltip content="编辑用户">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => openEditModal(user)}
              >
                <EditIcon className="text-default-300" />
              </Button>
            </Tooltip>
            <Tooltip content="重置密码">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => openPasswordModal(user)}
              >
                <KeyIcon className="text-default-300" />
              </Button>
            </Tooltip>
            <Tooltip content="删除用户">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => handleDeleteUser(user.id)}
              >
                <DeleteIcon className="text-danger" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full p-6">
      <Card>
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">用户管理</p>
            <p className="text-small text-default-500">
              管理系统用户账号、权限和状态
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          {/* 搜索和筛选 */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <Input
                placeholder="搜索用户名、邮箱、姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<SearchIcon />}
                className="w-80"
              />
              <Select
                placeholder="状态筛选"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-40"
              >
                <SelectItem key="all">全部</SelectItem>
                <SelectItem key="active">激活</SelectItem>
                <SelectItem key="inactive">禁用</SelectItem>
              </Select>
              <Button
                color="primary"
                startContent={<PlusIcon />}
                onPress={onCreateOpen}
              >
                添加用户
              </Button>
            </div>
          </div>

          {/* 用户表格 */}
          <Table
            aria-label="用户列表"
            bottomContent={
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={totalPages}
                  onChange={(page) => setPage(page)}
                />
              </div>
            }
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid} align="start">
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={users}
              isLoading={loading}
              loadingContent="加载中..."
              emptyContent="暂无用户数据"
            >
              {(user) => (
                <TableRow key={user.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(user, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 创建用户模态框 */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="2xl">
        <ModalContent>
          <ModalHeader>创建新用户</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="用户名"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                isRequired
              />
              <Input
                label="邮箱"
                placeholder="请输入邮箱"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                isRequired
              />
              <Input
                label="姓名"
                placeholder="请输入姓名"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
              <Input
                label="密码"
                placeholder="请输入密码"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                isRequired
              />
              <Input
                label="确认密码"
                placeholder="请再次输入密码"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                isRequired
              />
            </div>
            <div className="flex gap-4 mt-4">
              <Switch
                isSelected={formData.is_active}
                onValueChange={(checked) => setFormData({...formData, is_active: checked})}
              >
                激活状态
              </Switch>
              <Switch
                isSelected={formData.is_staff}
                onValueChange={(checked) => setFormData({...formData, is_staff: checked})}
              >
                管理员权限
              </Switch>
              <Switch
                isSelected={formData.is_superuser}
                onValueChange={(checked) => setFormData({...formData, is_superuser: checked})}
              >
                超级管理员
              </Switch>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onCreateClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleCreateUser}>
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <ModalHeader>编辑用户</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="用户名"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                isRequired
              />
              <Input
                label="邮箱"
                placeholder="请输入邮箱"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                isRequired
              />
              <Input
                label="姓名"
                placeholder="请输入姓名"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div className="flex gap-4 mt-4">
              <Switch
                isSelected={formData.is_active}
                onValueChange={(checked) => setFormData({...formData, is_active: checked})}
              >
                激活状态
              </Switch>
              <Switch
                isSelected={formData.is_staff}
                onValueChange={(checked) => setFormData({...formData, is_staff: checked})}
              >
                管理员权限
              </Switch>
              <Switch
                isSelected={formData.is_superuser}
                onValueChange={(checked) => setFormData({...formData, is_superuser: checked})}
              >
                超级管理员
              </Switch>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onEditClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleUpdateUser}>
              更新
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 重置密码模态框 */}
      <Modal isOpen={isPasswordOpen} onClose={onPasswordClose}>
        <ModalContent>
          <ModalHeader>重置密码</ModalHeader>
          <ModalBody>
            <p className="mb-4">
              为用户 <strong>{currentUser?.username}</strong> 重置密码
            </p>
            <Input
              label="新密码"
              placeholder="请输入新密码"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              isRequired
            />
            <Input
              label="确认密码"
              placeholder="请再次输入新密码"
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              isRequired
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onPasswordClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleResetPassword}>
              重置密码
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 查看用户详情模态框 */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
        <ModalContent>
          <ModalHeader>用户详情</ModalHeader>
          <ModalBody>
            {currentUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <User
                    avatarProps={{ radius: "lg", src: "" }}
                    name={`${currentUser.first_name} ${currentUser.last_name}`}
                    description={currentUser.email}
                  />
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">用户名</p>
                    <p className="font-medium">{currentUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">邮箱</p>
                    <p className="font-medium">{currentUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">角色</p>
                    <p className="font-medium">{currentUser.profile?.role_display || "无角色"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">部门</p>
                    <p className="font-medium">{currentUser.profile?.department || "未分配"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">职位</p>
                    <p className="font-medium">{currentUser.profile?.position || "未分配"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">电话</p>
                    <p className="font-medium">{currentUser.profile?.phone || "未设置"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">状态</p>
                    <Badge color={currentUser.is_active ? "success" : "danger"}>
                      {currentUser.is_active ? "激活" : "禁用"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">注册时间</p>
                    <p className="font-medium">{new Date(currentUser.date_joined).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">最后登录</p>
                    <p className="font-medium">{currentUser.last_login_display || "从未登录"}</p>
                  </div>
                </div>
                <Divider />
                <div>
                  <p className="text-sm text-gray-500 mb-2">权限</p>
                  <div className="flex gap-2">
                    {currentUser.is_superuser && (
                      <Chip color="danger" size="sm">超级管理员</Chip>
                    )}
                    {currentUser.is_staff && (
                      <Chip color="warning" size="sm">管理员</Chip>
                    )}
                    {currentUser.is_active && (
                      <Chip color="success" size="sm">激活用户</Chip>
                    )}
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
    </div>
  );
} 