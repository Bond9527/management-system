import React, { useState, useEffect, Fragment } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Switch,
  Chip,
  Tooltip,
  Pagination,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from "@heroui/react";

import { SearchIcon, PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Department {
  id: number;
  name: string;
  description: string;
  parent: number | null;
  parent_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children_count: number;
}

export default function DepartmentTab() {
  const { isAuthenticated, user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent: null as number | null,
    is_active: true,
  });

  const rowsPerPage = 10;

  // 获取部门列表
  const fetchDepartments = async () => {
    if (!isAuthenticated) {
      setError("请先登录以访问此功能");

      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/departments/", {
        params: {
          search: search,
        },
      });

      // 现在API直接返回数组，不再是分页响应
      const departmentData = Array.isArray(response)
        ? response
        : response?.results || [];

      // 在前端进行过滤和分页
      const filteredDepartments = departmentData.filter(
        (dept: any) =>
          !search || dept.name.toLowerCase().includes(search.toLowerCase()),
      );

      // 前端分页
      const startIndex = (page - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const paginatedDepartments = filteredDepartments.slice(
        startIndex,
        endIndex,
      );

      setDepartments(paginatedDepartments);
      setTotalPages(Math.ceil(filteredDepartments.length / rowsPerPage));
    } catch (error: any) {
      console.error("获取部门列表失败:", error);
      if (error.message.includes("Authentication")) {
        setError("认证失败，请重新登录");
      } else {
        setError(`获取部门列表失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取父部门选项
  const getParentOptions = () => {
    return departments.filter((dept) => dept.id !== editId);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDepartments();
    } else {
      setError("请先登录以访问此功能");
    }
  }, [search, page, isAuthenticated]);

  // 打开新增弹窗
  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      name: "",
      description: "",
      parent: null,
      is_active: true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (department: Department) => {
    setModalMode("edit");
    setEditId(department.id);
    setFormData({
      name: department.name,
      description: department.description,
      parent: department.parent,
      is_active: department.is_active,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 表单验证
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "部门名称不能为空";
    } else if (formData.name.length > 100) {
      errors.name = "部门名称不能超过100个字符";
    }

    if (formData.description.length > 500) {
      errors.description = "部门描述不能超过500个字符";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // 保存部门
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === "add") {
        await api.post("/departments/", formData);
      } else if (editId !== null) {
        await api.put(`/departments/${editId}/`, formData);
      }

      setShowModal(false);
      fetchDepartments();
    } catch (error: any) {
      console.error("保存部门失败:", error);
      if (error.response?.data) {
        setFormErrors(error.response.data);
      }
    }
  };

  // 删除部门
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await api.delete(`/departments/${deleteId}/`);
        fetchDepartments();
      } catch (error) {
        console.error("删除部门失败:", error);
      }
    }
  };

  // 关闭删除模态框
  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // 批量选择
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(departments.map((dept) => dept.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id]);
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    }
  };

  // 批量更新状态
  const handleBatchUpdate = async (is_active: boolean) => {
    try {
      await api.post("/departments/batch_update/", {
        ids: selectedRows,
        is_active: is_active,
      });
      setSelectedRows([]);
      fetchDepartments();
    } catch (error) {
      console.error("批量更新失败:", error);
    }
  };

  // 如果用户未认证，显示提示信息
  if (!isAuthenticated) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">需要登录</h2>
            <p className="text-gray-600">请先登录以访问部门管理功能</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">部门管理</h2>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
              <Button
                className="mt-2"
                color="primary"
                onClick={() => {
                  setError(null);
                  fetchDepartments();
                }}
              >
                重试
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">部门管理</h2>
          <p className="text-gray-600">在这里管理公司部门结构和层级关系</p>

          {loading && (
            <div className="flex justify-center items-center py-4">
              <Spinner
                classNames={{
                  label: "text-sm text-gray-600 ml-2",
                }}
                color="primary"
                label="加载中..."
                size="sm"
              />
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-[284px]">
                <Input
                  placeholder="搜索部门..."
                  startContent={
                    <SearchIcon className="text-base text-gray-400 pointer-events-none flex-shrink-0" />
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                aria-label="添加新部门"
                color="primary"
                startContent={<PlusIcon className="text-lg" />}
                onClick={openAddModal}
              >
                添加部门
              </Button>
              {selectedRows.length > 0 && (
                <Dropdown>
                  <DropdownTrigger>
                    <Button color="secondary">
                      批量操作 ({selectedRows.length})
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="activate"
                      onClick={() => handleBatchUpdate(true)}
                    >
                      批量激活
                    </DropdownItem>
                    <DropdownItem
                      key="deactivate"
                      onClick={() => handleBatchUpdate(false)}
                    >
                      批量停用
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>
          </div>

          <Table aria-label="部门管理表格">
            <TableHeader>
              <TableColumn>
                <Checkbox
                  isIndeterminate={
                    selectedRows.length > 0 &&
                    selectedRows.length < departments.length
                  }
                  isSelected={selectedRows.length === departments.length}
                  onValueChange={handleSelectAll}
                />
              </TableColumn>
              <TableColumn>ID</TableColumn>
              <TableColumn>部门名称</TableColumn>
              <TableColumn>描述</TableColumn>
              <TableColumn>上级部门</TableColumn>
              <TableColumn>子部门数量</TableColumn>
              <TableColumn>状态</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedRows.includes(department.id)}
                      onValueChange={(checked) =>
                        handleSelectRow(department.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>{department.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{department.name}</span>
                      {department.children_count > 0 && (
                        <Chip color="primary" size="sm" variant="flat">
                          {department.children_count}
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={department.description}>
                      <span className="truncate max-w-[200px] block">
                        {department.description || "-"}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{department.parent_name || "-"}</TableCell>
                  <TableCell>
                    <Chip color="primary" size="sm" variant="flat">
                      {department.children_count}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Switch
                      isReadOnly
                      color="success"
                      isSelected={department.is_active}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(department.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          ⋮
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="edit"
                          onClick={() => openEditModal(department)}
                        >
                          <EditIcon className="w-3 h-3" />
                          编辑
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          onClick={() => handleDelete(department.id)}
                        >
                          <TrashIcon className="w-3 h-3" />
                          删除
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-center mt-4">
            <Pagination
              isCompact
              showControls
              classNames={{
                cursor: "bg-primary-500 text-white",
                item: "text-gray-600",
                prev: "text-gray-600",
                next: "text-gray-600",
              }}
              initialPage={page}
              page={page}
              total={totalPages}
              onChange={setPage}
            />
          </div>
        </div>

        {/* 新增/编辑部门弹窗 */}
        <Modal
          className="mx-4"
          isOpen={showModal}
          placement="center"
          scrollBehavior="inside"
          size="2xl"
          onClose={() => setShowModal(false)}
        >
          <ModalContent className="max-h-[90vh]">
            <ModalHeader>
              {modalMode === "add" ? "新增部门" : "编辑部门"}
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  autoFocus
                  description="最多100个字符"
                  errorMessage={formErrors.name}
                  label="部门名称"
                  maxLength={100}
                  placeholder="请输入部门名称"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <Select
                  aria-label="选择上级部门"
                  errorMessage={formErrors.parent}
                  label="上级部门"
                  selectedKeys={
                    formData.parent ? [formData.parent.toString()] : []
                  }
                  onSelectionChange={(keys) =>
                    setFormData((prev) => ({
                      ...prev,
                      parent: Array.from(keys)[0]
                        ? parseInt(Array.from(keys)[0] as string)
                        : null,
                    }))
                  }
                >
                  <SelectItem
                    key=""
                    aria-label="无上级部门"
                    textValue="无上级部门"
                  >
                    无上级部门
                  </SelectItem>
                  <Fragment>
                    {getParentOptions().map((dept) => (
                      <SelectItem
                        key={dept.id.toString()}
                        aria-label={`上级部门: ${dept.name}`}
                        textValue={dept.name}
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </Fragment>
                </Select>
                <div className="col-span-1 sm:col-span-2">
                  <Input
                    description="最多500个字符"
                    errorMessage={formErrors.description}
                    label="部门描述"
                    maxLength={500}
                    placeholder="请输入部门描述"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <Switch
                    isSelected={formData.is_active}
                    onValueChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  >
                    是否激活
                  </Switch>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="flat"
                onClick={() => setShowModal(false)}
              >
                取消
              </Button>
              <Button color="primary" onClick={handleSave}>
                保存
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 删除确认弹窗 */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          itemName={
            deleteId
              ? `部门："${departments.find((d) => d.id === deleteId)?.name}"`
              : ""
          }
          message="删除后该部门下的用户需要重新分配，相关数据将被永久删除。"
          onClose={handleDeleteModalClose}
          onConfirm={confirmDelete}
        />
      </CardBody>
    </Card>
  );
}
