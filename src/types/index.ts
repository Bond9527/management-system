import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

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
  form: number;
  name: string;
  forecast_data: ForecastData;
  created_at: string;
  updated_at: string;
}
