import { apiRequest } from './api';

// ================================
// 🆕 B482耗材管控申请表接口
// ================================

export interface B482SupplyItem {
  id?: number;
  serial_number: number;
  material_description: string;
  unit: string;
  purchaser: string;
  unit_price: string | number;
  max_safety_stock: number;
  min_safety_stock: number;
  moq: number;
  unpurchased_amount: string | number;
  lead_time: number;
  june_2025: number;
  july_2025: number;
  july_m1: number;
  july_m2: number;
  july_m3: number;
  july_m4: number;
  remark: string;
  usage_per_set: number;
  usage_count: number;
  monthly_capacity: number;
  enable_auto_calculation: boolean;
  created_at?: string;
  updated_at?: string;
}

// ================================
// 🆕 Andor耗材需求计算表接口
// ================================

export interface AndorSupplyItem {
  id?: number;
  month: string;
  no: number;
  material_name: string;
  usage_station: string;
  usage_per_set: number;
  usage_count: number;
  monthly_capacity: number;
  min_inventory: number;
  max_inventory: number;
  monthly_demand: number;
  remark: string;
  created_at?: string;
  updated_at?: string;
}

// ================================
// 🆕 产能预测数据接口
// ================================

export interface CapacityForecast {
  id?: number;
  name: string;
  max_capacity: number;
  min_capacity: number;
  apr_24: number;
  may_25: number;
  jun_25: number;
  jul_25: number;
  created_at?: string;
  updated_at?: string;
}

// ================================
// 🆕 B453 SMT ATE耗材管控表接口
// ================================

export interface B453SupplyItem {
  id?: number;
  serial_number: number;
  material_description: string;
  unit: string;
  purchaser: string;
  unit_price: string | number;
  min_safety_stock: number;
  max_safety_stock: number;
  moq: number;
  lead_time_weeks: number;
  apr_2025_stock: number;
  may_2025_demand: number;
  may_2025_stock: number;
  jun_2025_demand: number;
  jun_2025_stock: number;
  jul_2025_demand: number;
  jul_2025_stock: number;
  aug_2025_demand: number;
  remark: string;
  calculation_id?: number;
  has_calculation: boolean;
  created_at?: string;
  updated_at?: string;
}

// ================================
// 🆕 B453耗材需求计算表接口
// ================================

export interface B453CalculationItem {
  id?: number;
  no: number;
  material_name: string;
  usage_station: string;
  usage_per_set: number;
  usage_count: number;
  monthly_capacity: number;
  min_stock: number;
  max_stock: number;
  monthly_demand: number;
  monthly_net_demand: number;
  actual_order: number;
  moq_remark: string;
  management_id?: number;
  linked_material: string;
  unit_price?: string | number;
  moq?: number;
  created_at?: string;
  updated_at?: string;
}

// ================================
// 🆕 B453产能预测数据接口
// ================================

export interface B453ForecastData {
  id?: number;
  name: string;
  mar_24: number;
  oct_24: number;
  dec_24: number;
  jan_25: number;
  feb_25: number;
  mar_25: number;
  apr_25: number;
  may_25: number;
  jun_25: number;
  jul_25: number;
  created_at?: string;
  updated_at?: string;
}

// ================================
// 🆕 统一计算引擎接口
// ================================

export interface CalculationParams {
  monthly_capacity: number;
  usage_per_set: number;
  usage_count: number;
  max_capacity?: number;
  min_capacity?: number;
  current_stock?: number;
  unit_price?: number;
}

export interface CalculationResult {
  monthly_demand: number;
  max_inventory?: number;
  min_inventory?: number;
  net_demand?: number;
  demand_value?: number;
}

// ================================
// 🆕 API服务类
// ================================

