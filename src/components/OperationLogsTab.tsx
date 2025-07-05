import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  Select,
  SelectItem,
  Pagination,
  Spinner,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Code,
  Divider,
  useDisclosure,
} from '@heroui/react';
import { 
  MagnifyingGlassIcon as SearchIcon, 
  AdjustmentsHorizontalIcon as FilterIcon, 
  EyeIcon,
  ClockIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { addToast } from "@heroui/toast";

// 模拟数据
const mockLogs = [
  {
    id: 1,
    operation_type: 'login',
    operation_type_display: '登录',
    description: '用户成功登录系统',
    status_code: 200,
    execution_time: 0.15,
    created_at: new Date().toISOString(),
    ip_address: '192.168.1.100'
  },
  {
    id: 2,
    operation_type: 'view',
    operation_type_display: '查看',
    description: '查看用户信息',
    status_code: 200,
    execution_time: 0.08,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    ip_address: '192.168.1.100'
  },
  {
    id: 3,
    operation_type: 'update',
    operation_type_display: '更新',
    description: '更新用户个人资料',
    status_code: 200,
    execution_time: 0.25,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    ip_address: '192.168.1.100'
  }
];

// 简化的操作日志接口
interface SimpleOperationLog {
  id: number;
  operation_type: string;
  operation_type_display: string;
  description: string;
  status_code: number;
  execution_time: number;
  created_at: string;
  ip_address: string;
}

export default function OperationLogsTab() {
  const [logs, setLogs] = useState<SimpleOperationLog[]>(mockLogs);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SimpleOperationLog | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 10;
  
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  // 简化的操作类型颜色
  const getOperationTypeColor = (operationType: string): string => {
    switch (operationType) {
      case 'create': return 'success';
      case 'update': return 'warning';
      case 'delete': return 'danger';
      case 'view': return 'primary';
      case 'login': return 'secondary';
      case 'logout': return 'default';
      default: return 'default';
    }
  };

  // 简化的状态码颜色
  const getStatusCodeColor = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400) return 'danger';
    return 'warning';
  };

  // 格式化时间
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60 * 1000) {
      return '刚刚';
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    } else {
      return date.toLocaleString('zh-CN');
    }
  };

  // 查看日志详情
  const viewLogDetail = (log: SimpleOperationLog) => {
    setSelectedLog(log);
    onDetailOpen();
  };

  // 渲染表格单元格
  const renderCell = (log: SimpleOperationLog, columnKey: string) => {
    switch (columnKey) {
      case 'operation_type':
        return (
          <Chip
            color={getOperationTypeColor(log.operation_type) as any}
            variant="flat"
            size="sm"
          >
            {log.operation_type_display}
          </Chip>
        );
      case 'description':
        return (
          <div className="max-w-xs">
            <p className="truncate" title={log.description}>
              {log.description}
            </p>
          </div>
        );
      case 'status_code':
        return (
          <Chip
            color={getStatusCodeColor(log.status_code) as any}
            variant="flat"
            size="sm"
          >
            {log.status_code}
          </Chip>
        );
      case 'execution_time':
        return (
          <span className="text-sm text-default-500">
            {log.execution_time < 1 ? `${Math.round(log.execution_time * 1000)}ms` : `${log.execution_time.toFixed(2)}s`}
          </span>
        );
      case 'created_at':
        return (
          <div className="text-sm">
            <p>{formatTime(log.created_at)}</p>
          </div>
        );
      case 'ip_address':
        return (
          <div className="flex items-center gap-1 text-sm text-default-500">
            <GlobeAltIcon className="w-3 h-3" />
            {log.ip_address}
          </div>
        );
      case 'actions':
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="查看详情">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => viewLogDetail(log)}
              >
                <EyeIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return String(log[columnKey as keyof SimpleOperationLog] || '');
    }
  };

  // 使用模拟数据
  useEffect(() => {
    // 模拟加载延迟
    setLoading(true);
    setTimeout(() => {
      setLogs(mockLogs);
      setTotalPages(1);
      setLoading(false);
    }, 500);
  }, [page]);

  const handleSuccess = (message: string) => {
    addToast({
      title: "成功",
      description: message,
      color: "success",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      ),
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    });
  };

  return (
    <div className="mt-6 space-y-6">
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">总操作数</p>
                <p className="text-xl font-semibold">{logs.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <ClockIcon className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">最近操作</p>
                <p className="text-sm font-medium">
                  {logs.length > 0 ? formatTime(logs[0].created_at) : '暂无记录'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <ComputerDesktopIcon className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">最常用操作</p>
                <p className="text-sm font-medium">查看操作</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 操作日志表格 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">操作日志</h3>
          <p className="text-sm text-default-500">查看您的操作历史记录</p>
        </CardHeader>
        
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-default-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-default-300" />
              <p>暂无操作日志</p>
              <p className="text-sm">您的操作记录将在这里显示</p>
            </div>
          ) : (
            <Table
              aria-label="操作日志表格"
              className="min-h-[400px]"
            >
              <TableHeader>
                <TableColumn key="operation_type">操作类型</TableColumn>
                <TableColumn key="description">操作描述</TableColumn>
                <TableColumn key="status_code">状态</TableColumn>
                <TableColumn key="execution_time">执行时间</TableColumn>
                <TableColumn key="ip_address">IP地址</TableColumn>
                <TableColumn key="created_at">操作时间</TableColumn>
                <TableColumn key="actions">操作</TableColumn>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    {['operation_type', 'description', 'status_code', 'execution_time', 'ip_address', 'created_at', 'actions'].map((columnKey) => (
                      <TableCell key={columnKey}>
                        {renderCell(log, columnKey)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* 日志详情弹窗 */}
      <Modal 
        isOpen={isDetailOpen} 
        onClose={onDetailClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3>操作日志详情</h3>
            {selectedLog && (
              <p className="text-sm text-default-500">
                {selectedLog.description}
              </p>
            )}
          </ModalHeader>
          <ModalBody>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-default-600">操作类型</p>
                    <Chip
                      color={getOperationTypeColor(selectedLog.operation_type) as any}
                      variant="flat"
                      size="sm"
                    >
                      {selectedLog.operation_type_display}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600">状态码</p>
                    <Chip
                      color={getStatusCodeColor(selectedLog.status_code) as any}
                      variant="flat"
                      size="sm"
                    >
                      {selectedLog.status_code}
                    </Chip>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-default-600">执行时间</p>
                    <p className="text-sm">
                      {selectedLog.execution_time < 1 ? `${Math.round(selectedLog.execution_time * 1000)}ms` : `${selectedLog.execution_time.toFixed(2)}s`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600">操作时间</p>
                    <p className="text-sm">{new Date(selectedLog.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-default-600">IP地址</p>
                    <p className="text-sm">{selectedLog.ip_address}</p>
                  </div>
                </div>
                
                <Divider />
                
                <div>
                  <p className="text-sm font-medium text-default-600 mb-2">操作描述</p>
                  <p className="text-sm p-3 bg-default-100 rounded-lg">{selectedLog.description}</p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDetailClose}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 