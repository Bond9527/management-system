import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox, Pagination, Select, SelectItem, Switch } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { SearchIcon } from "@/components/icons";

const STORAGE_KEY = "jobTitleTabData";

interface JobTitle {
  id: number;
  title: string;
  level: string;
  date: string;
  enabled: boolean;
}

const defaultJobTitles: JobTitle[] = [
  { id: 1, title: "教授", level: "正高级", date: "2024-03-20", enabled: true },
  { id: 2, title: "副教授", level: "副高级", date: "2024-03-20", enabled: true },
  { id: 3, title: "讲师", level: "中级", date: "2024-03-20", enabled: true },
  { id: 4, title: "助教", level: "初级", date: "2024-03-20", enabled: true },
  { id: 5, title: "研究员", level: "正高级", date: "2024-03-20", enabled: true },
  { id: 6, title: "副研究员", level: "副高级", date: "2024-03-20", enabled: true },
  { id: 7, title: "助理研究员", level: "中级", date: "2024-03-20", enabled: true },
  { id: 8, title: "高级工程师", level: "副高级", date: "2024-03-20", enabled: true },
  { id: 9, title: "工程师", level: "中级", date: "2024-03-20", enabled: true },
  { id: 10, title: "助理工程师", level: "初级", date: "2024-03-20", enabled: true },
];

export default function JobTitleTab() {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>(defaultJobTitles);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [formErrors, setFormErrors] = useState<{ title?: string; level?: string; date?: string }>({});
  const rowsPerPage = 10;

  // 获取所有职称等级选项
  const levelOptions = Array.from(new Set(jobTitles.map(jt => jt.level)));

  // 读取 localStorage
  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        setJobTitles(JSON.parse(data));
      } catch {}
    }
  }, []);

  // 写入 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobTitles));
  }, [jobTitles]);

  // 过滤职称列表
  const filteredJobTitles = jobTitles.filter(jobTitle => {
    const matchesSearch = jobTitle.title.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = selectedLevel === "" || jobTitle.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const paginatedJobTitles = filteredJobTitles.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // 打开新增弹窗
  const openAddModal = () => {
    setModalMode("add");
    setNewTitle("");
    setNewLevel("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setFormErrors({});
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (jobTitle: JobTitle) => {
    setModalMode("edit");
    setEditId(jobTitle.id);
    setNewTitle(jobTitle.title);
    setNewLevel(jobTitle.level);
    setNewDate(jobTitle.date);
    setFormErrors({});
    setShowModal(true);
  };

  // 表单验证
  const validateForm = () => {
    const errors: { title?: string; level?: string; date?: string } = {};
    if (!newTitle.trim()) {
      errors.title = "职称名称不能为空";
    } else if (newTitle.length > 50) {
      errors.title = "职称名称不能超过50个字符";
    }
    if (!newLevel.trim()) {
      errors.level = "职称等级不能为空";
    }
    if (!newDate) {
      errors.date = "请选择创建时间";
    } else if (new Date(newDate) > new Date()) {
      errors.date = "创建时间不能超过今天";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存（新增或编辑）
  const handleSave = () => {
    if (!validateForm()) return;

    if (modalMode === "add") {
      const newJobTitle: JobTitle = {
        id: Math.max(...jobTitles.map(jt => jt.id)) + 1,
        title: newTitle.trim(),
        level: newLevel.trim(),
        date: newDate,
        enabled: true,
      };
      setJobTitles(prev => [...prev, newJobTitle]);
    } else if (editId !== null) {
      setJobTitles(prev =>
        prev.map(jobTitle =>
          jobTitle.id === editId
            ? { ...jobTitle, title: newTitle.trim(), level: newLevel.trim(), date: newDate }
            : jobTitle
        )
      );
    }

    setShowModal(false);
  };

  // 处理取消编辑
  const handleCancel = () => {
    setShowModal(false);
    setNewTitle("");
    setNewLevel("");
    setNewDate("");
    setEditId(null);
    setFormErrors({});
  };

  // 打开删除弹窗
  const openDeleteModal = (id: number) => {
    setEditId(id);
    setShowDeleteModal(true);
  };

  // 确认删除
  const handleDelete = () => {
    if (editId === null) return;
    setJobTitles(prev => prev.filter(jobTitle => jobTitle.id !== editId));
    setShowDeleteModal(false);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRows.length === 0) return;
    
    // 获取选中的职称名称列表
    const selectedTitles = jobTitles
      .filter(jobTitle => selectedRows.includes(jobTitle.id))
      .map(jobTitle => jobTitle.title)
      .join("、");

    setJobTitles(prev => prev.filter(jt => !selectedRows.includes(jt.id)));
    setSelectedRows([]);
    setShowDeleteModal(false);
  };

  // 选择所有行
  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedJobTitles.map(jobTitle => jobTitle.id) : []);
  };

  // 选择单行
  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedRows(prev => 
      checked ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  // 切换启用状态
  const toggleEnabled = (id: number) => {
    setJobTitles(prev =>
      prev.map(jobTitle =>
        jobTitle.id === id
          ? { ...jobTitle, enabled: !jobTitle.enabled }
          : jobTitle
      )
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
              <Select
                placeholder="职称等级"
                selectedKeys={selectedLevel ? [selectedLevel] : []}
                onSelectionChange={keys => setSelectedLevel(Array.from(keys)[0] as string)}
                className="w-[120px]"
              >
                {[
                  <SelectItem key="">全部</SelectItem>,
                  ...levelOptions.map(level => (
                    <SelectItem key={level}>
                      {level}
                    </SelectItem>
                  ))
                ]}
              </Select>
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
                  isSelected={selectedRows.length === paginatedJobTitles.length}
                  isIndeterminate={selectedRows.length > 0 && selectedRows.length < paginatedJobTitles.length}
                  onValueChange={handleSelectAll}
                />
              </TableColumn>
              <TableColumn>编号</TableColumn>
              <TableColumn>职称</TableColumn>
              <TableColumn>职称等级</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>是否启用</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedJobTitles.map((jobTitle) => (
                <TableRow key={jobTitle.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedRows.includes(jobTitle.id)}
                      onValueChange={(checked) => handleSelectRow(jobTitle.id, checked)}
                    />
                  </TableCell>
                  <TableCell>{jobTitle.id}</TableCell>
                  <TableCell>{jobTitle.title}</TableCell>
                  <TableCell>{jobTitle.level}</TableCell>
                  <TableCell>{jobTitle.date}</TableCell>
                  <TableCell>
                    <Switch
                      isSelected={jobTitle.enabled}
                      onValueChange={() => toggleEnabled(jobTitle.id)}
                      color="success"
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" color="primary" variant="flat" className="mr-2" onClick={() => openEditModal(jobTitle)}>编辑</Button>
                    <Button size="sm" color="danger" variant="flat" onClick={() => openDeleteModal(jobTitle.id)}>删除</Button>
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
              total={Math.ceil(filteredJobTitles.length / rowsPerPage)}
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
                  label="职称等级"
                  placeholder="请输入职称等级"
                  value={newLevel}
                  onChange={e => setNewLevel(e.target.value)}
                  errorMessage={formErrors.level}
                  maxLength={20}
                  description="最多20个字符"
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
                isDisabled={!newTitle.trim() || !newLevel.trim() || !newDate}
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
                    {jobTitles
                      .filter(jobTitle => selectedRows.includes(jobTitle.id))
                      .map(jobTitle => (
                        <div key={jobTitle.id} className="text-sm text-gray-600">
                          {jobTitle.title}（{jobTitle.level}）
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
                } else if (editId !== null) {
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