export const materialManagementApi = {
  // B482耗材管控申请表API
  b482: {
    getAll: async (params?: { search?: string }): Promise<B482SupplyItem[]> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      const url = `/b482-supplies/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return apiRequest<B482SupplyItem[]>(url);
    },

    get: async (id: number): Promise<B482SupplyItem> => {
      return apiRequest<B482SupplyItem>(`/b482-supplies/${id}/`);
    },

    create: async (data: Omit<B482SupplyItem, 'id' | 'created_at' | 'updated_at'>): Promise<B482SupplyItem> => {
      return apiRequest<B482SupplyItem>('/b482-supplies/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: number, data: Partial<B482SupplyItem>): Promise<B482SupplyItem> => {
      return apiRequest<B482SupplyItem>(`/b482-supplies/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/b482-supplies/${id}/`, {
        method: 'DELETE',
      });
    },
  },

  // Andor耗材需求计算表API
  andor: {
    getAll: async (params?: { month?: string; usage_station?: string }): Promise<AndorSupplyItem[]> => {
      const queryParams = new URLSearchParams();
      if (params?.month) queryParams.append('month', params.month);
      if (params?.usage_station) queryParams.append('usage_station', params.usage_station);
      const url = `/andor-supplies/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return apiRequest<AndorSupplyItem[]>(url);
    },

    get: async (id: number): Promise<AndorSupplyItem> => {
      return apiRequest<AndorSupplyItem>(`/andor-supplies/${id}/`);
    },

    create: async (data: Omit<AndorSupplyItem, 'id' | 'created_at' | 'updated_at'>): Promise<AndorSupplyItem> => {
      return apiRequest<AndorSupplyItem>('/andor-supplies/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: number, data: Partial<AndorSupplyItem>): Promise<AndorSupplyItem> => {
      return apiRequest<AndorSupplyItem>(`/andor-supplies/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/andor-supplies/${id}/`, {
        method: 'DELETE',
      });
    },
  },

  // 产能预测数据API
  capacityForecast: {
    getAll: async (): Promise<CapacityForecast[]> => {
      return apiRequest<CapacityForecast[]>('/capacity-forecasts/');
    },

    get: async (id: number): Promise<CapacityForecast> => {
      return apiRequest<CapacityForecast>(`/capacity-forecasts/${id}/`);
    },

    create: async (data: Omit<CapacityForecast, 'id' | 'created_at' | 'updated_at'>): Promise<CapacityForecast> => {
      return apiRequest<CapacityForecast>('/capacity-forecasts/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: number, data: Partial<CapacityForecast>): Promise<CapacityForecast> => {
      return apiRequest<CapacityForecast>(`/capacity-forecasts/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/capacity-forecasts/${id}/`, {
        method: 'DELETE',
      });
    },
  },

  // B453 SMT ATE耗材管控表API
  b453: {
    getAll: async (params?: { search?: string }): Promise<B453SupplyItem[]> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      const url = `/b453-supplies/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return apiRequest<B453SupplyItem[]>(url);
    },

    get: async (id: number): Promise<B453SupplyItem> => {
      return apiRequest<B453SupplyItem>(`/b453-supplies/${id}/`);
    },

    create: async (data: Omit<B453SupplyItem, 'id' | 'created_at' | 'updated_at'>): Promise<B453SupplyItem> => {
      return apiRequest<B453SupplyItem>('/b453-supplies/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: number, data: Partial<B453SupplyItem>): Promise<B453SupplyItem> => {
      return apiRequest<B453SupplyItem>(`/b453-supplies/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/b453-supplies/${id}/`, {
        method: 'DELETE',
      });
    },
  },

  // B453耗材需求计算表API
  b453Calculation: {
    getAll: async (params?: { search?: string }): Promise<B453CalculationItem[]> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      const url = `/b453-calculations/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return apiRequest<B453CalculationItem[]>(url);
    },

    get: async (id: number): Promise<B453CalculationItem> => {
      return apiRequest<B453CalculationItem>(`/b453-calculations/${id}/`);
    },

    create: async (data: Omit<B453CalculationItem, 'id' | 'created_at' | 'updated_at'>): Promise<B453CalculationItem> => {
      return apiRequest<B453CalculationItem>('/b453-calculations/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: number, data: Partial<B453CalculationItem>): Promise<B453CalculationItem> => {
      return apiRequest<B453CalculationItem>(`/b453-calculations/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/b453-calculations/${id}/`, {
        method: 'DELETE',
      });
    },
  },

  // B453产能预测数据API
  b453Forecast: {
    getAll: async (): Promise<B453ForecastData[]> => {
      return apiRequest<B453ForecastData[]>('/b453-forecasts/');
    },

    get: async (id: number): Promise<B453ForecastData> => {
      return apiRequest<B453ForecastData>(`/b453-forecasts/${id}/`);
    },

    create: async (data: Omit<B453ForecastData, 'id' | 'created_at' | 'updated_at'>): Promise<B453ForecastData> => {
      return apiRequest<B453ForecastData>('/b453-forecasts/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: number, data: Partial<B453ForecastData>): Promise<B453ForecastData> => {
      return apiRequest<B453ForecastData>(`/b453-forecasts/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/b453-forecasts/${id}/`, {
        method: 'DELETE',
      });
    },
  },

  // 统一计算引擎API
  calculation: {
    calculate: async (params: CalculationParams): Promise<CalculationResult> => {
      return apiRequest<CalculationResult>('/unified-calculation/', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  },

  // B453数据关联API
  linkage: {
    linkB453Data: async (managementId: number, calculationId: number): Promise<{
      message: string;
      management_item: B453SupplyItem;
      calculation_item: B453CalculationItem;
    }> => {
      return apiRequest<{
        message: string;
        management_item: B453SupplyItem;
        calculation_item: B453CalculationItem;
      }>('/link-b453-data/', {
        method: 'POST',
        body: JSON.stringify({
          management_id: managementId,
          calculation_id: calculationId,
        }),
      });
    },
  },
};

// ================================
// 🆕 动态申请表相关接口
// ================================

// 申请表模板接口
export interface ApplicationTemplate {
  id: number;
  name: string;
  code: string;
  template_type: string[] | string; // 支持多选模板类型
  description: string;
  is_active: boolean;
  has_calculation: boolean;
  calculation_template_id?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
}

// 申请表实例接口
export interface ApplicationForm {
  id: number;
  template: number;
  name: string;
  code: string;
  department: string;
  period: string;
  status: 'draft' | 'active' | 'archived';
  calculation_form_id?: number;
  has_calculation_form: boolean;
  template_name?: string;
  template_type?: string;
  has_calculation?: boolean;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

// 动态耗材项目接口
export interface DynamicSupplyItem {
  id: number;
  form: number;
  serial_number: number;
  material_description: string;
  unit: string;
  purchaser: string;
  unit_price: number;
  max_safety_stock: number;
  min_safety_stock: number;
  moq: number;
  lead_time: number;
  remark: string;
  monthly_data: Record<string, any>;
  usage_per_set: number;
  usage_count: number;
  monthly_capacity: number;
  enable_auto_calculation: boolean;
  form_name?: string;
  form_code?: string;
  created_at: string;
  updated_at: string;
}

// 动态计算项目接口
export interface DynamicCalculationItem {
  id: number;
  form: number;
  no: number;
  material_name: string;
  usage_station: string;
  usage_per_set: number;
  usage_count: number;
  monthly_capacity: number;
  min_stock: number;
  max_stock: number;
  monthly_demand: number;
  monthly_net_demand: number;
  actual_order: number;
  moq_remark: string;
  
  // 🆕 添加采购员字段
  purchaser: string;
  
  linked_supply_item_id?: number;
  linked_material: string;
  unit_price?: number;
  moq?: number;
  
  // 月度库存和需求明细 - B453标准格式
  apr_2025_stock?: number;
  may_2025_demand?: number;
  may_2025_stock?: number;
  jun_2025_demand?: number;
  jun_2025_stock?: number;
  jul_2025_stock?: number;
  aug_2025_demand?: number;
  
  // 现阶段库存
  current_stock_0619?: number;
  current_stock_0625?: number;
  
  // 追料需求 (按月细分)
  jul_m01_demand?: number;
  jul_m02_demand?: number;
  jul_m03_demand?: number;
  jul_m04_demand?: number;
  
  // 总金额 (自动计算)
  total_amount?: number;
  
  form_name?: string;
  form_code?: string;
  created_at: string;
  updated_at: string;
}

// 动态预测数据接口
export interface DynamicForecastData {
  id: number;
  form: number;
  name: string;
  forecast_data: {
    capacity_forecast: {
      monthly_capacity: number;
      six_month_capacity: Record<string, number>;
      usage_stations: string[];
      test_items: string[];
    };
    monthly_control_data: {
      [key: string]: {
        items: number;
        total_stock: number;
        total_demand: number;
        total_amount: number;
        total_warehouse_demand: number;
      };
    };
    prpm_schedule: {
      [key: string]: string;
    };
    material_demand_schedule: {
      [key: string]: number;
    };
  };
  form_name?: string;
  form_code?: string;
  created_at: string;
  updated_at: string;
}

// ================================
// 🆕 动态申请表API服务
// ================================

// 申请表模板服务
export const applicationTemplateService = {
  // 获取所有模板
  getAll: async (): Promise<ApplicationTemplate[]> => {
    const response = await apiRequest<ApplicationTemplate[]>('/application-templates/');
    return response;
  },

  // 获取启用的模板
  getActiveTemplates: async (): Promise<ApplicationTemplate[]> => {
    const response = await apiRequest<ApplicationTemplate[]>('/application-templates/active_templates/');
    return response;
  },

  // 创建模板
  create: async (data: Partial<ApplicationTemplate>): Promise<ApplicationTemplate> => {
    const response = await apiRequest<ApplicationTemplate>('/application-templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  // 更新模板
  update: async (id: number, data: Partial<ApplicationTemplate>): Promise<ApplicationTemplate> => {
    const response = await apiRequest<ApplicationTemplate>(`/application-templates/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  },

  // 删除模板
  delete: async (id: number): Promise<void> => {
    await apiRequest<void>(`/application-templates/${id}/`, {
      method: 'DELETE',
    });
  },
};

// 申请表实例服务
export const applicationFormService = {
  // 获取所有申请表
  getAll: async (): Promise<ApplicationForm[]> => {
    const response = await apiRequest<ApplicationForm[]>('/application-forms/');
    return response;
  },

  // 根据部门获取申请表
  getByDepartment: async (department: string): Promise<ApplicationForm[]> => {
    const response = await apiRequest<ApplicationForm[]>(`/application-forms/by_department/?department=${department}`);
    return response;
  },

  // 创建申请表
  create: async (data: Partial<ApplicationForm>): Promise<ApplicationForm> => {
    const response = await apiRequest<ApplicationForm>('/application-forms/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  // 更新申请表
  update: async (id: number, data: Partial<ApplicationForm>): Promise<ApplicationForm> => {
    const response = await apiRequest<ApplicationForm>(`/application-forms/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  },

  // 删除申请表
  delete: async (id: number): Promise<void> => {
    await apiRequest<void>(`/application-forms/${id}/`, {
      method: 'DELETE',
    });
  },

  // 为申请表创建计算表
  createCalculationForm: async (id: number): Promise<{ message: string; calculation_form_id: number }> => {
    const response = await apiRequest<{ message: string; calculation_form_id: number }>(`/application-forms/${id}/create_calculation_form/`, {
      method: 'POST',
    });
    return response;
  },
};

// 动态耗材项目服务
export const dynamicSupplyItemService = {
  // 根据申请表ID获取耗材项目
  getByForm: async (formId: number): Promise<DynamicSupplyItem[]> => {
    const response = await apiRequest<DynamicSupplyItem[]>(`/dynamic-supply-items/by_form/?form_id=${formId}`);
    return response;
  },

  // 创建耗材项目
  create: async (data: Partial<DynamicSupplyItem>): Promise<DynamicSupplyItem> => {
    const response = await apiRequest<DynamicSupplyItem>('/dynamic-supply-items/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  // 批量创建耗材项目
  bulkCreate: async (formId: number, items: Partial<DynamicSupplyItem>[]): Promise<{ message: string; items: DynamicSupplyItem[] }> => {
    const response = await apiRequest<{ message: string; items: DynamicSupplyItem[] }>(`/dynamic-supply-items/bulk_create/`, {
      method: 'POST',
      body: JSON.stringify({
        form_id: formId,
        items: items
      }),
    });
    return response;
  },

  // 更新耗材项目
  update: async (id: number, data: Partial<DynamicSupplyItem>): Promise<DynamicSupplyItem> => {
    const response = await apiRequest<DynamicSupplyItem>(`/dynamic-supply-items/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  },

  // 删除耗材项目
  delete: async (id: number): Promise<void> => {
    await apiRequest<void>(`/dynamic-supply-items/${id}/`, {
      method: 'DELETE',
    });
  },
};

// 动态计算项目服务
export const dynamicCalculationItemService = {
  // 获取所有计算项目
  getAll: async (): Promise<DynamicCalculationItem[]> => {
    const response = await apiRequest<DynamicCalculationItem[]>('/dynamic-calculation-items/');
    return response;
  },

  // 根据申请表ID获取计算项目
  getByForm: async (formId: number): Promise<DynamicCalculationItem[]> => {
    const response = await apiRequest<DynamicCalculationItem[]>(`/dynamic-calculation-items/by_form/?form_id=${formId}`);
    return response;
  },

  // 创建计算项目
  create: async (data: Partial<DynamicCalculationItem>): Promise<DynamicCalculationItem> => {
    const response = await apiRequest<DynamicCalculationItem>('/dynamic-calculation-items/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  // 更新计算项目
  update: async (id: number, data: Partial<DynamicCalculationItem>) => {
    try {
      // 如果有total_amount字段，确保它不超过12位数且保留2位小数
      if (data && typeof data.total_amount === 'number') {
        data.total_amount = Number(data.total_amount.toFixed(2));
      }
      
      const response = await apiRequest(`/dynamic-calculation-items/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('更新计算项目失败:', { id, data, error });
      throw error;
    }
  },

  // 删除计算项目
  delete: async (id: number): Promise<void> => {
    await apiRequest<void>(`/dynamic-calculation-items/${id}/`, {
      method: 'DELETE',
    });
  },

  // 批量计算需求量
  calculateDemands: async (formId: number): Promise<{ message: string; updated_items: any[] }> => {
    const response = await apiRequest<{ message: string; updated_items: any[] }>(`/dynamic-calculation-items/calculate_demands/`, {
      method: 'POST',
      body: JSON.stringify({
        form_id: formId
      }),
    });
    return response;
  },
};

// 动态预测数据服务
export const dynamicForecastDataService = {
  getByForm: async (formId: number): Promise<DynamicForecastData[]> => {
    try {
      const response = await apiRequest<DynamicForecastData[]>(`/dynamic-forecast-data/by_form/?form_id=${formId}`);
      return response;
    } catch (error) {
      console.error('获取预测数据失败:', error);
      throw error;
    }
  },

  update: async (id: number, data: Partial<DynamicForecastData>): Promise<DynamicForecastData> => {
    try {
      const response = await apiRequest<DynamicForecastData>(`/dynamic-forecast-data/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('更新预测数据失败:', error);
      throw error;
    }
  },

  // 复制预测数据到新表
  copyToNewForm: async (sourceFormId: number, targetFormId: number): Promise<void> => {
    try {
      await apiRequest<void>(`/dynamic-forecast-data/copy/`, {
        method: 'POST',
        body: JSON.stringify({
          source_form_id: sourceFormId,
          target_form_id: targetFormId
        })
      });
    } catch (error) {
      console.error('复制预测数据失败:', error);
      throw error;
    }
  }
}; 