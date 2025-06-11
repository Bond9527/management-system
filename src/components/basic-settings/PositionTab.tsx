import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox, Pagination } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { SearchIcon } from "@/components/icons";

interface Role {
  id: number;
  title: string;
  date: string;
}

const STORAGE_KEY = "positionTabData";

const defaultRoles = [
  { id: 1, title: "技术总监", date: "2020-03-31" },
  { id: 2, title: "运营总监", date: "2020-03-31" },
  { id: 3, title: "市场总监", date: "2020-03-31" },
  { id: 4, title: "研发工程师", date: "2020-03-31" },
  { id: 5, title: "运维工程师", date: "2020-03-31" },
  { id: 6, title: "测试工程师", date: "2022-07-16" },
];

export default function PositionTab() {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>("add");
  const [editId, setEditId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [formErrors, setFormErrors] = useState<{ title?: string; date?: string }>({});
  const rowsPerPage = 10;

  // 读取 localStorage
  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        setRoles(JSON.parse(data));
      } catch {}
    }
  }, []);

  // 写入 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  // 过滤和分页数据
  const filteredRoles = roles.filter(role => 
    role.title.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedRoles = filteredRoles.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // 打开新增弹窗
  const openAddModal = () => {
    setModalMode("add");
    setNewTitle("");
    setNewDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
    setEditId(null);
    setFormErrors({});
  };

  // 打开编辑弹窗
  const openEditModal = (role: { id: number; title: string; date: string }) => {
    setModalMode("edit");
    setEditId(role.id);
    setNewTitle(role.title);
    setNewDate(role.date);
    setShowModal(true);
    setFormErrors({});
  };

  // 表单验证
  const validateForm = () => {
    const errors: { title?: string; date?: string } = {};
    if (!newTitle.trim()) {
      errors.title = "职称名称不能为空";
    } else if (newTitle.length > 50) {
      errors.title = "职称名称不能超过50个字符";
    }
    if (!newDate) {
      errors.date = "日期不能为空";
    } else {
      const selectedDate = new Date(newDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errors.date = "创建日期不能超过今天";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存（新增或编辑）
  const handleSave = () => {
    if (!validateForm()) return;

    if (modalMode === "add") {
      setRoles(prev => [
        ...prev,
        { id: prev.length ? prev[prev.length - 1].id + 1 : 1, title: newTitle.trim(), date: newDate }
      ]);
    } else if (modalMode === "edit" && editId !== null) {
      setRoles(prev => prev.map(r => r.id === editId ? { ...r, title: newTitle.trim(), date: newDate } : r));
    }
    setShowModal(false);
    setNewTitle("");
    setNewDate("");
    setEditId(null);
    setFormErrors({});
  };

  // 处理取消编辑
  const handleCancel = () => {
    setShowModal(false);
    setNewTitle("");
    setNewDate("");
    setEditId(null);
    setFormErrors({});
  };

  // 打开删除弹窗
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // 确认删除
  const handleDelete = () => {
    if (deleteId !== null) {
      setRoles(prev => prev.filter(r => r.id !== deleteId));
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRows.length === 0) return;
    
    // 获取选中的职称名称列表
    const selectedTitles = roles
      .filter(role => selectedRows.includes(role.id))
      .map(role => role.title)
      .join("、");

    setRoles(prev => prev.filter(r => !selectedRows.includes(r.id)));
    setSelectedRows([]);
    setShowDeleteModal(false);
  };

  // 选择所有行
  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedRoles.map(role => role.id) : []);
  };

  // 选择单行
  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedRows(prev => 
      checked ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">职称管理</h2>
          <p className="text-gray-600">在这里管理系统职称和权限分配</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-[284px]">
                <Input
                  placeholder="搜索职称..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  startContent={<SearchIcon className="text-base text-gray-400 pointer-events-none flex-shrink-0" />}
                />
              </div>
              <Button color="primary" startContent={<span className="text-lg">＋</span>} onClick={openAddModal}>新增</Button>
              {selectedRows.length > 0 && (
                <Button 
                  color="danger" 
                  onClick={() => setShowDeleteModal(true)}
                  startContent={<span className="text-lg">×</span>}
                >
                  批量删除
                </Button>
              )}
            </div>
          </div>
          <Table
            aria-label="职称管理表格"
            className="mt-6"
          >
            <TableHeader>
              <TableColumn>
                <Checkbox
                  isSelected={selectedRows.length === paginatedRoles.length}
                  isIndeterminate={selectedRows.length > 0 && selectedRows.length < paginatedRoles.length}
                  onValueChange={handleSelectAll}
                />
              </TableColumn>
              <TableColumn>编号</TableColumn>
              <TableColumn>职位</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedRows.includes(role.id)}
                      onValueChange={(checked) => handleSelectRow(role.id, checked)}
                    />
                  </TableCell>
                  <TableCell>{role.id}</TableCell>
                  <TableCell>{role.title}</TableCell>
                  <TableCell>{role.date}</TableCell>
                  <TableCell>
                    <Button size="sm" color="primary" variant="flat" className="mr-2" onClick={() => openEditModal(role)}>编辑</Button>
                    <Button size="sm" color="danger" variant="flat" onClick={() => openDeleteModal(role.id)}>删除</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-center mt-4">
            <Pagination
              isCompact
              showControls
              initialPage={page}
              page={page}
              total={Math.ceil(filteredRoles.length / rowsPerPage)}
              onChange={setPage}
              classNames={{
                cursor: "bg-primary-500 text-white",
                item: "text-gray-600",
                prev: "text-gray-600",
                next: "text-gray-600",
              }}
            />
          </div>
        </div>

        {/* 新增/编辑职称弹窗 */}
        <Modal 
          isOpen={showModal} 
          onClose={handleCancel}
          size="lg"
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2">
                <span>{modalMode === "add" ? "新增职称" : "编辑职称"}</span>
                {modalMode === "edit" && (
                  <span className="text-sm text-gray-500">(ID: {editId})</span>
                )}
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="职称名称"
                  placeholder="请输入职称名称"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  errorMessage={formErrors.title}
                  maxLength={50}
                  description="最多50个字符"
                  autoFocus
                />
                <Input
                  type="date"
                  label="创建时间"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  errorMessage={formErrors.date}
                  description="不能超过今天"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onClick={handleCancel}>
                取消
              </Button>
              <Button 
                color="primary" 
                onClick={handleSave}
                isDisabled={!newTitle.trim() || !newDate}
              >
                保存
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 删除确认弹窗 */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <ModalContent>
            <ModalHeader>确认删除</ModalHeader>
            <ModalBody>
              {selectedRows.length > 0 ? (
                <div>
                  <p>确定要删除以下职称吗？此操作不可恢复。</p>
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    {roles
                      .filter(role => selectedRows.includes(role.id))
                      .map(role => (
                        <div key={role.id} className="text-sm text-gray-600">
                          {role.title}
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                `确定要删除该职称吗？此操作不可恢复。`
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onClick={() => setShowDeleteModal(false)}>
                取消
              </Button>
              <Button color="danger" onClick={() => {
                if (selectedRows.length > 0) {
                  handleBatchDelete();
                } else if (deleteId !== null) {
                  handleDelete();
                }
              }}>
                确认删除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
} 