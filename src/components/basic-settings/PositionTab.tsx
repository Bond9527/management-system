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

interface Position {
  id: number;
  name: string;
  description: string;
  department: number;
  department_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
}

export default function PositionTab() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
    description: '',
    department: null as number | null,
    is_active: true,
  });

  const rowsPerPage = 10;

  // 获取职位列表
  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/positions/', {
        params: {
          search: search,
          page: page,
          page_size: rowsPerPage,
        }
      });
      setPositions(response.data.results || response.data);
    } catch (error) {
      console.error('获取职位列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments/');
      setDepartments(response.data.results || response.data);
    } catch (error) {
      console.error('获取部门列表失败:', error);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
  }, [search, page]);

  // 打开新增弹窗
  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      description: '',
      department: null,
      is_active: true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (position: Position) => {
    setModalMode('edit');
    setEditId(position.id);
    setFormData({
      name: position.name,
      description: position.description,
      department: position.department,
      is_active: position.is_active,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // 表单验证
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = '职位名称不能为空';
    } else if (formData.name.length > 100) {
      errors.name = '职位名称不能超过100个字符';
    }
    
    if (!formData.department) {
      errors.department = '请选择所属部门';
    }
    
    if (formData.description.length > 500) {
      errors.description = '职位描述不能超过500个字符';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存职位
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === 'add') {
        await api.post('/positions/', formData);
      } else if (editId !== null) {
        await api.put(`/positions/${editId}/`, formData);
      }
      
      setShowModal(false);
      fetchPositions();
    } catch (error: any) {
      console.error('保存职位失败:', error);
      if (error.response?.data) {
        setFormErrors(error.response.data);
      }
    }
  };

  // 删除职位
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await api.delete(`/positions/${deleteId}/`);
        setShowDeleteModal(false);
        setDeleteId(null);
        fetchPositions();
      } catch (error) {
        console.error('删除职位失败:', error);
      }
    }
  };

  // 批量选择
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(positions.map(pos => pos.id));
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
      await api.post('/positions/batch_update/', {
        ids: selectedRows,
        is_active: is_active
      });
      setSelectedRows([]);
      fetchPositions();
    } catch (error) {
      console.error('批量更新失败:', error);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">职位管理</h2>
          <p className="text-gray-600">在这里管理公司职位信息</p>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-[284px]">
                <Input
                  placeholder="搜索职位..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  startContent={<SearchIcon className="text-base text-gray-400 pointer-events-none flex-shrink-0" />}
                />
              </div>
              <Button color="primary" startContent={<PlusIcon className="text-lg" />} onClick={openAddModal}>
                新增职位
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

          <Table aria-label="职位管理表格">
            <TableHeader>
              <TableColumn>
                <Checkbox
                  isSelected={selectedRows.length === positions.length}
                  isIndeterminate={selectedRows.length > 0 && selectedRows.length < positions.length}
                  onValueChange={handleSelectAll}
                />
              </TableColumn>
              <TableColumn>ID</TableColumn>
              <TableColumn>职位名称</TableColumn>
              <TableColumn>描述</TableColumn>
              <TableColumn>所属部门</TableColumn>
              <TableColumn>状态</TableColumn>
              <TableColumn>创建时间</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedRows.includes(position.id)}
                      onValueChange={(checked) => handleSelectRow(position.id, checked)}
                    />
                  </TableCell>
                  <TableCell>{position.id}</TableCell>
                  <TableCell>
                    <span className="font-medium">{position.name}</span>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={position.description}>
                      <span className="truncate max-w-[200px] block">
                        {position.description || '-'}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color="primary" variant="flat">
                      {position.department_name}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Switch
                      size="sm"
                      isSelected={position.is_active}
                      color="success"
                      isReadOnly
                    />
                  </TableCell>
                  <TableCell>{new Date(position.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          ⋮
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem key="edit" onClick={() => openEditModal(position)}>
                          <EditIcon className="text-lg" />
                          编辑
                        </DropdownItem>
                        <DropdownItem 
                          key="delete"
                          className="text-danger" 
                          color="danger"
                          onClick={() => handleDelete(position.id)}
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
              total={Math.ceil(positions.length / rowsPerPage)}
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

        {/* 新增/编辑职位弹窗 */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="2xl">
          <ModalContent>
            <ModalHeader>
              {modalMode === 'add' ? '新增职位' : '编辑职位'}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="职位名称"
                  placeholder="请输入职位名称"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  errorMessage={formErrors.name}
                  maxLength={100}
                  description="最多100个字符"
                  autoFocus
                />
                <Select
                  label="所属部门"
                  selectedKeys={formData.department ? [formData.department.toString()] : []}
                  onSelectionChange={keys => setFormData(prev => ({ 
                    ...prev, 
                    department: Array.from(keys)[0] ? parseInt(Array.from(keys)[0] as string) : null 
                  }))}
                  errorMessage={formErrors.department}
                >
                  {departments.map(dept => (
                    <SelectItem key={dept.id.toString()}>{dept.name}</SelectItem>
                  ))}
                </Select>
                <div className="col-span-2">
                  <Input
                    label="职位描述"
                    placeholder="请输入职位描述"
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
              确定要删除这个职位吗？此操作不可恢复。
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