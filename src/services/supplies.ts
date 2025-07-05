import { apiRequest } from './api';

export interface SupplyItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  unit_price: string; // Django返回的是字符串格式的decimal
  
  // 新增固定基础数据字段
  purchaser: string;
  min_order_quantity: number;
  lead_time_days: number;
  standard_usage_count: number;
  usage_per_machine: number;
  usage_station: string;
  
  // 库存相关字段 - 这些是变动数据
  current_stock: number;
  safety_stock: number;
  max_stock: number;
  min_stock: number;
  
  // 时间戳
  created_at: string;
  updated_at: string;
}

export interface InventoryRecord {
  id: number;
  type: "in" | "out" | "adjust";
  supply: number; // 外键ID
  supply_name?: string; // 序列化器添加的字段
  supply_category?: string;
  supply_unit?: string;
  quantity: number;
  operator: string;
  department: string;
  timestamp: string;
  remark: string;
  previous_stock: number;
  new_stock: number;
  type_display?: string; // 序列化器添加的字段
}

export interface CreateSupplyRequest {
  name: string;
  category: string;
  unit: string;
  unit_price: string;
  
  // 可选的基础数据字段
  purchaser?: string;
  min_order_quantity?: number;
  lead_time_days?: number;
  standard_usage_count?: number;
  usage_per_machine?: number;
  usage_station?: string;
  
  // 库存相关字段
  current_stock: number;
  safety_stock: number;
  max_stock?: number;
  min_stock?: number;
}

export interface UpdateSupplyRequest extends CreateSupplyRequest {
  id: number;
}

export interface AdjustStockRequest {
  supply_id: number;
  type: "in" | "out" | "adjust";
  quantity: number;
  unit_price?: number;
  remark?: string;
}

export interface StatisticsResponse {
  total_supplies: number;
  low_stock_count: number;
  total_value: number;
  category_stats: Record<string, {
    count: number;
    total_stock: number;
    total_value: number;
  }>;
  recent_records: InventoryRecord[];
}

// 耗材管理API
export const suppliesApi = {
  // 获取所有耗材
  getSupplies: async (params?: {
    category?: string;
    search?: string;
  }): Promise<SupplyItem[]> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/supplies/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiRequest<SupplyItem[]>(url);
    
    // 直接返回耗材数组（因为已经关闭了分页）
    return response;
  },

  // 获取单个耗材详情
  getSupply: async (id: number): Promise<SupplyItem> => {
    return apiRequest<SupplyItem>(`/supplies/${id}/`);
  },

  // 创建耗材
  createSupply: async (data: CreateSupplyRequest): Promise<SupplyItem> => {
    return apiRequest<SupplyItem>('/supplies/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新耗材
  updateSupply: async (data: UpdateSupplyRequest): Promise<SupplyItem> => {
    return apiRequest<SupplyItem>(`/supplies/${data.id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除耗材
  deleteSupply: async (id: number): Promise<void> => {
    return apiRequest<void>(`/supplies/${id}/`, {
      method: 'DELETE',
    });
  },

  // 库存调整
  adjustStock: async (data: AdjustStockRequest): Promise<{
    message: string;
    record: InventoryRecord;
  }> => {
    return apiRequest<{
      message: string;
      record: InventoryRecord;
    }>('/adjust-stock/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// 库存记录API
export const recordsApi = {
  // 获取所有记录
  getRecords: async (params?: {
    supply_id?: number;
    type?: string;
  }): Promise<InventoryRecord[]> => {
    const queryParams = new URLSearchParams();
    if (params?.supply_id) queryParams.append('supply_id', params.supply_id.toString());
    if (params?.type) queryParams.append('type', params.type);
    
    const url = `/inventory-records/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiRequest<InventoryRecord[]>(url);
    
    // 直接返回记录数组（因为已经关闭了分页）
    return response;
  },

  // 获取单个记录
  getRecord: async (id: number): Promise<InventoryRecord> => {
    return apiRequest<InventoryRecord>(`/inventory-records/${id}/`);
  },
};

// 统计API
export const statisticsApi = {
  // 获取统计信息
  getStatistics: async (): Promise<StatisticsResponse> => {
    return apiRequest<StatisticsResponse>('/statistics/');
  },
}; 