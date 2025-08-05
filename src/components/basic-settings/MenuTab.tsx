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
} from "@heroui/react";

import { SearchIcon, PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import { api } from "@/services/api";

interface MenuItem {
  id: number;
  name: string;
  path: string;
  component: string;
  icon: string;
  menu_type: "menu" | "page" | "button";
  order: number;
  is_visible: boolean;
  is_active: boolean;
  parent: number | null;
  parent_name?: string;
  permissions_count: number;
  roles_count: number;
  display_position: "sidebar" | "navbar" | "both";
  children?: MenuItem[];
  created_at: string;
  updated_at: string;
}

const MENU_TYPES = [
  { key: "menu", label: "菜单" },
  { key: "page", label: "页面" },
  { key: "button", label: "按钮" },
];

const DISPLAY_POSITIONS = [
  { key: "sidebar", label: "侧边栏" },
  { key: "navbar", label: "导航栏" },
  { key: "both", label: "侧边栏和导航栏" },
];

const STORAGE_KEY = "menu_management_data";

export default function MenuTab() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
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

  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    component: "",
    icon: "",
    menu_type: "menu" as "menu" | "page" | "button",
    order: 0,
    is_visible: true,
    is_active: true,
    parent: null as number | null,
    display_position: "sidebar" as "sidebar" | "navbar" | "both",
  });

  const rowsPerPage = 10;

  // 获取菜单列表
  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await api.get("/menus/", {
        params: {
          search: search,
        },
      });

      // 现在API直接返回数组，不再是分页响应
      const menuData = Array.isArray(response)
        ? response
        : response?.results || [];

      // 在前端进行过滤和分页
      const filteredMenus = menuData.filter(
        (menu: any) =>
          !search || menu.name.toLowerCase().includes(search.toLowerCase()),
      );

      // 前端分页
      const startIndex = (page - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const paginatedMenus = filteredMenus.slice(startIndex, endIndex);

      setMenus(paginatedMenus);
      setTotalPages(Math.ceil(filteredMenus.length / rowsPerPage));
    } catch (error) {
      console.error("获取菜单列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取父菜单选项
  const getParentOptions = () => {
    return menus.filter(
      (menu) => menu.menu_type === "menu" && menu.id !== editId,
    );
  };

  useEffect(() => {
    fetchMenus();
  }, [search, page]);

  // 打开新增弹窗
  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      name: "",
      path: "",
      component: "",
      icon: "",
      menu_type: "menu",
      order: 0,
      is_visible: true,
      is_active: true,
      parent: null,
      display_position: "sidebar",
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (menu: MenuItem) => {
    setModalMode("edit");
    setEditId(menu.id);
    setFormData({
      name: menu.name,
      path: menu.path,
      component: menu.component,
      icon: menu.icon,
      menu_type: menu.menu_type,
      order: menu.order,
      is_visible: menu.is_visible,
      is_active: menu.is_active,
      parent: menu.parent,
      display_position: menu.display_position,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 表单验证
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "菜单名称不能为空";
    } else if (formData.name.length > 100) {
      errors.name = "菜单名称不能超过100个字符";
    }

    if (formData.menu_type === "page" && !formData.path.trim()) {
      errors.path = "页面类型必须设置路由路径";
    }

    if (formData.order < 0) {
      errors.order = "排序不能为负数";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // 保存菜单
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === "add") {
        await api.post("/menus/", formData);
      } else if (editId !== null) {
        await api.put(`/menus/${editId}/`, formData);
      }

      setShowModal(false);
      fetchMenus();
    } catch (error: any) {
      console.error("保存菜单失败:", error);
      if (error.response?.data) {
        setFormErrors(error.response.data);
      }
    }
  };

  // 删除菜单
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await api.delete(`/menus/${deleteId}/`);
        setShowDeleteModal(false);
        setDeleteId(null);
        fetchMenus();
      } catch (error) {
        console.error("删除菜单失败:", error);
      }
    }
  };

  // 批量选择
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(menus.map((menu) => menu.id));
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
      await api.post("/menus/batch_update/", {
        ids: selectedRows,
        is_active: is_active,
      });
      setSelectedRows([]);
      fetchMenus();
    } catch (error) {
      console.error("批量更新失败:", error);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">菜单管理</h2>
          <p className="text-gray-600">在这里管理系统菜单结构和权限分配</p>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-[284px]">
                <Input
                  placeholder="搜索菜单..."
                  startContent={
                    <SearchIcon className="text-base text-gray-400 pointer-events-none flex-shrink-0" />
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                aria-label="添加新菜单"
                color="primary"
                startContent={<PlusIcon className="text-lg" />}
                onClick={openAddModal}
              >
                添加菜单
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

          <Table aria-label="菜单管理表格">
            <TableHeader>
              <TableColumn>
                <Checkbox
                  isIndeterminate={
                    selectedRows.length > 0 &&
                    selectedRows.length < menus.length
                  }
                  isSelected={selectedRows.length === menus.length}
                  onValueChange={handleSelectAll}
                />
              </TableColumn>
              <TableColumn>ID</TableColumn>
              <TableColumn>菜单名称</TableColumn>
              <TableColumn>路径</TableColumn>
              <TableColumn>类型</TableColumn>
              <TableColumn>父菜单</TableColumn>
              <TableColumn>排序</TableColumn>
              <TableColumn>显示位置</TableColumn>
              <TableColumn>状态</TableColumn>
              <TableColumn>权限/角色</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedRows.includes(menu.id)}
                      onValueChange={(checked) =>
                        handleSelectRow(menu.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>{menu.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{menu.name}</span>
                      {menu.children && menu.children.length > 0 && (
                        <Chip color="primary" size="sm" variant="flat">
                          {menu.children.length}
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={menu.path}>
                      <span className="truncate max-w-[150px] block">
                        {menu.path || "-"}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={
                        menu.menu_type === "menu"
                          ? "primary"
                          : menu.menu_type === "page"
                            ? "success"
                            : "warning"
                      }
                      size="sm"
                    >
                      {MENU_TYPES.find((t) => t.key === menu.menu_type)?.label}
                    </Chip>
                  </TableCell>
                  <TableCell>{menu.parent_name || "-"}</TableCell>
                  <TableCell>{menu.order}</TableCell>
                  <TableCell>
                    {
                      DISPLAY_POSITIONS.find(
                        (p) => p.key === menu.display_position,
                      )?.label
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Switch
                        isReadOnly
                        color="success"
                        isSelected={menu.is_visible}
                        size="sm"
                      />
                      <Switch
                        isReadOnly
                        color="primary"
                        isSelected={menu.is_active}
                        size="sm"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Chip color="primary" size="sm" variant="flat">
                        {menu.permissions_count}
                      </Chip>
                      <Chip color="secondary" size="sm" variant="flat">
                        {menu.roles_count}
                      </Chip>
                    </div>
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
                          onClick={() => openEditModal(menu)}
                        >
                          <EditIcon className="w-3 h-3" />
                          编辑
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          onClick={() => handleDelete(menu.id)}
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

        {/* 新增/编辑菜单弹窗 */}
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
              {modalMode === "add" ? "新增菜单" : "编辑菜单"}
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  autoFocus
                  description="最多100个字符"
                  errorMessage={formErrors.name}
                  label="菜单名称"
                  maxLength={100}
                  placeholder="请输入菜单名称"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <Input
                  description="最多200个字符"
                  errorMessage={formErrors.path}
                  label="路由路径"
                  maxLength={200}
                  placeholder="请输入路由路径"
                  value={formData.path}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, path: e.target.value }))
                  }
                />
                <Input
                  description="最多200个字符"
                  label="组件路径"
                  maxLength={200}
                  placeholder="请输入组件路径"
                  value={formData.component}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      component: e.target.value,
                    }))
                  }
                />
                <Input
                  description="最多100个字符"
                  label="图标"
                  maxLength={100}
                  placeholder="请输入图标名称"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, icon: e.target.value }))
                  }
                />
                <Select
                  aria-label="选择菜单类型"
                  errorMessage={formErrors.menu_type}
                  label="菜单类型"
                  selectedKeys={[formData.menu_type]}
                  onSelectionChange={(keys) =>
                    setFormData((prev) => ({
                      ...prev,
                      menu_type: Array.from(keys)[0] as
                        | "menu"
                        | "page"
                        | "button",
                    }))
                  }
                >
                  {MENU_TYPES.map((type) => (
                    <SelectItem
                      key={type.key}
                      aria-label={`菜单类型: ${type.label}`}
                      textValue={type.label}
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  aria-label="选择显示位置"
                  errorMessage={formErrors.display_position}
                  label="显示位置"
                  selectedKeys={[formData.display_position]}
                  onSelectionChange={(keys) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_position: Array.from(keys)[0] as
                        | "sidebar"
                        | "navbar"
                        | "both",
                    }))
                  }
                >
                  {DISPLAY_POSITIONS.map((position) => (
                    <SelectItem
                      key={position.key}
                      aria-label={`显示位置: ${position.label}`}
                      textValue={position.label}
                    >
                      {position.label}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  aria-label="选择上级菜单"
                  errorMessage={formErrors.parent}
                  label="上级菜单"
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
                    aria-label="无上级菜单"
                    textValue="无上级菜单"
                  >
                    无上级菜单
                  </SelectItem>
                  <Fragment>
                    {getParentOptions().map((menu) => (
                      <SelectItem
                        key={menu.id.toString()}
                        aria-label={`上级菜单: ${menu.name}`}
                        textValue={menu.name}
                      >
                        {menu.name}
                      </SelectItem>
                    ))}
                  </Fragment>
                </Select>
                <Input
                  description="数字越小排序越靠前"
                  errorMessage={formErrors.order}
                  label="排序"
                  type="number"
                  value={formData.order.toString()}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <div className="flex flex-wrap gap-4 items-center">
                  <Switch
                    isSelected={formData.is_visible}
                    onValueChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_visible: checked }))
                    }
                  >
                    是否可见
                  </Switch>
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
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        >
          <ModalContent>
            <ModalHeader>确认删除</ModalHeader>
            <ModalBody>确定要删除这个菜单吗？此操作不可恢复。</ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="flat"
                onClick={() => setShowDeleteModal(false)}
              >
                取消
              </Button>
              <Button color="danger" onClick={confirmDelete}>
                确认删除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
}
