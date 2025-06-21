import React, { useState, useEffect } from 'react';
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
import { api } from '@/services/api';

interface JobTitle {
  id: number;
  name: string;
  level: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const JOB_LEVELS = [
  { key: '初级', label: '初级' },
  { key: '中级', label: '中级' },
  { key: '副高级', label: '副高级' },
  { key: '正高级', label: '正高级' },
];

export default function JobTitleTab() {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    level: '初级',
    description: '',
    is_active: true,
  });

  const rowsPerPage = 10;

  // 获取职称列表
  const fetchJobTitles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/job-titles/', {
        params: {
          search: search,
          page: page,
          page_size: rowsPerPage,
        }
      });
      setJobTitles(response.results || response);
    } catch (error) {
      console.error('获取职称列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobTitles();
  }, [search, page]);

  // 打开新增弹窗
  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      level: '初级',
      description: '',
      is_active: true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (jobTitle: JobTitle) => {
    setModalMode('edit');
    setEditId(jobTitle.id);
    setFormData({
      name: jobTitle.name,
      level: jobTitle.level,
      description: jobTitle.description,
      is_active: jobTitle.is_active,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 表单验证
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = '职称名称不能为空';
    } else if (formData.name.length > 100) {
      errors.name = '职称名称不能超过100个字符';
    }
    
    if (!formData.level) {
      errors.level = '请选择职称级别';
    }
    
    if (formData.description.length > 500) {
      errors.description = '职称描述不能超过500个字符';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存职称
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === 'add') {
        await api.post('/job-titles/', formData);
      } else if (editId !== null) {
        await api.put(`/job-titles/${editId}/`, formData);
      }
      
      setShowModal(false);
      fetchJobTitles();
    } catch (error: any) {
      console.error('保存职称失败:', error);
      if (error.response?.data) {
        setFormErrors(error.response.data);
      }
    }
  };

  // 删除职称
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await api.delete(`/job-titles/${deleteId}/`);
        setShowDeleteModal(false);
        setDeleteId(null);
        fetchJobTitles();
      } catch (error) {
        console.error('删除职称失败:', error);
      }
    }
  };

  // 批量选择
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(jobTitles.map(title => title.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  // 批量更新状态
  const handleBatchUpdate = async (is_active: boolean) => {
    try {
      await api.post('/job-titles/batch_update/', {
        ids: selectedRows,
        is_active: is_active
      });
      setSelectedRows([]);
      fetchJobTitles();
    } catch (error) {
      console.error('批量更新失败:', error);
    }
  };

  // 获取级别颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case '初级': return 'default';
      case '中级': return 'primary';
      case '副高级': return 'secondary';
      case '正高级': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">职称管理</h2>
          <p className="text-gray-600">在这里管理公司职称体系</p>
          
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
              <Button color="primary" startContent={<PlusIcon className="text-lg" />} onClick={openAddModal}>
                新增职称
              </Button>
              {selectedRows.length > 0 && (
                <Dropdown>
                  <DropdownTrigger>
                    <Button color="secondary">
                      批量操作 ({selectedRows.length})
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem key="activate" onClick={() => handleBatchUpdate(true)}>
                      批量激活
                    </DropdownItem>
                    <DropdownItem key="deactivate" onClick={() => handleBatchUpdate(false)}>
                      批量停用
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>
          </div>

          <Table aria-label="职称管理表格">
            <TableHeader>
              <TableColumn>
                <Checkbox
                  isSelected={selectedRows.length === jobTitles.length}
                  isIndeterminate={selectedRows.length > 0 && selectedRows.length < jobTitles.length}
                  onValueChange={handleSelectAll}
                />
              </TableColumn>
              <TableColumn>ID</TableColumn>
              <TableColumn>职称名称</TableColumn>
              <TableColumn>级别</TableColumn>
              <TableColumn>描述</TableColumn>
              <TableColumn>状态</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {jobTitles.map((jobTitle) => (
                <TableRow key={jobTitle.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedRows.includes(jobTitle.id)}
                      onValueChange={(checked) => handleSelectRow(jobTitle.id, checked)}
                    />
                  </TableCell>
                  <TableCell>{jobTitle.id}</TableCell>
                  <TableCell>
                    <span className="font-medium">{jobTitle.name}</span>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      color={getLevelColor(jobTitle.level) as any}
                      variant="flat"
                    >
                      {jobTitle.level}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={jobTitle.description}>
                      <span className="truncate max-w-[200px] block">
                        {jobTitle.description || '-'}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Switch
                      size="sm"
                      isSelected={jobTitle.is_active}
                      color="success"
                      isReadOnly
                    />
                  </TableCell>
                  <TableCell>{new Date(jobTitle.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          ⋮
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem key="edit" onClick={() => openEditModal(jobTitle)}>
                          <EditIcon className="text-lg" />
                          编辑
                        </DropdownItem>
                        <DropdownItem 
                          key="delete"
                          className="text-danger" 
                          color="danger"
                          onClick={() => handleDelete(jobTitle.id)}
                        >
                          <TrashIcon className="text-lg" />
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
              initialPage={page}
              page={page}
              total={Math.ceil(jobTitles.length / rowsPerPage)}
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
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="2xl">
          <ModalContent>
            <ModalHeader>
              {modalMode === 'add' ? '新增职称' : '编辑职称'}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="职称名称"
                  placeholder="请输入职称名称"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  errorMessage={formErrors.name}
                  maxLength={100}
                  description="最多100个字符"
                  autoFocus
                />
                <Select
                  label="职称级别"
                  selectedKeys={[formData.level]}
                  onSelectionChange={keys => setFormData(prev => ({ 
                    ...prev, 
                    level: Array.from(keys)[0] as string 
                  }))}
                  errorMessage={formErrors.level}
                >
                  {JOB_LEVELS.map(level => (
                    <SelectItem key={level.key}>{level.label}</SelectItem>
                  ))}
                </Select>
                <div className="col-span-2">
                  <Input
                    label="职称描述"
                    placeholder="请输入职称描述"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    errorMessage={formErrors.description}
                    maxLength={500}
                    description="最多500个字符"
                  />
                </div>
                <div className="col-span-2">
                  <Switch
                    isSelected={formData.is_active}
                    onValueChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
                  >
                    是否激活
                  </Switch>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onClick={() => setShowModal(false)}>
                取消
              </Button>
              <Button color="primary" onClick={handleSave}>
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
              确定要删除这个职称吗？此操作不可恢复。
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onClick={() => setShowDeleteModal(false)}>
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