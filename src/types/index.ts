import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Supply {
  id: number;
  name: string;
  category: string;
  // ... other fields
  unit_price: number; // 确保是 number
  purchaser?: string;
}

export interface CapacityForecast {
  monthly_capacity: number;
  six_month_capacity: Record<string, number>;
  usage_stations: string[];
  test_items: string[];
}

export interface ForecastData {
  capacity_forecast: CapacityForecast;
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
}

export interface DynamicForecastData {
  id: number;
  name: string;
  form: number;
  forecast_data: {
    capacity_forecast?: {
      monthly_capacity?: number;
      six_month_capacity?: Record<string, number>;
      usage_stations?: string[];
    };
    prpm_schedule?: Record<string, string>;
    material_demand_schedule?: Record<string, number>;
    monthly_control_data?: any;
  };
}

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
  purchaser?: string;
  unit_price?: number;
  total_amount?: number;
  linked_supply_item_id?: number;
  linked_material?: string;
  moq?: number;

  // 多站别支持
  is_multi_station?: boolean;
  multi_station_data?: {
    stations: string[];
    usage_per_set: number[];
    usage_count: number[];
    monthly_capacity: number[];
    min_stock: number[];
    min_total_stock: number[];
    max_stock: number[];
    monthly_demand: number[];
    monthly_net_demand: number[];
    actual_order: number[];
    moq_remark: string[];
  };

  // 新增的动态JSON字段
  monthly_data: {
    [date: string]: {
      // e.g., "2025-07"
      demand?: number;
      stock?: number;
    };
  };
  chase_data: {
    [date: string]: {
      // e.g., "2025-07"
      [week: string]: number; // e.g., "M01", "M02"
    };
  };
  stock_snapshots: {
    [date: string]: number; // e.g., "2025-06-19"
  };

  // 关联字段
  created_at?: string;
  updated_at?: string;
  is_visible?: boolean;
}

export interface ApplicationForm {
  id: number;
  template: number; // or a more detailed Template object
  name: string;
  code: string;
  department: string;
  period: string;
  status: "draft" | "active" | "archived";
  calculation_form_id?: number | null;
  has_calculation_form?: boolean;
  created_at: string;
  updated_at: string;
  created_by: number; // or a User object
}

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

// B453表格的列配置
export interface B453ColumnConfig {
  title: string;
  dataIndex: string;
  key: string;
  width: number;
}

export type B453CalculationHeaders = B453ColumnConfig[];

export interface InventoryRecord {
  id: number;
  type: "in" | "out" | "adjust";
  supply: number;
  quantity: number;
  operator: string;
  department: string;
  remark: string;
  previous_stock: number;
  new_stock: number;
  timestamp: string;
  supply_name?: string;
  supply_category?: string;
  supply_unit?: string;
  type_display?: string;
}

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
}

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
  actual_stock: number;
  moq_remark: string;
  management_id?: number;
  linked_material: string;
  unit_price?: string | number;
  moq?: number;
  created_at?: string;
  updated_at?: string;
}

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

export interface ApplicationTemplate {
  id: number;
  name: string;
  code: string;
  template_type: string[] | string;
  description: string;
  is_active: boolean;
  has_calculation: boolean;
  calculation_template_id?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
}
