import type { ColumnsType } from "antd/es/table";
import type {
  ApplicationForm,
  DynamicSupplyItem,
  DynamicCalculationItem,
  DynamicForecastData,
  B482SupplyItem,
  AndorSupplyItem,
  CapacityForecast,
  B453SupplyItem,
  B453CalculationItem,
  B453ForecastData,
  ApplicationTemplate,
  B453CalculationHeaders,
} from "../types";

import { apiRequest } from "./api";

export * from "../types";

// ================================
// 🆕 API服务类
// ================================

export const materialManagementApi = {
  // B482耗材管控申请表API
  b482: {
    getAll: async (params?: { search?: string }): Promise<B482SupplyItem[]> => {
      const queryParams = new URLSearchParams();

      if (params?.search) queryParams.append("search", params.search);
      const url = `/b482-supplies/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

      return apiRequest<B482SupplyItem[]>(url);
    },

    get: async (id: number): Promise<B482SupplyItem> => {
      return apiRequest<B482SupplyItem>(`/b482-supplies/${id}/`);
    },

    create: async (
      data: Omit<B482SupplyItem, "id" | "created_at" | "updated_at">,
    ): Promise<B482SupplyItem> => {
      return apiRequest<B482SupplyItem>("/b482-supplies/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: number,
      data: Partial<B482SupplyItem>,
    ): Promise<B482SupplyItem> => {
      return apiRequest<B482SupplyItem>(`/b482-supplies/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/b482-supplies/${id}/`, {
        method: "DELETE",
      });
    },
  },

  // Andor耗材需求计算表API
  andor: {
    getAll: async (params?: {
      month?: string;
      usage_station?: string;
    }): Promise<AndorSupplyItem[]> => {
      const queryParams = new URLSearchParams();

      if (params?.month) queryParams.append("month", params.month);
      if (params?.usage_station)
        queryParams.append("usage_station", params.usage_station);
      const url = `/andor-supplies/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

      return apiRequest<AndorSupplyItem[]>(url);
    },

    get: async (id: number): Promise<AndorSupplyItem> => {
      return apiRequest<AndorSupplyItem>(`/andor-supplies/${id}/`);
    },

    create: async (
      data: Omit<AndorSupplyItem, "id" | "created_at" | "updated_at">,
    ): Promise<AndorSupplyItem> => {
      return apiRequest<AndorSupplyItem>("/andor-supplies/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: number,
      data: Partial<AndorSupplyItem>,
    ): Promise<AndorSupplyItem> => {
      return apiRequest<AndorSupplyItem>(`/andor-supplies/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/andor-supplies/${id}/`, {
        method: "DELETE",
      });
    },
  },

  // 产能预测数据API
  capacityForecast: {
    getAll: async (): Promise<CapacityForecast[]> => {
      return apiRequest<CapacityForecast[]>("/capacity-forecasts/");
    },

    get: async (id: number): Promise<CapacityForecast> => {
      return apiRequest<CapacityForecast>(`/capacity-forecasts/${id}/`);
    },

    create: async (
      data: Omit<CapacityForecast, "id" | "created_at" | "updated_at">,
    ): Promise<CapacityForecast> => {
      return apiRequest<CapacityForecast>("/capacity-forecasts/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: number,
      data: Partial<CapacityForecast>,
    ): Promise<CapacityForecast> => {
      return apiRequest<CapacityForecast>(`/capacity-forecasts/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/capacity-forecasts/${id}/`, {
        method: "DELETE",
      });
    },
  },

  // B453 SMT ATE耗材管控表API
  b453: {
    getAll: async (params?: { search?: string }): Promise<B453SupplyItem[]> => {
      const queryParams = new URLSearchParams();

      if (params?.search) queryParams.append("search", params.search);
      const url = `/b453-supplies/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

      return apiRequest<B453SupplyItem[]>(url);
    },

    get: async (id: number): Promise<B453SupplyItem> => {
      return apiRequest<B453SupplyItem>(`/b453-supplies/${id}/`);
    },

    create: async (
      data: Omit<B453SupplyItem, "id" | "created_at" | "updated_at">,
    ): Promise<B453SupplyItem> => {
      return apiRequest<B453SupplyItem>("/b453-supplies/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: number,
      data: Partial<B453SupplyItem>,
    ): Promise<B453SupplyItem> => {
      return apiRequest<B453SupplyItem>(`/b453-supplies/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/b453-supplies/${id}/`, {
        method: "DELETE",
      });
    },

    // 获取B453管控表表头
    getHeaders: async (): Promise<ColumnsType<DynamicCalculationItem>> => {
      return apiRequest<ColumnsType<DynamicCalculationItem>>(
        "/b453-management-headers/",
      );
    },
  },

  // B453耗材需求计算表API
  b453Calculation: {
    getAll: async (params?: {
      search?: string;
    }): Promise<B453CalculationItem[]> => {
      const queryParams = new URLSearchParams();

      if (params?.search) queryParams.append("search", params.search);
      const url = `/b453-calculations/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

      return apiRequest<B453CalculationItem[]>(url);
    },

    get: async (id: number): Promise<B453CalculationItem> => {
      return apiRequest<B453CalculationItem>(`/b453-calculations/${id}/`);
    },

    create: async (
      data: Omit<B453CalculationItem, "id" | "created_at" | "updated_at">,
    ): Promise<B453CalculationItem> => {
      return apiRequest<B453CalculationItem>("/b453-calculations/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: number,
      data: Partial<B453CalculationItem>,
    ): Promise<B453CalculationItem> => {
      return apiRequest<B453CalculationItem>(`/b453-calculations/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/b453-calculations/${id}/`, {
        method: "DELETE",
      });
    },

    // 获取B453计算表表头
    getHeaders: async (): Promise<B453CalculationHeaders> => {
      return apiRequest<B453CalculationHeaders>("/b453-calculation-headers/");
    },

    // 批量创建计算项目
    bulkCreate: async (
      items: Omit<B453CalculationItem, "id" | "created_at" | "updated_at">[],
    ): Promise<B453CalculationItem[]> => {
      return apiRequest<B453CalculationItem[]>(
        "/api/b453-calculations/bulk-create/",
        {
          method: "POST",
          body: JSON.stringify({ items }),
        },
      );
    },

    // 批量更新计算项目
    bulkUpdate: async (
      items: Partial<B453CalculationItem>[],
    ): Promise<B453CalculationItem[]> => {
      return apiRequest<B453CalculationItem[]>(
        "/api/b453-calculations/bulk-update/",
        {
          method: "POST",
          body: JSON.stringify({ items }),
        },
      );
    },
  },

  // B453产能预测数据API
  b453Forecast: {
    getAll: async (): Promise<B453ForecastData[]> => {
      return apiRequest<B453ForecastData[]>("/b453-forecasts/");
    },

    get: async (id: number): Promise<B453ForecastData> => {
      return apiRequest<B453ForecastData>(`/b453-forecasts/${id}/`);
    },

    create: async (
      data: Omit<B453ForecastData, "id" | "created_at" | "updated_at">,
    ): Promise<B453ForecastData> => {
      return apiRequest<B453ForecastData>("/b453-forecasts/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: number,
      data: Partial<B453ForecastData>,
    ): Promise<B453ForecastData> => {
      return apiRequest<B453ForecastData>(`/b453-forecasts/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: number): Promise<void> => {
      return apiRequest<void>(`/b453-forecasts/${id}/`, {
        method: "DELETE",
      });
    },
  },

  // 统一计算引擎API
  calculation: {
    calculate: async (params: {
      [key: string]: any; // 通用计算参数
    }): Promise<{
      [key: string]: any; // 通用计算结果
    }> => {
      return apiRequest<{ [key: string]: any }>("/unified-calculation/", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  },

  // B453数据关联API
  linkage: {
    linkB453Data: async (
      managementId: number,
      calculationId: number,
    ): Promise<{
      message: string;
      management_item: B453SupplyItem;
      calculation_item: B453CalculationItem;
    }> => {
      return apiRequest<{
        message: string;
        management_item: B453SupplyItem;
        calculation_item: B453CalculationItem;
      }>("/link-b453-data/", {
        method: "POST",
        body: JSON.stringify({
          management_id: managementId,
          calculation_id: calculationId,
        }),
      });
    },
  },
};

// ================================
// 🆕 动态申请表API服务
// ================================

// 申请表模板服务
export const applicationTemplateService = {
  // 获取所有模板
  getAll: async (): Promise<ApplicationTemplate[]> => {
    const response = await apiRequest<ApplicationTemplate[]>(
      "/application-templates/",
    );

    return response;
  },

  // 获取启用的模板
  getActiveTemplates: async (): Promise<ApplicationTemplate[]> => {
    const response = await apiRequest<ApplicationTemplate[]>(
      "/application-templates/active_templates/",
    );

    return response;
  },

  // 创建模板
  create: async (
    data: Partial<ApplicationTemplate>,
  ): Promise<ApplicationTemplate> => {
    const response = await apiRequest<ApplicationTemplate>(
      "/application-templates/",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    return response;
  },

  // 更新模板
  update: async (
    id: number,
    data: Partial<ApplicationTemplate>,
  ): Promise<ApplicationTemplate> => {
    const response = await apiRequest<ApplicationTemplate>(
      `/application-templates/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );

    return response;
  },

  // 删除模板
  delete: async (id: number): Promise<void> => {
    await apiRequest<void>(`/application-templates/${id}/`, {
      method: "DELETE",
    });
  },
};

// 申请表实例服务
export const applicationFormService = {
  // 获取所有申请表
  getAll: async (): Promise<ApplicationForm[]> => {
    const response = await apiRequest<ApplicationForm[]>("/application-forms/");

    return response;
  },

  // 根据部门获取申请表
  getByDepartment: async (department: string): Promise<ApplicationForm[]> => {
    const response = await apiRequest<ApplicationForm[]>(
      `/application-forms/by_department/?department=${department}`,
    );

    return response;
  },

  // 创建申请表
  create: async (data: Partial<ApplicationForm>): Promise<ApplicationForm> => {
    const response = await apiRequest<ApplicationForm>("/application-forms/", {
      method: "POST",
      body: JSON.stringify(data),
    });

    return response;
  },

  // 更新申请表
  update: async (
    id: number,
    data: Partial<ApplicationForm>,
  ): Promise<ApplicationForm> => {
    const response = await apiRequest<ApplicationForm>(
      `/application-forms/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );

    return response;
  },

  // 删除申请表
  delete: async (id: number): Promise<void> => {
    await apiRequest<void>(`/application-forms/${id}/`, {
      method: "DELETE",
    });
  },

  // 为申请表创建计算表
  createCalculationForm: async (
    id: number,
  ): Promise<{ message: string; calculation_form_id: number }> => {
    const response = await apiRequest<{
      message: string;
      calculation_form_id: number;
    }>(`/application-forms/${id}/create_calculation_form/`, {
      method: "POST",
    });

    return response;
  },
};

// 动态耗材项目服务
export const dynamicSupplyItemService = {
  // 根据申请表ID获取耗材项目
  getByForm: async (formId: number): Promise<DynamicSupplyItem[]> => {
    const response = await apiRequest<DynamicSupplyItem[]>(
      `/dynamic-supply-items/by_form/?form_id=${formId}`,
    );

    return response;
  },

  // 创建耗材项目
  create: async (
    data: Partial<DynamicSupplyItem>,
  ): Promise<DynamicSupplyItem> => {
    const response = await apiRequest<DynamicSupplyItem>(
      "/dynamic-supply-items/",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    return response;
  },

  // 批量创建耗材项目
  bulkCreate: async (
    formId: number,
    items: Partial<DynamicSupplyItem>[],
  ): Promise<{ message: string; items: DynamicSupplyItem[] }> => {
    const response = await apiRequest<{
      message: string;
      items: DynamicSupplyItem[];
    }>(`/dynamic-supply-items/bulk_create/`, {
      method: "POST",
      body: JSON.stringify({
        form_id: formId,
        items: items,
      }),
    });

    return response;
  },

  // 更新耗材项目
  update: async (
    id: number,
    data: Partial<DynamicSupplyItem>,
  ): Promise<DynamicSupplyItem> => {
    const response = await apiRequest<DynamicSupplyItem>(
      `/dynamic-supply-items/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );

    return response;
  },

  // 删除耗材项目
  delete: async (id: number): Promise<void> => {
    await apiRequest<void>(`/dynamic-supply-items/${id}/`, {
      method: "DELETE",
    });
  },
};

// 动态计算项目服务
export const dynamicCalculationItemService = {
  // 获取所有计算项目
  getAll: async (): Promise<DynamicCalculationItem[]> => {
    const response = await apiRequest<DynamicCalculationItem[]>(
      "/dynamic-calculation-items/",
    );

    return response;
  },

  // 根据申请表ID获取计算项目
  getByForm: async (
    formId: number,
    includeHidden: boolean = false,
  ): Promise<DynamicCalculationItem[]> => {
    const params = new URLSearchParams({
      form_id: formId.toString(),
      include_hidden: String(includeHidden),
    });

    return apiRequest<DynamicCalculationItem[]>(
      `/dynamic-calculation-items/by_form/?${params.toString()}`,
    );
  },

  // 创建计算项目
  create: async (
    data: Partial<DynamicCalculationItem>,
  ): Promise<DynamicCalculationItem> => {
    return apiRequest<DynamicCalculationItem>("/dynamic-calculation-items/", {
      method: "POST",
      body: JSON.stringify({ ...data, form: data.form }),
    });
  },

  // 更新计算项目
  update: async (
    id: number,
    data: Partial<DynamicCalculationItem>,
  ): Promise<DynamicCalculationItem> => {
    return apiRequest<DynamicCalculationItem>(
      `/dynamic-calculation-items/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },

  // 删除计算项目
  delete: async (id: number): Promise<void> => {
    await apiRequest<void>(`/dynamic-calculation-items/${id}/`, {
      method: "DELETE",
    });
  },

  // 批量计算需求量
  calculateDemands: async (
    formId: number,
  ): Promise<{ message: string; updated_items: any[] }> => {
    const response = await apiRequest<{
      message: string;
      updated_items: any[];
    }>(`/dynamic-calculation-items/calculate_demands/`, {
      method: "POST",
      body: JSON.stringify({
        form_id: formId,
      }),
    });

    return response;
  },

  // 批量隐藏项目
  bulkHide: async (
    ids: number[],
  ): Promise<{ message: string; updated_count: number }> => {
    return apiRequest<{ message: string; updated_count: number }>(
      `/dynamic-calculation-items/bulk_hide/`,
      {
        method: "POST",
        body: JSON.stringify({ ids }),
      },
    );
  },

  // 批量显示项目
  bulkShow: async (
    ids: number[],
  ): Promise<{ message: string; updated_count: number }> => {
    return apiRequest<{ message: string; updated_count: number }>(
      `/dynamic-calculation-items/bulk_show/`,
      {
        method: "POST",
        body: JSON.stringify({ ids }),
      },
    );
  },
};

// 动态预测数据服务
export const dynamicForecastDataService = {
  getByForm: async (formId: number): Promise<DynamicForecastData[]> => {
    try {
      const response = await apiRequest<DynamicForecastData[]>(
        `/dynamic-forecast-data/by_form/?form_id=${formId}`,
      );

      return response;
    } catch (error) {
      console.error("获取预测数据失败:", error);
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<DynamicForecastData>,
  ): Promise<DynamicForecastData> => {
    try {
      const response = await apiRequest<DynamicForecastData>(
        `/dynamic-forecast-data/${id}/`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
      );

      return response;
    } catch (error) {
      console.error("更新预测数据失败:", error);
      throw error;
    }
  },

  // 复制预测数据到新表
  copyToNewForm: async (
    sourceFormId: number,
    targetFormId: number,
  ): Promise<void> => {
    try {
      await apiRequest<void>(`/dynamic-forecast-data/copy/`, {
        method: "POST",
        body: JSON.stringify({
          source_form_id: sourceFormId,
          target_form_id: targetFormId,
        }),
      });
    } catch (error) {
      console.error("复制预测数据失败:", error);
      throw error;
    }
  },
};
