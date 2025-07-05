import { api } from './api';

export interface OperationLog {
  id: number;
  user: number;
  user_username: string;
  operation_type: string;
  operation_type_display: string;
  model_name: string;
  object_id: string;
  description: string;
  ip_address: string;
  user_agent: string;
  request_data: any;
  response_data: any;
  status_code: number;
  execution_time: number;
  created_at: string;
}

export interface OperationLogParams {
  page?: number;
  page_size?: number;
  operation_type?: string;
  model_name?: string;
  user?: number;
  status_code?: number;
  search?: string;
  created_at_after?: string;
  created_at_before?: string;
}

export interface OperationLogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: OperationLog[];
}

export interface OperationLogStatistics {
  total_operations: number;
  operations_today: number;
  operations_by_type: {
    [key: string]: number;
  };
  operations_by_model: {
    [key: string]: number;
  };
  recent_activities: OperationLog[];
}

// 获取操作日志列表
export const getOperationLogs = async (params?: OperationLogParams): Promise<OperationLogResponse> => {
  const response = await api.get('/accounts/logs/', { params });
  return response;
};

// 获取当前用户的操作日志
export const getUserOperationLogs = async (params?: OperationLogParams): Promise<OperationLogResponse> => {
  const response = await api.get('/accounts/logs/', { 
    params: { ...params, user: 'me' }
  });
  return response;
};

// 获取操作日志统计信息
export const getOperationLogStatistics = async (): Promise<OperationLogStatistics> => {
  const response = await api.get('/accounts/logs/statistics/');
  return response;
};

// 导出操作日志
export const exportOperationLogs = async (params?: OperationLogParams) => {
  const response = await api.get('/accounts/logs/export/', { 
    params
  });
  return response;
};

// 操作类型选项
export const OPERATION_TYPES = [
  { key: 'create', label: '创建' },
  { key: 'update', label: '更新' },
  { key: 'delete', label: '删除' },
  { key: 'view', label: '查看' },
  { key: 'login', label: '登录' },
  { key: 'logout', label: '登出' },
  { key: 'export', label: '导出' },
  { key: 'import', label: '导入' },
];

// 模型名称选项
export const MODEL_NAMES = [
  { key: 'User', label: '用户' },
  { key: 'UserProfile', label: '用户资料' },
  { key: 'Department', label: '部门' },
  { key: 'JobTitle', label: '职称' },
  { key: 'Menu', label: '菜单' },
  { key: 'Permission', label: '权限' },
  { key: 'Supply', label: '耗材' },
  { key: 'Inventory', label: '库存' },
];

// 状态码颜色映射
export const getStatusCodeColor = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 300 && statusCode < 400) return 'warning';
  if (statusCode >= 400 && statusCode < 500) return 'danger';
  if (statusCode >= 500) return 'danger';
  return 'default';
};

// 操作类型颜色映射
export const getOperationTypeColor = (operationType: string): string => {
  switch (operationType) {
    case 'create': return 'success';
    case 'update': return 'warning';
    case 'delete': return 'danger';
    case 'view': return 'primary';
    case 'login': return 'secondary';
    case 'logout': return 'default';
    case 'export': return 'primary';
    case 'import': return 'secondary';
    default: return 'default';
  }
};

// 格式化执行时间
export const formatExecutionTime = (time: number): string => {
  if (time < 1) return `${Math.round(time * 1000)}ms`;
  return `${time.toFixed(2)}s`;
};

// 格式化日期
export const formatLogDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }
  
  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}小时前`;
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}天前`;
  }
  
  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 