import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Tabs,
  Tab,
  Chip,
  Checkbox,
  Textarea,
  Spinner,
  Divider,
  Tooltip,
  ScrollShadow,
  Badge,
  Spacer,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Table as HeroTable,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { addToast } from '@heroui/toast';
import { PlusIcon, CalculatorIcon, ArrowUpTrayIcon, ArrowLeftIcon, EllipsisVerticalIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
// 暂时保留Ant Design的Table组件，因为它比较复杂
import { Table, Space, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import * as XLSX from 'xlsx-js-style';
import MergedCellTable from './MergedCellTable';
import DemandPurchaseTable from './DemandPurchaseTable';
import MaterialNameCell from './MaterialNameCell';

// 🎨 智能对齐函数 - 根据规则设置单元格对齐方式
const setSmartAlignment = (ws: any, options: any) => {
  const { leftAlignColumns, leftAlignKeywords, bottomAlignRows } = options;

  for (const cellAddress in ws) {
    if (cellAddress[0] === '!') continue; // 跳过工作表元数据

    const cell = ws[cellAddress];
    if (!cell || !cell.v) continue;
    
    const cellValue = String(cell.v);
    const col = cellAddress.replace(/\d+/, '');
    const row = parseInt(cellAddress.replace(/[A-Z]/g, '')) - 1;

    // 初始化样式对象
    if (!cell.s) cell.s = {};
    if (!cell.s.alignment) cell.s.alignment = {};

    // 规则1: 左对齐
    if (leftAlignColumns.includes(col)) {
      cell.s.alignment.horizontal = 'left';
      cell.s.alignment.vertical = 'center';
      cell.s.alignment.wrapText = false; // 禁用自动换行
    } else if (leftAlignKeywords.some((keyword: string) => cellValue.includes(keyword))) {
      // 特殊处理合计行：如果包含"合計"关键词，则居中显示
      if (cellValue.includes('合計')) {
        cell.s.alignment.horizontal = 'center';
        cell.s.alignment.vertical = 'center';
        cell.s.alignment.wrapText = true;
        
        // 同时处理同一行中合计数值单元格的居中显示
        for (const otherCellAddress in ws) {
          if (otherCellAddress[0] === '!') continue;
          
          const otherCell = ws[otherCellAddress];
          if (!otherCell || !otherCell.v) continue;
          
          const otherCellValue = String(otherCell.v);
          const otherCol = otherCellAddress.replace(/\d+/, '');
          const otherRow = parseInt(otherCellAddress.replace(/[A-Z]/g, '')) - 1;
          
          // 如果是同一行且包含数字（可能是合计数值）
          if (otherRow === row && /\d/.test(otherCellValue) && !otherCellValue.includes('合計')) {
            if (!otherCell.s) otherCell.s = {};
            if (!otherCell.s.alignment) otherCell.s.alignment = {};
            otherCell.s.alignment.horizontal = 'center';
            otherCell.s.alignment.vertical = 'center';
            otherCell.s.alignment.wrapText = true;
          }
        }
      } else {
        cell.s.alignment.horizontal = 'left';
        cell.s.alignment.vertical = 'center';
        cell.s.alignment.wrapText = false; // 禁用自动换行
        
        // 如果是备注相关的内容，确保合并单元格的其他部分也是左对齐
        if (cellValue.includes('備註') || cellValue.includes('安全庫存') || cellValue.includes('歷史資料') || 
            cellValue.includes('採購員') || cellValue.includes('單價') || cellValue.includes('市場行情') || 
            cellValue.includes('採購成本') || /^\d+\./.test(cellValue)) {
          
          // 查找同一行中其他单元格并设置为左对齐
          for (const otherCellAddress in ws) {
            if (otherCellAddress[0] === '!') continue;
            
            const otherCell = ws[otherCellAddress];
            if (!otherCell) continue;
            
            const otherCol = otherCellAddress.replace(/\d+/, '');
            const otherRow = parseInt(otherCellAddress.replace(/[A-Z]/g, '')) - 1;
            
            // 如果是同一行且在合并范围内（A-C列）
            if (otherRow === row && ['A', 'B', 'C'].includes(otherCol)) {
              if (!otherCell.s) otherCell.s = {};
              if (!otherCell.s.alignment) otherCell.s.alignment = {};
              otherCell.s.alignment.horizontal = 'left';
              otherCell.s.alignment.vertical = 'center';
              otherCell.s.alignment.wrapText = false; // 禁用自动换行
            }
          }
        }
      }
    } else {
      // 默认居中对齐
      cell.s.alignment.horizontal = 'center';
      cell.s.alignment.vertical = 'center';
      cell.s.alignment.wrapText = true;
    }

    // 规则2: 底部对齐
    if (bottomAlignRows && bottomAlignRows[col] && bottomAlignRows[col].includes(row)) {
      cell.s.alignment.vertical = 'bottom';
    }
  }

  return ws;
};
import {
  ApplicationForm,
  DynamicSupplyItem,
  DynamicCalculationItem,
  DynamicForecastData,
  dynamicSupplyItemService,
  dynamicCalculationItemService,
  dynamicForecastDataService,
  materialManagementApi,
} from '../services/materialManagement';
import SupplyAutoComplete from './SupplyAutoComplete';
import { SupplyItem, suppliesApi } from '../services/supplies';
import { generateChineseMonthKey } from "../utils/dateUtils";

interface DynamicApplicationDetailProps {
  applicationForm: ApplicationForm;
  onBack: () => void;
  allowReturn?: boolean; // 添加这个可选属性
}

// 临时类型定义
interface B453CalculationHeaders {
  [key: string]: any;
}

interface B453ColumnConfig {
  [key: string]: any;
}

// 临时函数定义


const DynamicApplicationDetail: React.FC<DynamicApplicationDetailProps> = ({
  applicationForm,
  onBack,
  allowReturn = true, // 设置默认值为true
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('b453_view'); // 修改默认值为'b453_view'
  const [calculationItems, setCalculationItems] = useState<DynamicCalculationItem[]>([]);
  const [forecastData, setForecastData] = useState<DynamicForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [includeHidden, setIncludeHidden] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 模态框状态 - 只保留计算项目相关
  const [calculationModalVisible, setCalculationModalVisible] = useState(false);
  const [demandCalculationModalVisible, setDemandCalculationModalVisible] = useState(false); // 新增需求计算表专用弹窗
  const [batchPurchaserModalVisible, setBatchPurchaserModalVisible] = useState(false);
  const [currentCalculationItem, setCurrentCalculationItem] = useState<DynamicCalculationItem | null>(null);
  const [currentDemandCalculationItem, setCurrentDemandCalculationItem] = useState<DynamicCalculationItem | null>(null); // 新增需求计算表专用项目

  // 使表单数据状态能接受动态键
  const [calculationFormData, setCalculationFormData] = useState<Partial<DynamicCalculationItem> & { [key: string]: any }>({});
  const [demandCalculationFormData, setDemandCalculationFormData] = useState<Partial<DynamicCalculationItem> & { [key: string]: any }>({}); // 新增需求计算表专用表单数据

  // 多站别支持状态
  const [isDemandMultiStation, setIsDemandMultiStation] = useState(false);
  const [demandMultiStationData, setDemandMultiStationData] = useState<{
    stations: string[];
    usage_per_set: number[];
    usage_count: number[];
    monthly_capacity: number[];
    min_stock: number[];
    min_total_stock: number[];
    max_stock: number[];
    max_total_stock: number[];
    monthly_demand: number[];
    monthly_net_demand: number[];
    actual_order: number[];
    moq_remark: string[];
  }>({
    stations: [],
    usage_per_set: [],
    usage_count: [],
    monthly_capacity: [],
    min_stock: [],
    min_total_stock: [],
    max_stock: [],
    max_total_stock: [],
    monthly_demand: [],
    monthly_net_demand: [],
    actual_order: [],
    moq_remark: [],
  });

  const [batchPurchaserName, setBatchPurchaserName] = useState('');

  // 添加表头状态
  const [calculationHeaders, setCalculationHeaders] = useState<B453CalculationHeaders | null>(null);
  
  // 1. 在状态管理区添加缺失的 useState
  const [editingCapacityData, setEditingCapacityData] = useState({});
  const [managementHeaders, setManagementHeaders] = useState<ColumnsType<DynamicCalculationItem>>([]);

  useEffect(() => {
    loadCalculationItems();
    loadForecastData();
  }, [applicationForm.id, includeHidden]);

  // 初始化编辑数据
  useEffect(() => {
    if (
      forecastData.length > 0 &&
      forecastData[0].forecast_data?.capacity_forecast?.six_month_capacity
    ) {
      setEditingCapacityData(
        forecastData[0].forecast_data.capacity_forecast.six_month_capacity,
      );
    }
  }, [forecastData]);

  // 加载计算表数据
  const loadCalculationItems = async () => {
    setLoading(true);
    try {
      // 同时加载管控表和计算表数据
      const [calculationData, forecastData] = await Promise.all([
        dynamicCalculationItemService.getByForm(
          applicationForm.id,
          includeHidden,
        ),
        dynamicForecastDataService.getByForm(applicationForm.id),
      ]);

      // 强制创建一个新的数组引用来触发React的重新渲染
      // 使用深拷贝来确保React能够检测到深层嵌套对象的变化
      setCalculationItems(JSON.parse(JSON.stringify(calculationData)));
      setForecastData(JSON.parse(JSON.stringify(forecastData)));

      // 打印数据以便调试
      console.log("加载的数据:", {
        calculationData,
        forecastData,
        applicationForm,
      });

      // 🔧 调试追料需求数据
      console.log("=== 追料需求调试信息 ===");
      calculationData.forEach((item, index) => {
        console.log(`项目${item.no}:`, {
          chase_data: item.chase_data,
          chase_data_type: typeof item.chase_data,
          has_chase_data:
            item.chase_data && Object.keys(item.chase_data).length > 0,
          "2025-07": item.chase_data?.["2025-07"],
          W02: item.chase_data?.["2025-07"]?.["W02"],
        });
      });

      // 🔧 调试targetMonthKey
      const { targetMonthKey } = generateFieldMapping();

      console.log("targetMonthKey:", targetMonthKey);
    } catch (error) {
      console.error("加载数据失败:", error);
      addToast({
        title: "错误",
        description: "加载数据失败，请重试",
        color: "danger",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据函数
  const refreshData = async () => {
    await loadCalculationItems();
    addToast({
      title: "成功",
      description: "数据已刷新",
      color: "success",
      timeout: 2000,
      shouldShowTimeoutProgress: true,
    });
  };

  // 加载预测数据
  const loadForecastData = async () => {
    try {
      const data = await dynamicForecastDataService.getByForm(
        applicationForm.id,
      );

      setForecastData(data);
    } catch (error) {
      console.error("加载预测数据失败");
    }
  };

  // 由于现在使用整合数据，供应项目相关的操作已合并到计算项目中

  // 计算表相关操作
  const handleCreateCalculationItem = () => {
    setCurrentCalculationItem(null);

    // 动态生成月度数据结构
    const dynamicMonthlyData: Record<string, any> = {};
    const dynamicChaseData: Record<string, any> = {};
    const dynamicStockSnapshots: Record<string, any> = {};

    // 使用 monthInfo 动态生成月度数据
    monthInfo.months.slice(0, 3).forEach((m) => {
      // 需求数据使用月份格式
      const monthKey = `${m.year}-${String(m.month).padStart(2, "0")}`;

      dynamicMonthlyData[monthKey] = { demand: 0 };

      // 库存数据使用上个月22日格式
      let prevMonth = m.month - 1;
      let prevYear = m.year;

      if (prevMonth <= 0) {
        prevMonth = 12;
        prevYear = m.year - 1;
      }
      const stockKey = `${prevYear}/${String(prevMonth).padStart(2, "0")}/22`;

      dynamicMonthlyData[stockKey] = { stock: 0 };
    });

    // 目标月份的库存
    const targetStockKey = `${monthInfo.year}/${String(monthInfo.targetMonth).padStart(2, "0")}/22`;

    dynamicMonthlyData[targetStockKey] = { stock: 0 };

    // 追料数据使用目标月份
    const targetMonthKey = `${monthInfo.year}-${String(monthInfo.targetMonth).padStart(2, "0")}`;

    dynamicChaseData[targetMonthKey] = { W01: 0, W02: 0, W03: 0, W04: 0 };

    // 库存快照使用动态日期
    dynamicStockSnapshots[`${monthInfo.year}-06-19`] = 0;
    dynamicStockSnapshots[`${monthInfo.year - 1}-06-25`] = 0;

    setCalculationFormData({
      no: calculationItems.length + 1, // 自动设置序号
      material_name: "", // 必填字段
      usage_station: "", // 必填字段
      usage_per_set: 1, // 默认每臺机用量为1
      usage_count: 1000, // 默认使用次数为1000
      monthly_capacity: 497700, // 默认月产能
      min_stock: 0, // 默认最低库存
      max_stock: 0, // 默认最高库存
      monthly_demand: 0, // 默认月需求
      monthly_net_demand: 0, // 默认总需求
      actual_order: 0, // 默认实际订购数量
      unit_price: 0, // 默认单价
      purchaser: "", // 默认采购员

      // 动态生成的月度数据
      monthly_data: dynamicMonthlyData,
      stock_snapshots: dynamicStockSnapshots,
      chase_data: dynamicChaseData,

      total_amount: 0,
      moq_remark: "", // 默认备注为空
    });
    setCalculationModalVisible(true);
  };

  const handleEditCalculationItem = (item: DynamicCalculationItem) => {
    console.log("🔧 开始编辑计算项目:", item);
    
    try {
      setCurrentCalculationItem(item);
      console.log("✅ 设置当前计算项目成功");
    } catch (error) {
      console.error("❌ 设置当前计算项目失败:", error);
    }

    // 动态生成默认数据结构
    const dynamicMonthlyData: Record<string, any> = {};
    const dynamicChaseData: Record<string, any> = {};
    const dynamicStockSnapshots: Record<string, any> = {};

    // 使用 monthInfo 动态生成月度数据
    monthInfo.months.slice(0, 3).forEach((m) => {
      // 需求数据使用月份格式
      const monthKey = `${m.year}-${String(m.month).padStart(2, "0")}`;

      dynamicMonthlyData[monthKey] = { demand: 0 };

      // 库存数据使用上个月22日格式
      let prevMonth = m.month - 1;
      let prevYear = m.year;

      if (prevMonth <= 0) {
        prevMonth = 12;
        prevYear = m.year - 1;
      }
      const stockKey = `${prevYear}/${String(prevMonth).padStart(2, "0")}/22`;

      dynamicMonthlyData[stockKey] = { stock: 0 };
    });

    // 目标月份的库存
    const targetStockKey = `${monthInfo.year}/${String(monthInfo.targetMonth).padStart(2, "0")}/22`;

    dynamicMonthlyData[targetStockKey] = { stock: 0 };

    // 追料数据使用目标月份
    const targetMonthKey = `${monthInfo.year}-${String(monthInfo.targetMonth).padStart(2, "0")}`;

    dynamicChaseData[targetMonthKey] = { W01: 0, W02: 0, W03: 0, W04: 0 };

    // 库存快照使用动态日期
    dynamicStockSnapshots[`${monthInfo.year}-06-19`] = 0;
    dynamicStockSnapshots[`${monthInfo.year - 1}-06-25`] = 0;

    // 确保所有嵌套数据结构都有默认值
    const formData = {
      ...item,
      monthly_data: { ...dynamicMonthlyData, ...item.monthly_data },
      chase_data: { ...dynamicChaseData, ...item.chase_data },
      stock_snapshots: { ...dynamicStockSnapshots, ...item.stock_snapshots },
    };

    try {
      setCalculationFormData(formData);
      console.log("✅ 设置表单数据成功");
      
      setCalculationModalVisible(true);
      console.log("✅ 设置模态框可见成功");
    } catch (error) {
      console.error("❌ 设置表单数据或模态框失败:", error);
    }
  };

  const handleDeleteCalculationItem = async (id: number) => {
    try {
      await dynamicCalculationItemService.delete(id);
      await loadCalculationItems();
      addToast({
        title: "成功",
        description: "删除成功",
        color: "success",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        ),
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("删除计算项目失败:", error);
      addToast({
        title: "错误",
        description: "删除失败，请重试",
        color: "danger",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  const handleToggleVisibility = async (
    itemToToggle: DynamicCalculationItem,
  ) => {
    try {
      const newVisibility = !(itemToToggle.is_visible ?? true);

      // Only send the changed field because we are using PATCH
      await dynamicCalculationItemService.update(itemToToggle.id, {
        is_visible: newVisibility,
      });

      addToast({
        title: "成功",
        description: `项目已${newVisibility ? "显示" : "隐藏"}`,
        color: "success",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });

      // Reload data from server to ensure UI is consistent
      await loadCalculationItems();
    } catch (error) {
      console.error("切换可见性失败:", error);
      addToast({
        title: "错误",
        description: "操作失败，请重试",
        color: "danger",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 根据当前选择，决定显示哪些批量操作按钮
  const { visibleSelected, hiddenSelected, isMixedSelection } = useMemo(() => {
    const selectedItems = calculationItems.filter((item) =>
      selectedRowKeys.includes(item.id),
    );
    const hidden = selectedItems.filter((item) => item.is_visible === false);
    const visible = selectedItems.filter((item) => item.is_visible !== false);

    return {
      visibleSelected: visible,
      hiddenSelected: hidden,
      isMixedSelection: hidden.length > 0 && visible.length > 0,
    };
  }, [selectedRowKeys, calculationItems]);

  // 当检测到混合选择时，显示toast警告
  useEffect(() => {
    if (isMixedSelection) {
      addToast({
        title: "操作无效",
        description: "请不要同时选择可见和隐藏的项目。",
        color: "warning",
        timeout: 4000,
      });
    }
  }, [isMixedSelection]);

  const handleBulkShow = async (ids: number[]) => {
    if (ids.length === 0) {
      addToast({
        title: "提示",
        description: "请至少选择一个项目进行操作",
        color: "primary",
        timeout: 3000,
      });

      return;
    }

    if (!window.confirm(`确定要显示选中的 ${ids.length} 个项目吗？`)) {
      return;
    }

    try {
      await dynamicCalculationItemService.bulkShow(ids);
      addToast({
        title: "成功",
        description: `成功显示了 ${ids.length} 个项目`,
        color: "success",
        timeout: 3000,
      });
      setSelectedRowKeys([]);
      await loadCalculationItems();
    } catch (error) {
      console.error("批量显示失败:", error);
      addToast({
        title: "错误",
        description: "批量显示失败，请重试",
        color: "danger",
        timeout: 5000,
      });
    }
  };

  const handleBulkHide = async (ids: number[]) => {
    if (ids.length === 0) {
      addToast({
        title: "提示",
        description: "请至少选择一个项目进行操作",
        color: "primary",
        timeout: 3000,
      });

      return;
    }

    if (!window.confirm(`确定要隐藏选中的 ${ids.length} 个项目吗？`)) {
      return;
    }

    try {
      await dynamicCalculationItemService.bulkHide(ids);
      addToast({
        title: "成功",
        description: `成功隐藏了 ${ids.length} 个项目`,
        color: "success",
        timeout: 3000,
      });
      setSelectedRowKeys([]);
      await loadCalculationItems();
    } catch (error) {
      console.error("批量隐藏失败:", error);
      addToast({
        title: "错误",
        description: "批量隐藏失败，请重试",
        color: "danger",
        timeout: 5000,
      });
    }
  };

  // 处理耗材选择 - 自动填充相关信息
  const handleSupplySelect = (supply: SupplyItem) => {
    // 添加调试日志
    console.log("Selected supply:", supply);

    setCalculationFormData((prev) => ({
      ...prev,
      material_name: supply.name,
      purchaser: supply.purchaser || prev.purchaser,
      unit_price: parseFloat(supply.unit_price) || 0,
    }));
  };

  // 追料需求清洗函数
  function cleanChaseData(
    obj: Record<string, Record<string, any>>,
  ): Record<string, Record<string, any>> {
    const cleaned: Record<string, Record<string, any>> = {};

    for (const monthKey in obj) {
      if (
        monthKey &&
        monthKey !== "undefined" &&
        monthKey !== "NaN" &&
        typeof monthKey === "string"
      ) {
        cleaned[monthKey] = {};
        for (const weekKey in obj[monthKey]) {
          if (
            weekKey &&
            weekKey !== "undefined" &&
            weekKey !== "NaN" &&
            typeof weekKey === "string"
          ) {
            cleaned[monthKey][weekKey] = obj[monthKey][weekKey];
          }
        }
      }
    }

    return cleaned;
  }

  // 统一的计算函数
  const calculateActualOrder = (item: DynamicCalculationItem): number => {
    // 如果是多站别项目，从multi_station_data中获取
    if (item.is_multi_station && item.multi_station_data?.actual_order) {
      return item.multi_station_data.actual_order.reduce((sum, val) => sum + (Number(val) || 0), 0);
    }
    
    // 如果是数组类型（兼容旧数据）
    if (Array.isArray(item.actual_order)) {
      return item.actual_order.reduce((sum, val) => sum + (Number(val) || 0), 0);
    }
    
    // 如果是数字类型
    return Number(item.actual_order) || 0;
  };

  // 统一的总金额计算函数
  const calculateTotalAmount = (item: DynamicCalculationItem): number => {
    const unitPrice = Number(item.unit_price) || 0;
    const actualOrder = calculateActualOrder(item);
    return unitPrice * actualOrder;
  };

  const handleCalculationSubmit = async () => {
    let submittedFormData: Partial<DynamicCalculationItem> | null = null;

    try {
      const isEditing = !!currentCalculationItem;

      // Helper function to safely parse numbers
      const parseNumber = (value: any, isDecimal = false) => {
        if (value === undefined || value === null || value === "") {
          return 0;
        }
        const num = isDecimal
          ? parseFloat(value.toString())
          : parseInt(value.toString());

        return isNaN(num) ? 0 : num;
      };

      // Helper function to check if a value should be included
      const shouldIncludeValue = (value: any): boolean => {
        return value !== undefined && value !== null && value !== "";
      };

      // Helper function to format decimal number
      const formatDecimal = (value: number): string => {
        return value.toFixed(2);
      };

      // Calculate total amount if we have unit price
      const calculateTotalAmount = (): number => {
        const unitPrice = parseNumber(calculationFormData.unit_price, true);
        const actualOrder = parseNumber(calculationFormData.actual_order);

        return unitPrice * actualOrder;
      };

      // 构建新的动态数据结构
      const monthly_data = calculationFormData.monthly_data || {};
      const chase_data = calculationFormData.chase_data || {};
      const stock_snapshots = calculationFormData.stock_snapshots || {};

      // --- 追料需求清洗和调试输出 ---
      const cleanedChaseData = cleanChaseData(chase_data);

      console.log("原始 chase_data:", chase_data);
      console.log("清洗后 chase_data:", cleanedChaseData);

      // Ensure all necessary fields have proper types
      const formData: Partial<DynamicCalculationItem> = {
        form: applicationForm.id,

        // Basic information - integers (required)
        no: parseNumber(calculationFormData.no) || calculationItems.length + 1,

        // String fields - required with default empty string
        material_name: calculationFormData.material_name || "",
        usage_station: calculationFormData.usage_station || "",
        purchaser: calculationFormData.purchaser || "", // 确保有默认值
        moq_remark: calculationFormData.moq_remark || "",
        linked_material: calculationFormData.linked_material || "",

        // Usage metrics - integers (required)
        usage_per_set: parseNumber(calculationFormData.usage_per_set),
        usage_count: parseNumber(calculationFormData.usage_count),
        monthly_capacity: parseNumber(calculationFormData.monthly_capacity),

        // Stock levels - integers (required)
        min_stock: parseNumber(calculationFormData.min_stock),
        max_stock: parseNumber(calculationFormData.max_stock),
        monthly_demand: parseNumber(calculationFormData.monthly_demand),
        monthly_net_demand: parseNumber(calculationFormData.monthly_net_demand),
        actual_order: parseNumber(calculationFormData.actual_order),

        // Optional numeric fields - only include if they have values
        ...(shouldIncludeValue(calculationFormData.moq)
          ? { moq: parseNumber(calculationFormData.moq) }
          : {}),
        ...(shouldIncludeValue(calculationFormData.linked_supply_item_id)
          ? {
              linked_supply_item_id: parseNumber(
                calculationFormData.linked_supply_item_id,
              ),
            }
          : {}),

        // Decimal fields - only include if they have values
        ...(shouldIncludeValue(calculationFormData.unit_price)
          ? { unit_price: parseNumber(calculationFormData.unit_price, true) }
          : {}),

        // 使用新的JSON字段
        monthly_data,
        chase_data: cleanedChaseData,
        stock_snapshots,

        // Calculate total amount only if we have unit price
        ...(shouldIncludeValue(calculationFormData.unit_price)
          ? { total_amount: calculateTotalAmount() }
          : {}),
      };

      submittedFormData = formData;

      // Add debug logging
      console.log("表单提交数据:", {
        isEditing,
        currentCalculationItem,
        formData,
        applicationForm,
        calculationItems: calculationItems.length,
      });

      if (currentCalculationItem) {
        const updatedItem = await dynamicCalculationItemService.update(
          currentCalculationItem.id,
          formData,
        );

        console.log("PATCH 返回:", updatedItem);
        // 直接更新本地状态，避免重新获取数据时的竞争问题
        setCalculationItems((prevItems) =>
          prevItems.map((item) =>
            item.id === currentCalculationItem.id ? updatedItem : item,
          ),
        );
      } else {
        const newItem = await dynamicCalculationItemService.create(formData);

        console.log("创建计算项目成功");
        // 直接将新项目添加到本地状态
        setCalculationItems((prevItems) => [...prevItems, newItem]);
      }

      // 实时同步数据
      if (currentCalculationItem) {
        // 编辑模式：检查是否需要同步
        const oldActualOrder = currentCalculationItem.actual_order || 0;
        const newActualOrder = parseNumber(calculationFormData.actual_order);
        
        if (oldActualOrder !== newActualOrder) {
          // 實際請購數量发生变化，同步到进料需求
          // 让用户选择要安排在哪一周
          const targetWeek = prompt(
            '请选择要将實際請購數量安排在哪一周？\n' +
            'W01 - 第一周\n' +
            'W02 - 第二周（推荐）\n' +
            'W03 - 第三周\n' +
            'W04 - 第四周\n\n' +
            '请输入 W01/W02/W03/W04（默认W02）:',
            'W02'
          );
          
          if (targetWeek && ['W01', 'W02', 'W03', 'W04'].includes(targetWeek.toUpperCase())) {
            await handleRealTimeSync(currentCalculationItem.id, 'order_to_chase', targetWeek.toUpperCase());
          } else if (targetWeek !== null) {
            // 用户输入了无效值，使用默认值
            await handleRealTimeSync(currentCalculationItem.id, 'order_to_chase', 'W02');
          }
        }
        
        // 检查进料需求是否发生变化
        const targetMonthKey = `${monthInfo.year}-${String(monthInfo.targetMonth).padStart(2, "0")}`;
        const oldChaseData = currentCalculationItem.chase_data?.[targetMonthKey] || {};
        const newChaseData = calculationFormData.chase_data?.[targetMonthKey] || {};
        
        const oldTotal = Object.values(oldChaseData).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
        const newTotal = Object.values(newChaseData).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
        
        if (oldTotal !== newTotal) {
          // 进料需求发生变化，同步到實際請購數量
          await handleRealTimeSync(currentCalculationItem.id, 'chase_to_order');
        }
      } else {
        // 新建模式：根据数据自动同步
        const actualOrder = parseNumber(calculationFormData.actual_order);
        const targetMonthKey = `${monthInfo.year}-${String(monthInfo.targetMonth).padStart(2, "0")}`;
        const chaseData = calculationFormData.chase_data?.[targetMonthKey] || {};
        const chaseTotal = Object.values(chaseData).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
        
        if (actualOrder > 0 && chaseTotal === 0) {
          // 有實際請購數量但没有进料需求，同步到进料需求
          const newItem = await dynamicCalculationItemService.create(formData);
          await handleRealTimeSync(newItem.id, 'order_to_chase');
        } else if (chaseTotal > 0 && actualOrder === 0) {
          // 有进料需求但没有實際請購數量，同步到實際請購數量
          const newItem = await dynamicCalculationItemService.create(formData);
          await handleRealTimeSync(newItem.id, 'chase_to_order');
        }
      }

      // 关闭模态框并移除重新加载数据的调用
      setCalculationModalVisible(false);
    } catch (error) {
      console.error("提交计算项目失败:", error);
      addToast({
        title: "错误",
        description: "提交失败，请检查数据是否正确",
        color: "danger",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 批量更新采购员
  const batchUpdatePurchaser = async (purchaser: string) => {
    try {
      const response = await fetch(
        `/api/dynamic-calculation-items/batch_update_purchaser/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            form_id: applicationForm.id,
            purchaser: purchaser,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("批量设置采购员失败");
      }

      // 重新加载数据
      await loadCalculationItems();
      addToast({
        title: "成功",
        description: `成功将所有项目的采购员设置为：${purchaser}`,
        color: "success",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        ),
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("批量设置采购员失败:", error);
      addToast({
        title: "错误",
        description: "批量设置采购员失败，请重试",
        color: "danger",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 🔧 动态生成字段名称映射
  const generateFieldMapping = () => {
    const period = applicationForm.period || "2025年7月";
    const yearMatch = period.match(/(\d{4})/);
    const monthMatch = period.match(/(\d{1,2})月/);

    const year = yearMatch ? parseInt(yearMatch[1]) : 2025;
    const targetMonth = monthMatch ? parseInt(monthMatch[1]) : 7;

    // 🔧 修复：适配数据库格式，使用 ISO 格式的月份 key
    const targetMonthKey = `${year}-${targetMonth.toString().padStart(2, "0")}`; // 数据库格式：'2025-07'

    // 生成中文格式的月份标签
    const targetMonthLabel = generateChineseMonthKey("${year}年${month}月", {
      customYear: year,
      customMonth: targetMonth,
    });

    // 生成前几个月的 key，适配数据库格式
    const prevMonth1 = targetMonth - 2;
    const prevMonth1Year = year;
    const prevMonth1Key = `${prevMonth1Year}-${String(prevMonth1 > 0 ? prevMonth1 : 12).padStart(2, "0")}`; // 数据库格式：'2025-05'
    const prevMonth1StockKey = `${prevMonth1Year}/${String(prevMonth1 > 0 ? prevMonth1 : 12).padStart(2, "0")}/22`; // 数据库格式：'2025/05/22'

    const prevMonth2 = targetMonth - 1;
    const prevMonth2Year = year;
    const prevMonth2Key = `${prevMonth2Year}-${String(prevMonth2 > 0 ? prevMonth2 : 12).padStart(2, "0")}`; // 数据库格式：'2025-06'
    const prevMonth2StockKey = `${prevMonth2Year}/${String(prevMonth2 > 0 ? prevMonth2 : 12).padStart(2, "0")}/22`; // 数据库格式：'2025/06/22'

    // 使用 x-1 月作为 PR 开立时间的月份
    const prMonth = targetMonth - 1 > 0 ? targetMonth - 1 : 12;
    const prYear = targetMonth - 1 > 0 ? year : year - 1;

    // 生成前三个月的信息
    const months = [
      {
        year: prevMonth1 > 0 ? year : year - 1,
        month: prevMonth1 > 0 ? prevMonth1 : 12,
        label: `${prevMonth1 > 0 ? year : year - 1}年${prevMonth1 > 0 ? prevMonth1 : 12}月`,
        shortLabel: `${prevMonth1 > 0 ? prevMonth1 : 12}月`,
        isTarget: false,
      },
      {
        year: prevMonth2 > 0 ? year : year - 1,
        month: prevMonth2 > 0 ? prevMonth2 : 12,
        label: `${prevMonth2 > 0 ? year : year - 1}年${prevMonth2 > 0 ? prevMonth2 : 12}月`,
        shortLabel: `${prevMonth2 > 0 ? prevMonth2 : 12}月`,
        isTarget: false,
      },
      {
        year,
        month: targetMonth,
        label: `${year}年${targetMonth}月`,
        shortLabel: `${targetMonth}月`,
        isTarget: true,
      },
    ];

    return {
      year,
      targetMonth,
      targetMonthKey,
      targetMonthLabel,
      prevMonth1Key,
      prevMonth1StockKey,
      prevMonth2Key,
      prevMonth2StockKey,
      prMonth,
      prYear,
      months,
      m01Field: `W01`,
      m02Field: `W02`,
      m03Field: `W03`,
      m04Field: `W04`,
    };
  };

  // 获取字段映射
  const fieldMapping = generateFieldMapping();

  // 解析申请周期并生成动态月份信息
  const parseApplicationPeriod = () => {
    return {
      year: fieldMapping.year,
      targetMonth: fieldMapping.targetMonth,
      months: fieldMapping.months,
      targetMonthLabel: fieldMapping.targetMonthLabel,
    };
  };

  // 获取动态月份信息
  const monthInfo = parseApplicationPeriod();

  // 打开批量设置采购员模态框
  const handleOpenBatchPurchaserModal = () => {
    setBatchPurchaserName("");
    setBatchPurchaserModalVisible(true);
  };

  // 执行批量设置采购员
  const handleBatchSetPurchaser = async () => {
    if (!batchPurchaserName.trim()) {
      addToast({
        title: "错误",
        description: "请输入采购员名称",
        color: "danger",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });

      return;
    }

    const purchaserName = batchPurchaserName.trim();

    const itemsToUpdate = calculationItems.filter(
      (item) => item.purchaser !== purchaserName,
    );

    if (itemsToUpdate.length === 0) {
      addToast({
        title: "提示",
        description: "所有项目的采购员已经是这个值，无需更新",
        color: "primary",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="16" y2="12" />
            <line x1="12" x2="12" y1="8" y2="8" />
          </svg>
        ),
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
      setBatchPurchaserModalVisible(false);

      return;
    }

    const confirmMessage = `将更新 ${itemsToUpdate.length} 个项目的采购员为"${purchaserName}"，确定继续吗？`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await batchUpdatePurchaser(purchaserName);
      await loadCalculationItems();
      setBatchPurchaserModalVisible(false);
      setBatchPurchaserName("");
      addToast({
        title: "成功",
        description: `成功将 ${itemsToUpdate.length} 个项目的采购员设置为: ${purchaserName}`,
        color: "success",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        ),
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("批量设置采购员失败:", error);

      let errorMessage = "批量设置采购员失败";

      if (error instanceof Error) {
        errorMessage += `：${error.message}`;
      }

      addToast({
        title: "错误",
        description: `❌ ${errorMessage}\n\n请检查网络连接或联系管理员`,
        color: "danger",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 批量计算需求量
  const handleCalculateDemands = async () => {
    try {
      const result = await dynamicCalculationItemService.calculateDemands(
        applicationForm.id,
      );

      await loadCalculationItems();
      addToast({
        title: "成功",
        description: result.message,
        color: "success",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        ),
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("计算需求失败:", error);
      addToast({
        title: "错误",
        description: "计算失败，请重试",
        color: "danger",
        icon: (
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 导出全部表格（🧡 序号列橙色）
  const handleExportAll = () => {
    const fileName = `B453_All_Tables_${new Date().toISOString().split("T")[0]}.xlsx`;

    // 使用基础Excel导出
    const wb = XLSX.utils.book_new();
    const managementWs = createManagementSheet();

    // 设置页面设置 - 强制适应一页打印
    managementWs['!pageSetup'] = {
      fitToPage: true,        // 启用适应页面
      fitToWidth: 1,          // 适应宽度为1页
      fitToHeight: 1,         // 适应高度为1页
      orientation: 'landscape', // 横向打印
      paperSize: 9,           // A4纸张
      margins: {
        top: 0.1,             // 最小上边距
        bottom: 0.1,          // 最小下边距
        left: 0.1,            // 最小左边距
        right: 0.1,           // 最小右边距
        header: 0.1,          // 最小页眉边距
        footer: 0.1           // 最小页脚边距
      }
    };

    // 设置打印区域 - 限制打印范围到表格区域
    const managementDataEndRow = calculationItems.length; // 数据结束行
    managementWs['!printArea'] = `A1:W${managementDataEndRow + 4}`; // 设置打印区域到数据结束（包含表头）

    XLSX.utils.book_append_sheet(wb, managementWs, "B453耗材管控表");
    const calculationWs = createCalculationSheet();

    // 设置页面设置 - 强制适应一页打印
    calculationWs['!pageSetup'] = {
      fitToPage: true,        // 启用适应页面
      fitToWidth: 1,          // 适应宽度为1页
      fitToHeight: 1,         // 适应高度为1页
      orientation: 'landscape', // 横向打印
      paperSize: 9,           // A4纸张
      margins: {
        top: 0.1,             // 最小上边距
        bottom: 0.1,          // 最小下边距
        left: 0.1,            // 最小左边距
        right: 0.1,           // 最小右边距
        header: 0.1,          // 最小页眉边距
        footer: 0.1           // 最小页脚边距
      }
    };

    // 设置打印区域 - 限制打印范围到表格区域
    const calculationDataEndRow = calculationItems.length; // 数据结束行
    calculationWs['!printArea'] = `A1:L${calculationDataEndRow + 2}`; // 设置打印区域到数据结束（包含表头）

    XLSX.utils.book_append_sheet(wb, calculationWs, "B453耗材需求计算表");
    
    // 在浏览器环境中生成并下载文件
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);

    addToast({
      title: "成功 🧡✨",
      description: "全部表格导出成功！网页表格序号列显示为橙色背景",
      color: "success",
      timeout: 3000,
    });

    // 样式提示
    console.log("🎨 全部表格样式：网页序号列使用橙色背景");
  };

  // 🎨 橙色表头功能说明
  // 网页表格的序号列已设置为橙色 (bg-orange-100)
  // Excel导出使用基础版本，但会在控制台提示样式信息
  console.log("🎨 表头颜色设置：序号列使用橙色背景 (bg-orange-100)");

  

  // 辅助函数：创建管控表Sheet
  const createManagementSheet = () => {
    // 使用新的字段映射生成动态标题和表头
    const mainTitle = `TE課B453 SMT ATE ${fieldMapping.targetMonthLabel}耗材管控表`;

    // 🔧 根据实际B453图片修正：23列（A-W）标准格式
    const mainHeaders = [
      "序號", // A
      "物料描述", // B
      "單位", // C
      "採購員", // D
      "單價(RMB)", // E
      "安全庫存", // F-G (合并)
      "", // G
      "最小採購量(MOQ)", // H
      "L/T Wks", // I
      `${monthInfo.months[0].year}年${monthInfo.months[0].month}月份明細`, // J-K (合并)
      "", // K
      `${monthInfo.months[1].year}年${monthInfo.months[1].month}月份明細`, // L-M (合并)
      "", // M
      `${monthInfo.months[2].year}年${monthInfo.months[2].month}月份明細`, // N-O (合并)
      "", // O
      "PR開立時間與數量", // P-Q (合并2列)
      "", // Q
      "進料需求", // R-U (合并4列) - 包含W01-W04
      "", // S
      "", // T
      "", // U
      "总金额(RMB)", // V
      "備註", // W
    ];

    // 🔧 中间表头 - 显示日期和数量
    const middleHeaders = [
      "", // A - 序號
      "", // B - 物料描述
      "", // C - 單位
      "", // D - 採購員
      "", // E
      "最低", // F - 安全庫存-最低
      "最高", // G - 安全庫存-最高
      "", // H - MOQ
      "", // I - L/T
      `${monthInfo.months[0].year}/${monthInfo.months[0].month}/2庫存`, // J
      `${monthInfo.months[0].year}年${monthInfo.months[0].month}月份需求`, // K
      `${monthInfo.months[1].year}/${monthInfo.months[1].month}/22庫存`, // L
      `${monthInfo.months[1].year}年${monthInfo.months[1].month}月份需求`, // M
      `${monthInfo.months[2].year}/${monthInfo.months[2].month}/22庫存`, // N
      `${monthInfo.months[2].year}年${monthInfo.months[2].month}月份需求`, // O
      `${monthInfo.year}/06/19`, // P - PR開立時間與數量的日期1
      `${monthInfo.year}/06/25`, // Q - PR開立時間與數量的日期2
      `${monthInfo.targetMonth}月W01`, // R - 進料需求日期
      `${monthInfo.targetMonth}月W02`, // S - 進料需求日期
      `${monthInfo.targetMonth}月W03`, // T - 進料需求日期
      `${monthInfo.targetMonth}月W04`, // U - 進料需求日期
      "", // V - 总金额
      "", // W - 備註
    ];

    // 🔧 子表头 - 数量
    const subHeaders = [
      "", // A - 序號
      "", // B - 物料描述
      "", // C - 單位
      "", // D - 採購員
      "", // E
      "最低", // F - 安全庫存-最低（第3行，合并F3:F4）
      "最高", // G - 安全庫存-最高（第3行，合并G3:G4）
      "", // H - MOQ
      "", // I - L/T
      "", // J
      "", // K
      "", // L
      "", // M
      "", // N
      "", // O
      "數量", // P - PR開立時間與數量下的数量
      "數量", // Q - PR開立時間與數量下的数量
      "數量", // R - 進料需求数量
      "數量", // S - 進料需求数量
      "數量", // T - 進料需求数量
      "數量", // U - 進料需求数量
      "", // V - 总金额
      "", // W - 備註
    ];

    // 🔧 根据实际B453图片修正：worksheetData按照23列格式
    const worksheetData = [
      // 第0行：主标题（A1:W1合并，23列）
      [
        mainTitle,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      // 第1行：主表头
      mainHeaders,
      // 第2行：中间表头 - 新增"数量"行
      middleHeaders,
      // 第3行：子表头
      subHeaders,
      // 第3行开始：数据 - 恢复到单行格式（管控表物料与计算表物料是一对多关系）
      ...calculationItems.map((item) => {
        const targetMonthKey = `${monthInfo.year}-${String(monthInfo.targetMonth).padStart(2, "0")}`;

        return [
          item.no || "", // A - 序號
          item.material_name || "", // B - 物料描述
          "pcs", // C - 單位
          item.purchaser || "未指定", // D - 採購員
          (item.unit_price && typeof item.unit_price === "number" // E - 單價
            ? item.unit_price.toFixed(2)
            : (item.unit_price ? String(item.unit_price) : "0.00")),
          item.min_stock || 0, // F - 最低安全庫存
          item.max_stock || 0, // G - 最高安全庫存
          item.moq || "", // H - MOQ
          "15", // I - L/T
          item.monthly_data?.[ // J - 第1个月库存
            `${monthInfo.months[0].year}/${String(monthInfo.months[0].month).padStart(2, "0")}/22`
          ]?.stock ?? 0,
          item.monthly_data?.[ // K - 第1个月需求
            `${monthInfo.months[0].year}-${String(monthInfo.months[0].month).padStart(2, "0")}`
          ]?.demand ?? 0,
          item.monthly_data?.[ // L - 第2个月库存
            `${monthInfo.months[1].year}/${String(monthInfo.months[1].month).padStart(2, "0")}/22`
          ]?.stock ?? 0,
          item.monthly_data?.[ // M - 第2个月需求
            `${monthInfo.months[1].year}-${String(monthInfo.months[1].month).padStart(2, "0")}`
          ]?.demand ?? 0,
          item.monthly_data?.[ // N - 第3个月库存
            `${monthInfo.months[2].year}/${String(monthInfo.months[2].month).padStart(2, "0")}/22`
          ]?.stock ?? 0,
          item.monthly_data?.[ // O - 第3个月需求
            `${monthInfo.months[2].year}-${String(monthInfo.months[2].month).padStart(2, "0")}`
          ]?.demand ?? 0,
          item.stock_snapshots?.[`${monthInfo.year}-06-19`] ?? 0, // P - PR開立時間與數量1
          item.stock_snapshots?.[`${monthInfo.year}-06-25`] ?? 0, // Q - PR開立時間與數量2
          item.chase_data?.[targetMonthKey]?.W01 ?? 0, // R - 進料需求W01
          item.chase_data?.[targetMonthKey]?.W02 ?? 0, // S - 進料需求W02
          item.chase_data?.[targetMonthKey]?.W03 ?? 0, // T - 進料需求W03
          item.chase_data?.[targetMonthKey]?.W04 ?? 0, // U - 進料需求W04
          calculateTotalAmount(item).toFixed(2), // V - 总金额(RMB)
          item.moq_remark || "", // W - 備註 (使用moq_remark字段)
        ];
      }),

      // 备注信息行（跨列显示）
      [
        "備註：",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "合計：",
        calculationItems
          .reduce((sum, item) => sum + calculateTotalAmount(item), 0)
          .toFixed(2),
        "", // 備註列 (空内容，显示Excel原表格的备注)
      ],
      [
        "1.安全庫存要考慮用最小的資金去運轉，壓縮庫存量。",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "2.要保留歷史資料，只顯示最近三個月即可，更早月份資隱藏即可。",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "3.進,耗,存(週,月,季需求管理).",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "4.以舊/壞換新,完善庫存管理.",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],

      // 签名行：核准(B列)、審核(F列)、申请人(O列)
      [
        "",
        "核准：",
        "",
        "",
        "",
        "審核：",
        "",
        "",
        "",
        "",
        "",
        "",
        "申请人：",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 🔧 根据实际B453图片修正：设置23列的列宽
    ws["!cols"] = [
      { wch: 4.33 }, // A: 序號
      { wch: 35 }, // B: 物料描述
      { wch: 5.67 }, // C: 單位
      { wch: 7.33 }, // D: 採購員
      { wch: 9 }, // E: 單價(RMB)
      { wch: 5.33 }, // F: 安全庫存-最低
      { wch: 5.33 }, // G: 安全庫存-最高
      { wch: 12 }, // H: 最小採購量(MOQ)
      { wch: 8 }, // I: L/T Wks
      { wch: 12 }, // J: 第1月库存
      { wch: 12 }, // K: 第1月需求
      { wch: 12 }, // L: 第2月库存
      { wch: 12 }, // M: 第2月需求
      { wch: 12 }, // N: 第3月库存
      { wch: 12 }, // O: 第3月需求
      { wch: 12 }, // P: PR開立時間與數量1 - 增加宽度确保"數量"显示完整
      { wch: 12 }, // Q: PR開立時間與數量2 - 增加宽度确保"數量"显示完整
      { wch: 10 }, // R: 進料需求W01
      { wch: 10 }, // S: 進料需求W02
      { wch: 10 }, // T: 進料需求W03
      { wch: 10 }, // U: 進料需求W04
      { wch: 12 }, // V: 总金额(RMB)
      { wch: 15 }, // W: 備註
    ];

    // 动态计算备注信息的行号（在数据表格下方）
    const dynamicDataRowCount = calculationItems.length;
    const dynamicFooterStartRow = 4 + dynamicDataRowCount; // 🔧 表头现在是4行 // 表头行(3) + 数据行(N) + 空行分隔(1)

    // 🔧 根据用户反馈修正：设置合并单元格（23列版本）- 4行表头版本
    const baseMerges = [
      // 第0行：主标题行合并 A1:W1（23列）
      { s: { r: 0, c: 0 }, e: { r: 0, c: 22 } },

      // 🔧 单列字段的第2行到第4行合并（纵向合并3行）
      { s: { r: 1, c: 0 }, e: { r: 3, c: 0 } }, // A2:A4 序號
      { s: { r: 1, c: 1 }, e: { r: 3, c: 1 } }, // B2:B4 物料描述
      { s: { r: 1, c: 2 }, e: { r: 3, c: 2 } }, // C2:C4 單位
      { s: { r: 1, c: 3 }, e: { r: 3, c: 3 } }, // D2:D4 採購員
      { s: { r: 1, c: 4 }, e: { r: 3, c: 4 } }, // E2:E4 單價(RMB)
      { s: { r: 1, c: 7 }, e: { r: 3, c: 7 } }, // H2:H4 MOQ
      { s: { r: 1, c: 8 }, e: { r: 3, c: 8 } }, // I2:I4 L/T Wks
      { s: { r: 1, c: 21 }, e: { r: 3, c: 21 } }, // V2:V4 总金额(RMB)
      { s: { r: 1, c: 22 }, e: { r: 3, c: 22 } }, // W2:W4 備註

      // 🔧 主表头第2行的横向合并
      { s: { r: 1, c: 5 }, e: { r: 1, c: 6 } }, // F2:G2 安全庫存
      { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } }, // J2:K2 第1月明細
      { s: { r: 1, c: 11 }, e: { r: 1, c: 12 } }, // L2:M2 第2月明細
      { s: { r: 1, c: 13 }, e: { r: 1, c: 14 } }, // N2:O2 3rd month
      { s: { r: 1, c: 15 }, e: { r: 1, c: 16 } }, // P2:Q2 PR開立時間與數量
      { s: { r: 1, c: 17 }, e: { r: 1, c: 20 } }, // R2:U2 進料需求 - 包含4列W01-W04

      // 🔧 子表头第3行的纵向合并（F和G列的三四行合并）
      { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } }, // F3:F4 安全庫存-最低
      { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } }, // G3:G4 安全庫存-最高
      // 🔧 月度明细字段第2行与第3行纵向合并
      { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } }, // J3:J4 第1月库存
      { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } }, // K3:K4 第1月需求
      { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } }, // L3:L4 第2月库存
      { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } }, // M3:M4 第2月需求
      { s: { r: 2, c: 13 }, e: { r: 3, c: 13 } }, // N3:N4 第3月库存
      { s: { r: 2, c: 14 }, e: { r: 3, c: 14 } }, // O3:O4 第3月需求
      // 🔧 修复：PR開立時間與數量下的第三行子表头不合并，让"數量"显示完整
      // { s: { r: 2, c: 15 }, e: { r: 2, c: 19 } }, // P3:T3 追料需求下的空白 - 注释掉这个合并

      // 备注信息的合并单元格（在表格下方）- 合并4列单元格
      { s: { r: dynamicFooterStartRow, c: 0 }, e: { r: dynamicFooterStartRow, c: 3 } }, // 備註：行 A:D
      { s: { r: dynamicFooterStartRow + 1, c: 0 }, e: { r: dynamicFooterStartRow + 1, c: 3 } }, // 1.行 A:D
      { s: { r: dynamicFooterStartRow + 2, c: 0 }, e: { r: dynamicFooterStartRow + 2, c: 3 } }, // 2.行 A:D
      { s: { r: dynamicFooterStartRow + 3, c: 0 }, e: { r: dynamicFooterStartRow + 3, c: 3 } }, // 3.行 A:D
      { s: { r: dynamicFooterStartRow + 4, c: 0 }, e: { r: dynamicFooterStartRow + 4, c: 3 } }, // 4.行 A:D
    ];

    // 管控表恢复到单行格式，不需要数据行合并单元格
    ws["!merges"] = baseMerges;

    // 设置备注单元格格式 - 合并单元格左对齐
    // 为备注行的合并单元格设置格式
    for (let row = dynamicFooterStartRow; row <= dynamicFooterStartRow + 4; row++) {
      // 设置合并单元格的格式（A列，即第一列）
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (!ws[cellRef]) {
        ws[cellRef] = { v: "", t: 's' };
      }
      // 设置单元格格式：左对齐，禁用自动换行
      if (!ws[cellRef].s) ws[cellRef].s = {};
      ws[cellRef].s.alignment = {
        wrapText: false,  // 禁用自动换行
        horizontal: 'left',
        vertical: 'center'
      };
      
      // 同时设置合并单元格中其他单元格的格式，确保整个合并区域都是左对齐
      for (let col = 1; col <= 3; col++) {
        const mergeCellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[mergeCellRef]) {
          ws[mergeCellRef] = { v: "", t: 's' };
        }
        // 设置单元格格式：左对齐，禁用自动换行
        if (!ws[mergeCellRef].s) ws[mergeCellRef].s = {};
        ws[mergeCellRef].s.alignment = {
          wrapText: false,  // 禁用自动换行
          horizontal: 'left',
          vertical: 'center'
        };
      }
    }

    // 设置签名行的底部对齐
    const signatureRow = dynamicFooterStartRow + 5; // 签名行
    const signatureCells = [
      { r: signatureRow, c: 1 }, // 核准 (B列)
      { r: signatureRow, c: 5 }, // 審核 (F列)
      { r: signatureRow, c: 12 }, // 申请人 (M列)
    ];
    
    signatureCells.forEach(({ r, c }) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (ws[cellRef]) {
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.alignment = {
          horizontal: 'left',
          vertical: 'bottom'  // 底部对齐
        };
      }
    });

    // 🎯 手动设置对齐方式，避免智能对齐覆盖备注行设置
    // 遍历所有单元格，手动设置对齐
    Object.keys(ws).forEach((cellRef) => {
      if (cellRef === '!ref' || cellRef === '!merges' || cellRef === '!cols') return;
      
      const cell = ws[cellRef];
      if (!cell || !cell.v) return;
      
      const cellValue = String(cell.v);
      const { r: rowIndex, c: colIndex } = XLSX.utils.decode_cell(cellRef);
      
      // 初始化样式对象
      if (!cell.s) cell.s = {};
      if (!cell.s.alignment) cell.s.alignment = {};
      
      // 备注行特殊处理：强制左对齐，禁用自动换行
      if (rowIndex >= dynamicFooterStartRow && rowIndex <= dynamicFooterStartRow + 4) {
        cell.s.alignment.horizontal = 'left';
        cell.s.alignment.vertical = 'center';
        cell.s.alignment.wrapText = false; // 禁用自动换行
        return;
      }
      
      // 签名行特殊处理：底部对齐
      if (rowIndex === signatureRow) {
        cell.s.alignment.horizontal = 'left';
        cell.s.alignment.vertical = 'bottom';
        return;
      }
      
      // 表格数据区域：启用自动换行
      if (rowIndex >= 4 && rowIndex <= 4 + calculationItems.length) {
        // 物料描述列（B列，索引为1）左对齐，启用自动换行
        if (colIndex === 1) {
          cell.s.alignment.horizontal = 'left';
          cell.s.alignment.vertical = 'top';
          cell.s.alignment.wrapText = true; // 启用自动换行
          return;
        }
        
        // 其他列居中对齐，启用自动换行
        cell.s.alignment.horizontal = 'center';
        cell.s.alignment.vertical = 'center';
        cell.s.alignment.wrapText = true; // 启用自动换行
        return;
      }
      
      // 表头行：居中对齐，启用自动换行
      if (rowIndex >= 0 && rowIndex <= 3) {
        cell.s.alignment.horizontal = 'center';
        cell.s.alignment.vertical = 'center';
        cell.s.alignment.wrapText = true; // 启用自动换行
        return;
      }
      
      // 其他情况：居中对齐，启用自动换行
      cell.s.alignment.horizontal = 'center';
      cell.s.alignment.vertical = 'center';
      cell.s.alignment.wrapText = true; // 启用自动换行
    });

    // 🎯 特殊处理合计行的对齐 - 确保合计行和合计数值都居中显示
    const totalRowIndex = 4 + calculationItems.length; // 合计行的索引
    for (let colIndex = 0; colIndex < 23; colIndex++) {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: colIndex });
      if (ws[cellRef]) {
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.alignment) ws[cellRef].s.alignment = {};
        
        // 合计行所有单元格都居中显示
        ws[cellRef].s.alignment.horizontal = 'center';
        ws[cellRef].s.alignment.vertical = 'center';
        ws[cellRef].s.alignment.wrapText = true;
      }
    }

    // 🎨 设置字体样式：使用標楷體
    setFontStyle(ws, '標楷體', signatureRow);

    // 🎯 最后强制设置备注行左对齐，确保不被任何其他设置覆盖
    for (let row = dynamicFooterStartRow; row <= dynamicFooterStartRow + 4; row++) {
      for (let col = 0; col <= 2; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellRef]) {
          if (!ws[cellRef].s) ws[cellRef].s = {};
          if (!ws[cellRef].s.alignment) ws[cellRef].s.alignment = {};
          ws[cellRef].s.alignment.horizontal = 'left';
          ws[cellRef].s.alignment.vertical = 'center';
          ws[cellRef].s.alignment.wrapText = false; // 禁用自动换行
        }
      }
    }

    // 设置标题行高度为33
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 33 };

    // 主标题左对齐
    const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[titleCellRef]) {
      if (!ws[titleCellRef].s) ws[titleCellRef].s = {};
      if (!ws[titleCellRef].s.alignment) ws[titleCellRef].s.alignment = {};
      ws[titleCellRef].s.alignment.horizontal = 'left';
      ws[titleCellRef].s.alignment.vertical = 'center';
    }

    // 为表头行（第1-4行）设置垂直居中和文字居中，并设置填充色（第0行保持左对齐）
    for (let rowIndex = 1; rowIndex < 4; rowIndex++) {
      for (let colIndex = 0; colIndex < 23; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在，如果不存在则创建
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.alignment) ws[cellRef].s.alignment = {};
        if (!ws[cellRef].s.fill) ws[cellRef].s.fill = {};
        
        ws[cellRef].s.alignment.horizontal = 'center';
        ws[cellRef].s.alignment.vertical = 'center';
        
        // 设置填充色
        if (colIndex === 0) {
          // 序号列 - FFCC99
          ws[cellRef].s.fill.fgColor = { rgb: "FFCC99" };
        } else if (colIndex >= 1 && colIndex <= 4) {
          // 物料描述、單位、採購員、單價(RMB) - FF6666
          ws[cellRef].s.fill.fgColor = { rgb: "FF6666" };
        } else if (colIndex >= 5 && colIndex <= 8) {
          // 安全庫存-最低、最高、MOQ、L/T Wks - CCCCCFF
          ws[cellRef].s.fill.fgColor = { rgb: "CCCCFF" };
        } else if (colIndex >= 9 && colIndex <= 14) {
          // 月份明细列（2025年5月份明细、2025年6月份明细、2025年7月份明细）及其子列 - 99CCCC
          ws[cellRef].s.fill.fgColor = { rgb: "99CCCC" };
        } else if (colIndex >= 15 && colIndex <= 16) {
          // PR開立時間與數量列（P和Q列） - FFFF00
          ws[cellRef].s.fill.fgColor = { rgb: "FFFF00" };
        } else if (colIndex >= 17 && colIndex <= 20) {
          // 進料需求列（R-U列）表头 - 99CCCC
          ws[cellRef].s.fill.fgColor = { rgb: "99CCCC" };
        } else if (colIndex === 21) {
          // 总金额(RMB)列（V列）表头 - 99CCCC
          ws[cellRef].s.fill.fgColor = { rgb: "99CCCC" };
        } else if (colIndex === 22) {
          // 備註列（W列）表头 - 浅青色
          ws[cellRef].s.fill = {
            fgColor: { rgb: "99CCCC" },
            patternType: "solid"
          };
        }
      }
    }

    // 为数据行设置颜色和对齐（只处理耗材数据行）
    for (let rowIndex = 4; rowIndex < 4 + calculationItems.length; rowIndex++) {
      for (let colIndex = 0; colIndex < 23; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在，如果不存在则创建
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.fill) ws[cellRef].s.fill = {};
        if (!ws[cellRef].s.alignment) ws[cellRef].s.alignment = {};
        
        // 设置数据行的对齐方式
        if (colIndex === 1) {
          // 物料描述列 - 左对齐
          ws[cellRef].s.alignment.horizontal = 'left';
          ws[cellRef].s.alignment.vertical = 'center';
        } else if (colIndex === 4 || colIndex === 21) {
          // 单价列和总金额列 - 居中对齐
          ws[cellRef].s.alignment.horizontal = 'center';
          ws[cellRef].s.alignment.vertical = 'center';
        } else {
          // 其他列 - 居中对齐
          ws[cellRef].s.alignment.horizontal = 'center';
          ws[cellRef].s.alignment.vertical = 'center';
        }
        
        // 设置数据行的填充色
        if (colIndex >= 0 && colIndex <= 8) {
          // 序号列、物料描述、單位、採購員、單價、安全庫存、MOQ、L/T列数据单元格 - 白色背景
          ws[cellRef].s.fill.fgColor = { rgb: "FFFFFF" };
        } else if (colIndex >= 9 && colIndex <= 14) {
          // 月份明细列（2025年5月份明细、2025年6月份明细、2025年7月份明细）数据单元格 - 99CCCC
          ws[cellRef].s.fill.fgColor = { rgb: "99CCCC" };
        } else if (colIndex >= 15 && colIndex <= 16) {
          // PR開立時間與數量列（P和Q列）数据单元格 - FFFF00
          ws[cellRef].s.fill.fgColor = { rgb: "FFFF00" };
        } else if (colIndex >= 17 && colIndex <= 20) {
          // 進料需求列（R-U列）数据单元格 - 99CCCC
          ws[cellRef].s.fill.fgColor = { rgb: "99CCCC" };
        } else if (colIndex === 21) {
          // 总金额(RMB)列（V列）数据单元格 - 99CCCC
          ws[cellRef].s.fill.fgColor = { rgb: "99CCCC" };
        } else if (colIndex === 22) {
          // 備註列（W列）数据单元格 - 浅青色
          ws[cellRef].s.fill = {
            fgColor: { rgb: "99CCCC" },
            patternType: "solid"
          };
        }
      }
    }

    // 为備註行开始往后的所有行设置白色背景
    for (let rowIndex = 4 + calculationItems.length; rowIndex < 4 + calculationItems.length + 5; rowIndex++) {
      for (let colIndex = 0; colIndex < 23; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在，如果不存在则创建
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.fill) ws[cellRef].s.fill = {};
        
        // 備註行开始往后的所有行都是白色背景
        ws[cellRef].s.fill.fgColor = { rgb: "FFFFFF" };
      }
    }

    // 设置表头行高度（第1行改为33，第2-4行保持30）
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 33 }; // 主标题行高度
    ws['!rows'][1] = { hpt: 30 }; // 主表头行高度
    ws['!rows'][2] = { hpt: 30 }; // 中间表头行高度
    ws['!rows'][3] = { hpt: 30 }; // 子表头行高度
    
    // 设置签名行高度为67
    ws['!rows'][signatureRow] = { hpt: 67 };

    // 🎯 设置表格网格线 - 只给表格数据区域设置边框
    const headerStartRow = 1; // 表头开始行（第2行，索引为1）
    const headerEndRow = 3; // 表头结束行（第4行，索引为3）
    const tableStartRow = 4; // 表格数据开始行（第5行，索引为4）
    const tableEndRow = 3 + calculationItems.length; // 表格数据结束行（包含合计行）
    const tableStartCol = 0; // 表格开始列（A列，索引为0）
    const tableEndCol = 22; // 表格结束列（W列，索引为22）

    // 为表头区域的所有单元格设置边框
    for (let rowIndex = headerStartRow; rowIndex <= headerEndRow; rowIndex++) {
      for (let colIndex = tableStartCol; colIndex <= tableEndCol; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.border) ws[cellRef].s.border = {};
        
        // 设置表头边框样式
        ws[cellRef].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };
      }
    }

    // 为表格数据区域的所有单元格设置边框
    for (let rowIndex = tableStartRow; rowIndex <= tableEndRow; rowIndex++) {
      for (let colIndex = tableStartCol; colIndex <= tableEndCol; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.border) ws[cellRef].s.border = {};
        
        // 设置数据区域边框样式
        ws[cellRef].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };
      }
    }

    return ws;
  };

// 设置字体样式函数
const setFontStyle = (ws: any, fontName: string = '標楷體', signatureRow?: number) => {
  // 遍历所有单元格，设置字体
  Object.keys(ws).forEach((cellRef) => {
    if (cellRef === '!ref' || cellRef === '!merges' || cellRef === '!cols') return;
    
    const cell = ws[cellRef];
    if (!cell || !cell.v) return;
    
    // 初始化样式对象
    if (!cell.s) cell.s = {};
    if (!cell.s.font) cell.s.font = {};
    if (!cell.s.alignment) cell.s.alignment = {};
    
    // 设置字体
    cell.s.font.name = fontName;
    
    // 检查是否为标题行（第一行）
    const rowIndex = XLSX.utils.decode_cell(cellRef).r;
    const colIndex = XLSX.utils.decode_cell(cellRef).c;
    
    if (rowIndex === 0) {
      // 标题行使用22号字体
      cell.s.font.sz = 22;
      cell.s.font.bold = true; // 标题加粗
    } else {
      // 其他行使用11号字体
      cell.s.font.sz = 11;
      
      // 为耗材描述列（B列，索引为1）设置自动换行
      if (colIndex === 1) {
        cell.s.alignment.wrapText = true; // 启用自动换行
        cell.s.alignment.vertical = 'top'; // 顶部对齐
      }
      
      // 为签名行设置底部对齐
      if (signatureRow !== undefined && rowIndex === signatureRow) {
        cell.s.alignment.vertical = 'bottom'; // 底部对齐
      }
    }
  });

  return ws;
};

// 🆕 智能合并分析函数
  const analyzeSmartMergeableColumns = (multiStationData: any) => {
    const stations = multiStationData.stations || [];

    if (stations.length <= 1) return [];

    const mergeableColumns: Array<{
      columnIndex: number;
      columnName: string;
      fieldName: string;
      commonValue: any;
    }> = [];

    // 定义要检查的列映射（列索引从0开始）
    const columnsToCheck = [
      { index: 4, name: "使用次数", field: "usage_count" },
      { index: 5, name: "当月产能", field: "monthly_capacity" },
      { index: 11, name: "备注(MOQ)", field: "moq_remark" },
    ];

    for (const column of columnsToCheck) {
      const fieldData = multiStationData[column.field];

      if (!fieldData || !Array.isArray(fieldData)) continue;

      // 检查是否所有站别的值都相同且不为空
      const firstValue = fieldData[0];

      if (
        firstValue !== undefined &&
        firstValue !== null &&
        firstValue !== "" &&
        fieldData.every((value) => value === firstValue)
      ) {
        mergeableColumns.push({
          columnIndex: column.index,
          columnName: column.name,
          fieldName: column.field,
          commonValue: firstValue,
        });
      }
    }

    return mergeableColumns;
  };

  // 辅助函数：创建计算表Sheet
  const createCalculationSheet = () => {
    const sixMonthCapacity =
      forecastData.length > 0
        ? forecastData[0].forecast_data?.capacity_forecast
            ?.six_month_capacity || {}
        : {};

    // 生成表头
    const calculationData = [
      [
        `TE課B453 SMT ATE ${applicationForm.period}耗材需求計算`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "No.",
        "料材名稱",
        "使用站別",
        "每臺機用量",
        "使用次數",
        `${monthInfo.targetMonthLabel}產能`,
        "最低庫存數量",
        "最低庫存總數",
        "最高庫存數量",
        `${monthInfo.targetMonthLabel}需求`,
        `${monthInfo.targetMonthLabel}網路需求`,
        "實際訂購數量",
        "備註(MOQ)",
      ],
    ];

    // 处理数据行，支持多站别展开 (调整起始行号+10，因为添加了10行表头信息)
    const dataRows: any[][] = [];
    const merges: {
      s: { r: number; c: number };
      e: { r: number; c: number };
    }[] = [];
    let currentRowIndex = 12; // 调整起始行号为12，因为前面有10行申购人备注信息 + 1行标题 + 1行表头 // 从第3行开始（0为标题行，1为表头行）

    calculationItems.forEach((item) => {
      if (
        item.is_multi_station &&
        item.multi_station_data &&
        item.multi_station_data.stations?.length > 0
      ) {
        // 多站别项目 - 展开为多行
        const stations = item.multi_station_data.stations;
        const stationCount = stations.length;
        const startRowIndex = currentRowIndex;

        // 添加每个站别的数据行
        stations.forEach((station, index) => {
          dataRows.push([
            index === 0 ? String(item.no || "") : "", // 只在第一行显示序号
            index === 0 ? String(item.material_name || "") : "", // 只在第一行显示物料名称
            String(station || ""),
            Number(item.multi_station_data!.usage_per_set[index] || 0),
            Number(item.multi_station_data!.usage_count[index] || 0),
            Number(item.multi_station_data!.monthly_capacity[index] || 0),
            Number(item.multi_station_data!.min_stock[index] || 0),
            Number((item.multi_station_data as any)?.min_total_stock?.[index] || item.multi_station_data!.min_stock[index] || 0),
            Number(item.multi_station_data!.max_stock[index] || 0),
            Number(item.multi_station_data!.monthly_demand[index] || 0),
            Number(item.multi_station_data!.monthly_net_demand[index] || 0),
            Number(item.multi_station_data!.actual_order[index] || 0),
            String(item.multi_station_data!.moq_remark[index] || ""),
          ]);
          currentRowIndex++;
        });

        // 🆕 增强版智能合并单元格逻辑
        // 定义基础合并列
        const basicMergeColumns = [
          { col: 0, name: "序号" },
          { col: 1, name: "物料名称" },
        ];
        // 智能合并列
        const smartMergeableColumns = analyzeSmartMergeableColumns(
          item.multi_station_data!,
        );

        for (const mergeCol of basicMergeColumns) {
          merges.push({
            s: { r: startRowIndex, c: mergeCol.col },
            e: { r: startRowIndex + stationCount - 1, c: mergeCol.col },
          });
        }
        for (const smartCol of smartMergeableColumns) {
          merges.push({
            s: { r: startRowIndex, c: smartCol.columnIndex },
            e: { r: startRowIndex + stationCount - 1, c: smartCol.columnIndex },
          });
          // 在第一行显示合并的值，其他行留空
          for (let i = 1; i < stationCount; i++) {
            dataRows[dataRows.length - stationCount + i][smartCol.columnIndex] =
              "";
          }
        }
      } else {
        // 单站别项目 - 直接添加一行
        dataRows.push({
          ...item,
          key: String(item.id),
          id: String(item.id),
          stationIndex: 0,
          stationCount: 1,
          originalId: item.id,
        } as any);
        currentRowIndex++;
      }
    });

    // 将数据行添加到表格数据中
    calculationData.push(...dataRows);

    // 添加备注信息（放在表格下方）
    calculationData.push(
      // 备注信息行（跨列显示）
      [
        "備註：",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "合計：",
        calculationItems
          .reduce((sum: number, item: any) => {
            return sum + (item.unit_price || 0) * (item.actual_order || 0);
          }, 0)
          .toFixed(2),
      ],
      [
        "1.安全庫存要考慮用最小的資金去運轉，壓縮庫存量。",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "2.要保留歷史資料，只顯示最近三個月即可，更早月份資隱藏即可。",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "3.進,耗,存(週,月,季需求管理).",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "4.以舊/壞換新,完善庫存管理.",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],

      // 签名行：核准(B列)、審核(F列)、申请人(I列)
      [
        "",
        "核准：",
        "",
        "",
        "",
        "審核：",
        "",
        "",
        "申请人：",
        "",
        "",
        "",
      ],

      // 空行分隔
      ["", "", "", "", "", "", "", "", "", "", "", ""],

      // 说明和预测数据
      [
        `${monthInfo.targetMonthLabel}產能按${monthInfo.targetMonthLabel}Cum Input Qty為準`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        `${monthInfo.targetMonthLabel}需求=${monthInfo.targetMonthLabel}產能*每臺機用量/使用次數`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "最低庫存=六個月中最低產能*每臺機用量/使用次數",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "最高庫存=六個月中最高產能*每臺機用量/使用次數",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      ["", "", "", "", "", "", "", "", "", "", "", ""],
      ["產能預測", "", "", "", "", "", "", "", "", "", "", ""],
      ["Item", ...Object.keys(sixMonthCapacity).map((key) => String(key)), ""],
      [
        "Forecast",
        ...Object.values(sixMonthCapacity).map((value) => String(value || "")),
        "",
      ],
    );

    const ws = XLSX.utils.aoa_to_sheet(calculationData);

    ws["!cols"] = [
      { wch: 8 }, // A: No.
      { wch: 35 }, // B: 料材名稱
      { wch: 5.67 }, // C: 使用站別
      { wch: 7.33 }, // D: 每臺機用量
      { wch: 9 }, // E: 使用次數
      { wch: 5.33 }, // F: 產能
      { wch: 5.33 }, // G: 最低庫存數量
      { wch: 5.33 }, // H: 最低庫存總數
      { wch: 15 }, // I: 最高庫存數量
      { wch: 12 }, // J: 需求
      { wch: 15 }, // K: 網路需求
      { wch: 15 }, // L: 實際訂購數量
      { wch: 15 }, // M: 備註(MOQ)
    ];

    // 动态计算备注信息的行号（在数据表格下方）
    const calculationDataRowCount = dataRows.length;
    const calculationFooterStartRow = 2 + calculationDataRowCount; // 表头行(2) + 数据行(N)，计算表保持2行表头

    // 合并单元格：标题行 + 多站别数据的序号和物料名称列 + 备注信息
    const headerMerges = [
      // 标题行合并 (第0行)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },

      // 备注信息的合并单元格（在表格下方）- 合并3列单元格
      { s: { r: calculationFooterStartRow, c: 0 }, e: { r: calculationFooterStartRow, c: 2 } }, // 備註：行 A:C
      { s: { r: calculationFooterStartRow + 1, c: 0 }, e: { r: calculationFooterStartRow + 1, c: 2 } }, // 1.行 A:C
      { s: { r: calculationFooterStartRow + 2, c: 0 }, e: { r: calculationFooterStartRow + 2, c: 2 } }, // 2.行 A:C
      { s: { r: calculationFooterStartRow + 3, c: 0 }, e: { r: calculationFooterStartRow + 3, c: 2 } }, // 3.行 A:C
      { s: { r: calculationFooterStartRow + 4, c: 0 }, e: { r: calculationFooterStartRow + 4, c: 2 } }, // 4.行 A:C
    ];

    ws["!merges"] = [...headerMerges, ...merges];

    // 设置备注单元格格式 - 禁用自动换行，允许文本溢出
    // 为备注行的每个单元格设置格式，禁用自动换行
    for (let row = calculationFooterStartRow; row <= calculationFooterStartRow + 4; row++) {
      for (let col = 0; col < 12; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        // 设置单元格格式：禁用自动换行，允许文本溢出
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.alignment = {
          wrapText: false,  // 禁用自动换行
          horizontal: 'left',
          vertical: 'center'
        };
      }
    }

    // 设置签名行的底部对齐
    const signatureRow = calculationFooterStartRow + 5; // 签名行
    const signatureCells = [
      { r: signatureRow, c: 1 }, // 核准 (B列)
      { r: signatureRow, c: 5 }, // 審核 (F列)
      { r: signatureRow, c: 8 }, // 申请人 (I列)
    ];
    
    signatureCells.forEach(({ r, c }) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (ws[cellRef]) {
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.alignment = {
          horizontal: 'left',
          vertical: 'bottom'  // 底部对齐
        };
      }
    });

    // 🎯 手动设置对齐方式，避免智能对齐覆盖备注行设置
    // 遍历所有单元格，手动设置对齐
    Object.keys(ws).forEach((cellRef) => {
      if (cellRef === '!ref' || cellRef === '!merges' || cellRef === '!cols') return;
      
      const cell = ws[cellRef];
      if (!cell || !cell.v) return;
      
      const cellValue = String(cell.v);
      const { r: rowIndex, c: colIndex } = XLSX.utils.decode_cell(cellRef);
      
      // 初始化样式对象
      if (!cell.s) cell.s = {};
      if (!cell.s.alignment) cell.s.alignment = {};
      
      // 备注行特殊处理：强制左对齐，禁用自动换行
      if (rowIndex >= calculationFooterStartRow && rowIndex <= calculationFooterStartRow + 4) {
        cell.s.alignment.horizontal = 'left';
        cell.s.alignment.vertical = 'center';
        cell.s.alignment.wrapText = false; // 禁用自动换行
        return;
      }
      
      // 签名行特殊处理：底部对齐
      if (rowIndex === signatureRow) {
        cell.s.alignment.horizontal = 'left';
        cell.s.alignment.vertical = 'bottom';
        return;
      }
      
      // 表格数据区域：启用自动换行
      if (rowIndex >= 2 && rowIndex <= 2 + dataRows.length) {
        // 物料描述列（B列，索引为1）左对齐，启用自动换行
        if (colIndex === 1) {
          cell.s.alignment.horizontal = 'left';
          cell.s.alignment.vertical = 'top';
          cell.s.alignment.wrapText = true; // 启用自动换行
          return;
        }
        
        // 其他列居中对齐，启用自动换行
        cell.s.alignment.horizontal = 'center';
        cell.s.alignment.vertical = 'center';
        cell.s.alignment.wrapText = true; // 启用自动换行
        return;
      }
      
      // 表头行：居中对齐，启用自动换行
      if (rowIndex >= 0 && rowIndex <= 1) {
        cell.s.alignment.horizontal = 'center';
        cell.s.alignment.vertical = 'center';
        cell.s.alignment.wrapText = true; // 启用自动换行
        return;
      }
      
      // 其他情况：居中对齐，启用自动换行
      cell.s.alignment.horizontal = 'center';
      cell.s.alignment.vertical = 'center';
      cell.s.alignment.wrapText = true; // 启用自动换行
    });

    // 🎨 设置字体样式：使用標楷體
    setFontStyle(ws, '標楷體', signatureRow);

    // 🎯 最后强制设置备注行左对齐，确保不被任何其他设置覆盖
    for (let row = calculationFooterStartRow; row <= calculationFooterStartRow + 4; row++) {
      for (let col = 0; col <= 2; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellRef]) {
          if (!ws[cellRef].s) ws[cellRef].s = {};
          if (!ws[cellRef].s.alignment) ws[cellRef].s.alignment = {};
          ws[cellRef].s.alignment.horizontal = 'left';
          ws[cellRef].s.alignment.vertical = 'center';
          ws[cellRef].s.alignment.wrapText = false; // 禁用自动换行
        }
      }
    }

    // 主标题左对齐
    const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[titleCellRef]) {
      if (!ws[titleCellRef].s) ws[titleCellRef].s = {};
      if (!ws[titleCellRef].s.alignment) ws[titleCellRef].s.alignment = {};
      ws[titleCellRef].s.alignment.horizontal = 'left';
      ws[titleCellRef].s.alignment.vertical = 'center';
    }

    // 设置表头行高度（第1行改为33，第2行保持30）
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 33 }; // 主标题行高度
    ws['!rows'][1] = { hpt: 30 }; // 表头行高度
    
    // 设置签名行高度为67
    ws['!rows'][signatureRow] = { hpt: 67 };

    // 为表头行设置填充色（第0行保持左对齐）
    for (let rowIndex = 1; rowIndex < 2; rowIndex++) {
      for (let colIndex = 0; colIndex < 12; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        if (ws[cellRef]) {
          if (!ws[cellRef].s) ws[cellRef].s = {};
          if (!ws[cellRef].s.fill) ws[cellRef].s.fill = {};
          
          // 设置填充色
          if (colIndex === 0) {
            // 序号列 - FFCC99
            ws[cellRef].s.fill.fgColor = { rgb: "FFCC99" };
          } else if (colIndex >= 1 && colIndex <= 4) {
            // 物料描述、單位、採購員、單價(RMB) - FF6666
            ws[cellRef].s.fill.fgColor = { rgb: "FF6666" };
          } else if (colIndex >= 5 && colIndex <= 8) {
            // 安全庫存-最低、最高、MOQ、L/T Wks - CCCCCFF
            ws[cellRef].s.fill.fgColor = { rgb: "CCCCFF" };
          }
        }
      }
    }

    // 🎯 设置表格网格线 - 只给表格数据区域设置边框
    const headerStartRow = 1; // 表头开始行（第2行，索引为1）
    const headerEndRow = 1; // 表头结束行（第2行，索引为1）
    const tableStartRow = 2; // 表格数据开始行（第3行，索引为2）
    const tableEndRow = 1 + calculationItems.length; // 表格数据结束行
    const tableStartCol = 0; // 表格开始列（A列，索引为0）
    const tableEndCol = 11; // 表格结束列（L列，索引为11）

    // 为表头区域的所有单元格设置边框
    for (let rowIndex = headerStartRow; rowIndex <= headerEndRow; rowIndex++) {
      for (let colIndex = tableStartCol; colIndex <= tableEndCol; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.border) ws[cellRef].s.border = {};
        
        // 设置表头边框样式
        ws[cellRef].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };
      }
    }

    // 为表格数据区域的所有单元格设置边框
    for (let rowIndex = tableStartRow; rowIndex <= tableEndRow; rowIndex++) {
      for (let colIndex = tableStartCol; colIndex <= tableEndCol; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.border) ws[cellRef].s.border = {};
        
        // 设置数据区域边框样式
        ws[cellRef].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };
      }
    }

    return ws;
  };

  // 导出管控表 - B453标准格式（🧡 序号列橙色）
  const handleExportManagement = () => {
    const fileName = `B453_SMT_ATE耗材管控表_${new Date().toISOString().split("T")[0]}.xlsx`;

    // 使用基础Excel导出
    const wb = XLSX.utils.book_new();
    const ws = createManagementSheet();

    // 设置页面设置 - 强制适应一页打印
    ws['!pageSetup'] = {
      fitToPage: true,        // 启用适应页面
      fitToWidth: 1,          // 适应宽度为1页
      fitToHeight: 1,         // 适应高度为1页
      orientation: 'landscape', // 横向打印
      paperSize: 9,           // A4纸张
      margins: {
        top: 0.1,             // 最小上边距
        bottom: 0.1,          // 最小下边距
        left: 0.1,            // 最小左边距
        right: 0.1,           // 最小右边距
        header: 0.1,          // 最小页眉边距
        footer: 0.1           // 最小页脚边距
      }
    };

    // 设置打印区域 - 限制打印范围到表格区域
    const dataEndRow = calculationItems.length; // 数据结束行
    ws['!printArea'] = `A1:W${dataEndRow + 4}`; // 设置打印区域到数据结束（包含表头）

    XLSX.utils.book_append_sheet(wb, ws, "B453耗材管控表");
    
    // 在浏览器环境中生成并下载文件
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);

    // 🎨 提示用户关于样式设置
    addToast({
      title: "成功 🧡",
      description: "管控表导出成功！网页表格序号列显示为橙色背景",
      color: "success",
      timeout: 3000,
    });

    // 在控制台提供样式信息
    console.log("🎨 Excel导出提示：");
    console.log("  • 网页表格：序号列使用橙色背景 (bg-orange-100)");
    console.log("  • Excel文件：使用标准格式导出");
    console.log("  • 如需Excel中显示颜色，请手动设置序号列为橙色背景");
  };

  // 导出计算表（🧡 序号列橙色）
  const handleExportCalculation = () => {
    const fileName = `B453_SMT_ATE耗材需求計算_${new Date().toISOString().split("T")[0]}.xlsx`;

    // 使用基础Excel导出
    const wb = XLSX.utils.book_new();
    const ws = createCalculationSheet();

    // 设置页面设置 - 强制适应一页打印
    ws['!pageSetup'] = {
      fitToPage: true,        // 启用适应页面
      fitToWidth: 1,          // 适应宽度为1页
      fitToHeight: 1,         // 适应高度为1页
      orientation: 'landscape', // 横向打印
      paperSize: 9,           // A4纸张
      margins: {
        top: 0.1,             // 最小上边距
        bottom: 0.1,          // 最小下边距
        left: 0.1,            // 最小左边距
        right: 0.1,           // 最小右边距
        header: 0.1,          // 最小页眉边距
        footer: 0.1           // 最小页脚边距
      }
    };

    // 设置打印区域 - 限制打印范围到表格区域
    const dataEndRow = calculationItems.length; // 数据结束行
    ws['!printArea'] = `A1:L${dataEndRow + 2}`; // 设置打印区域到数据结束（包含表头）

    XLSX.utils.book_append_sheet(wb, ws, "B453耗材需求計算");
    
    // 在浏览器环境中生成并下载文件
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);

    addToast({
      title: "成功 🧡",
      description: "计算表导出成功！网页表格序号列显示为橙色背景",
      color: "success",
      timeout: 3000,
    });

    // 样式提示
    console.log("🎨 计算表样式：网页序号列使用橙色背景");
  };

  // 导出预测数据
  const handleExportForecast = () => {
    const wb = XLSX.utils.book_new();

    const forecastSheetData = [
      [
        `TE課B453 SMT ATE ${applicationForm.period}預測數據`,
        "",
        "",
        "",
        "",
        "",
      ],
      ["預測項目", "3月", "4月", "5月", "6月", "7月"],
      ...forecastData.map((forecast) => [
        forecast.name,
        (forecast.forecast_data?.capacity_forecast as any)?.mar_25 || "",
        (forecast.forecast_data?.capacity_forecast as any)?.apr_25 || "",
        (forecast.forecast_data?.capacity_forecast as any)?.may_25 || "",
        (forecast.forecast_data?.capacity_forecast as any)?.jun_25 || "",
        (forecast.forecast_data?.capacity_forecast as any)?.jul_25 || "",
      ]),
      ["", "", "", "", "", ""],
      ["PRPM立項安排", "", "", "", "", ""],
      ["物料", "預計立項時間", "", "", "", ""],
    ];

    if (
      forecastData.length > 0 &&
      forecastData[0].forecast_data?.prpm_schedule
    ) {
      Object.entries(forecastData[0].forecast_data.prpm_schedule).forEach(
        ([material, date]) => {
          forecastSheetData.push([material, String(date), "", "", "", ""]);
        },
      );
    }

    const ws = XLSX.utils.aoa_to_sheet(forecastSheetData);

    ws["!cols"] = [
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

    // 🎯 使用智能对齐：预测项目名称左对齐，数值居中
    setSmartAlignment(ws, {
      leftAlignColumns: [0], // 预测项目（A列）左对齐
      leftAlignKeywords: [
        // 预测相关标题
        "預測數據",
        "B453",
        "TE課",
        // 预测内容
        "PRPM立項安排",
        "物料",
        "預計立項時間",
        // 备注关键词
        "備註",
        "備註：",
        // 合计行（特殊处理：居中显示）
        "合計",
      ],
    });

    // 🎨 设置字体样式：使用微软正黑体替代標楷體
    setFontStyle(ws, 'Microsoft JhengHei');

    // 设置表头行高度（第1行改为33，第2行保持30）
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 33 }; // 主标题行高度
    ws['!rows'][1] = { hpt: 30 }; // 表头行高度

    // 🎯 设置表格网格线 - 只给表格数据区域设置边框
    const headerStartRow = 1; // 表头开始行（第2行，索引为1）
    const headerEndRow = 1; // 表头结束行（第2行，索引为1）
    const tableStartRow = 2; // 表格数据开始行（第3行，索引为2）
    const tableEndRow = 1 + forecastData.length; // 表格数据结束行
    const tableStartCol = 0; // 表格开始列（A列，索引为0）
    const tableEndCol = 5; // 表格结束列（F列，索引为5）

    // 为表头区域的所有单元格设置边框
    for (let rowIndex = headerStartRow; rowIndex <= headerEndRow; rowIndex++) {
      for (let colIndex = tableStartCol; colIndex <= tableEndCol; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.border) ws[cellRef].s.border = {};
        
        // 设置表头边框样式
        ws[cellRef].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };
      }
    }

    // 为表格数据区域的所有单元格设置边框
    for (let rowIndex = tableStartRow; rowIndex <= tableEndRow; rowIndex++) {
      for (let colIndex = tableStartCol; colIndex <= tableEndCol; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在
        if (!ws[cellRef]) {
          ws[cellRef] = { v: "", t: 's' };
        }
        
        if (!ws[cellRef].s) ws[cellRef].s = {};
        if (!ws[cellRef].s.border) ws[cellRef].s.border = {};
        
        // 设置数据区域边框样式
        ws[cellRef].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };
      }
    }

    // 设置页面设置 - 确保分页预览中只显示1页
    ws['!pageSetup'] = {
      fitToPage: true,        // 启用适应页面
      fitToWidth: 1,          // 适应宽度为1页
      fitToHeight: 1,         // 适应高度为1页
      orientation: 'landscape', // 横向打印
      paperSize: 9,           // A4纸张
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5,
        header: 0.3,
        footer: 0.3
      }
    };

    // 设置打印区域 - 限制打印范围到表格区域
    const dataEndRow = forecastData.length; // 数据结束行
    ws['!printArea'] = `A1:F${dataEndRow + 2}`; // 设置打印区域到数据结束（包含表头）

    XLSX.utils.book_append_sheet(wb, ws, "B453預測數據");

    const fileName = `B453_SMT_ATE預測數據_${new Date().toISOString().split("T")[0]}.xlsx`;

    // 在浏览器环境中生成并下载文件
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    addToast({
      title: "成功",
      description: "预测数据导出成功",
      color: "success",
      icon: (
        <svg
          fill="none"
          height="20"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="20"
        >
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    });
  };

  

  // 更新表格渲染逻辑 - 动态生成列
  const managementViewColumns =
    useMemo((): ColumnsType<DynamicCalculationItem> => {
      const periodInfo = parseApplicationPeriod();
      const { year, months } = periodInfo;

      const baseColumns: ColumnsType<DynamicCalculationItem> = [
        {
          title: "序號",
          dataIndex: "no",
          key: "no",
          fixed: "left",
          width: 60,
          className: "bg-orange-100",
        },
        {
          title: "物料描述",
          dataIndex: "material_name",
          key: "material_name",
          fixed: "left",
          width: 250,
        },
        {
          title: "操作",
          key: "action",
          fixed: "left",
          width: 80,
          render: (_: any, record: any) => {
            // 🔧 管控表专用操作列：普通数据，不需要复杂的rowSpan逻辑
            return (
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="操作菜单">
                  <DropdownItem
                    key="edit"
                    onPress={() => {
                      // 管控表使用标准编辑功能
                      handleEditCalculationItem(record);
                    }}
                  >
                    编辑
                  </DropdownItem>
                  <DropdownItem
                    key="toggle"
                    onPress={() => {
                      const title =
                        (record as any).is_visible !== false
                          ? "确定隐藏该项目吗?"
                          : "确定显示该项目吗?";

                      if (window.confirm(title)) {
                        handleToggleVisibility(record);
                      }
                    }}
                  >
                    {(record as any).is_visible !== false ? "隐藏" : "显示"}
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    onPress={() => {
                      if (window.confirm("确定永久删除吗?")) {
                        handleDeleteCalculationItem(record.id);
                      }
                    }}
                  >
                    删除
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            );
          },
        },
        {
          title: "單位",
          dataIndex: "unit",
          key: "unit",
          width: 60,
          render: () => "pcs",
        },
        {
          title: "採購員",
          dataIndex: "purchaser",
          key: "purchaser",
          width: 80,
        },
        {
          title: "單價(RMB)",
          dataIndex: "unit_price",
          key: "unit_price",
          width: 100,
          render: (val: string | number) => {
            if (val === null || val === undefined) return "0.00";
            const num = parseFloat(String(val));

            return isNaN(num) ? "0.00" : num.toFixed(2);
          },
        },
        {
          title: "安全庫存",
          children: [
            {
              title: "最低",
              dataIndex: "min_stock",
              key: "min_stock",
              width: 80,
            },
            {
              title: "最高",
              dataIndex: "max_stock",
              key: "max_stock",
              width: 80,
            },
          ],
        },
        { title: "MOQ", dataIndex: "moq", key: "moq", width: 80 },
        { title: "L/T Wks", key: "lead_time", width: 80, render: () => 15 },
      ];

      // 动态生成过去三个月的列（多级表头结构，库存为上月22日）
      const monthColumns: ColumnsType<DynamicCalculationItem> = months
        .slice(0, 3)
        .map((m) => {
          // 计算上一个月
          let prevMonth = m.month - 1;
          let prevYear = m.year;

          if (prevMonth <= 0) {
            prevMonth = 12;
            prevYear = m.year - 1;
          }
          const prevMonthStr = String(prevMonth).padStart(2, "0");

          // 适配数据库中的 key 格式
          const monthKey = `${m.year}-${String(m.month).padStart(2, "0")}`; // 数据库格式：'2025-05'
          const prevMonthStockKey = `${prevYear}/${String(prevMonth).padStart(2, "0")}/22`; // 数据库格式：'2025/04/22'

          return {
            title: `${m.year}年${m.month}月份明細`,
            children: [
              {
                title: `${prevYear}/${prevMonthStr}/22庫存`,
                dataIndex: ["monthly_data", prevMonthStockKey, "stock"],
                key: `${prevYear}_${prevMonthStr}_22_stock`,
                width: 120,
                render: (val: number) => val || 0,
              },
              {
                title: `${m.year}年${m.month}月需求`,
                dataIndex: ["monthly_data", monthKey, "demand"],
                key: `${m.year}_${m.month}_demand`,
                width: 120,
                render: (val: number) => val || 0,
              },
            ],
          };
        });

      // 这里插入 ↓↓↓
      const targetMonthKey = `${year}-${periodInfo.targetMonth.toString().padStart(2, "0")}`;

      // chaseAndSnapshotColumns 相关代码
      const chaseAndSnapshotColumns: ColumnsType<DynamicCalculationItem> = [
        {
          title: "PR開立時間與數量",
          children: [
            {
              title: `${year}/06/19`,
              children: [
                {
                  title: "数量",
                  dataIndex: ["stock_snapshots", `${year}-06-19`],
                  key: "snapshot1",
                  width: 120,
                  render: (val: number) => val || 0,
                },
              ],
            },
            {
              title: `${year}/06/25`,
              children: [
                {
                  title: "数量",
                  dataIndex: ["stock_snapshots", `${year}-06-25`],
                  key: "snapshot2",
                  width: 120,
                  render: (val: number) => val || 0,
                },
              ],
            },
          ],
        },
        {
          title: "進料需求",
          children: [
            {
              title: `${periodInfo.targetMonth}月W01`,
              children: [
                {
                  title: "数量",
                  dataIndex: ["chase_data", targetMonthKey, "W01"],
                  key: "chase1",
                  width: 80,
                  render: (val: number, record: DynamicCalculationItem) => {
                    const directValue = record.chase_data?.[targetMonthKey]?.["W01"];
                    const finalValue = directValue !== undefined ? directValue : (val !== undefined ? val : 0);
                    return finalValue;
                  },
                  onCell: (record: DynamicCalculationItem) => ({
                    onDoubleClick: () => {
                      // 双击编辑进料需求，编辑完成后自动同步到實際請購數量
                      const newValue = prompt(`请输入${periodInfo.targetMonth}月W01需求数量:`, 
                        record.chase_data?.[targetMonthKey]?.["W01"]?.toString() || "0");
                      if (newValue !== null) {
                        const numValue = parseInt(newValue) || 0;
                        // 更新本地数据
                        const updatedRecord = { ...record };
                        if (!updatedRecord.chase_data) updatedRecord.chase_data = {};
                        if (!updatedRecord.chase_data[targetMonthKey]) updatedRecord.chase_data[targetMonthKey] = {};
                        updatedRecord.chase_data[targetMonthKey]["W01"] = numValue;
                        
                        // 实时同步到實際請購數量
                        handleRealTimeSync(record.id, 'chase_to_order');
                      }
                    }
                  })
                },
              ],
            },
            {
              title: `${periodInfo.targetMonth}月W02`,
              children: [
                {
                  title: "数量",
                  dataIndex: ["chase_data", targetMonthKey, "W02"],
                  key: "chase2",
                  width: 80,
                  render: (val: number, record: DynamicCalculationItem) => {
                    // 🔧 直接访问数据，不依赖dataIndex
                    const directValue =
                      record.chase_data?.[targetMonthKey]?.["W02"];

                    console.log(`项目${record.no} W02:`, {
                      val,
                      directValue,
                      chase_data: record.chase_data,
                      targetMonthKey,
                      path: `chase_data.${targetMonthKey}.W02`,
                    });

                    // 🔧 修复：确保返回有效值，如果数据结构不完整则返回0
                    const finalValue = directValue !== undefined ? directValue : (val !== undefined ? val : 0);
                    return finalValue;
                  },
                },
              ],
            },
            {
              title: `${periodInfo.targetMonth}月W03`,
              children: [
                {
                  title: "数量",
                  dataIndex: ["chase_data", targetMonthKey, "W03"],
                  key: "chase3",
                  width: 80,
                  render: (val: number, record: DynamicCalculationItem) => {
                    // 🔧 直接访问数据，不依赖dataIndex
                    const directValue =
                      record.chase_data?.[targetMonthKey]?.["W03"];

                    console.log(`项目${record.no} W03:`, {
                      val,
                      directValue,
                      chase_data: record.chase_data,
                      targetMonthKey,
                    });

                    // 🔧 修复：确保返回有效值，如果数据结构不完整则返回0
                    const finalValue = directValue !== undefined ? directValue : (val !== undefined ? val : 0);
                    return finalValue;
                  },
                },
              ],
            },
            {
              title: `${periodInfo.targetMonth}月W04`,
              children: [
                {
                  title: "数量",
                  dataIndex: ["chase_data", targetMonthKey, "W04"],
                  key: "chase4",
                  width: 80,
                  render: (val: number, record: DynamicCalculationItem) => {
                    // 🔧 直接访问数据，不依赖dataIndex
                    const directValue =
                      record.chase_data?.[targetMonthKey]?.["W04"];

                    console.log(`项目${record.no} W04:`, {
                      val,
                      directValue,
                      chase_data: record.chase_data,
                      targetMonthKey,
                    });

                    // 🔧 修复：确保返回有效值，如果数据结构不完整则返回0
                    const finalValue = directValue !== undefined ? directValue : (val !== undefined ? val : 0);
                    return finalValue;
                  },
                },
              ],
            },
          ],
        },
      ];

      const finalColumns: ColumnsType<DynamicCalculationItem> = [
        ...baseColumns,
        ...monthColumns,
        ...chaseAndSnapshotColumns,
        {
          title: "总金额(RMB)",
          key: "total_amount",
          width: 120,
          render: (_: any, record: DynamicCalculationItem) => {
            return calculateTotalAmount(record).toFixed(2);
          },
        },
        {
          title: "備註",
          dataIndex: "moq_remark",
          key: "moq_remark",
          width: 150,
        },
      ];

      return finalColumns;
    }, [calculationItems, applicationForm.period]);

  // 处理多站别数据，将一个多站别项目展开为多行
  const expandedCalculationItems = useMemo(() => {
    const dataRows: any[] = [];

    calculationItems.forEach((item, itemIndex) => {
      // Use item.id if available, otherwise fallback to index for a stable key
      const baseId = item.id ?? itemIndex;

      if (
        item.is_multi_station &&
        item.multi_station_data &&
        item.multi_station_data.stations?.length > 0
      ) {
        // Multi-station item
        const stations = item.multi_station_data.stations;
        const stationCount = stations.length;

        stations.forEach((station, stationIndex) => {
          const uniqueKey = `${baseId}-station-${stationIndex}`;

          dataRows.push({
            ...item, // Spread original item data
            no: stationIndex === 0 ? String(item.no || "") : "",
            material_name:
              stationIndex === 0 ? String(item.material_name || "") : "",
            usage_station: String(station || ""),
            usage_per_set: Number(
              item.multi_station_data!.usage_per_set[stationIndex] || 0,
            ),
            usage_count: Number(
              item.multi_station_data!.usage_count[stationIndex] || 0,
            ),
            monthly_capacity: Number(
              item.multi_station_data!.monthly_capacity[stationIndex] || 0,
            ),
            min_stock: Number(
              item.multi_station_data!.min_stock[stationIndex] || 0,
            ),
            max_stock: Number(
              item.multi_station_data!.max_stock[stationIndex] || 0,
            ),
            min_total_stock: stationIndex === 0 ? Number(
              (item.multi_station_data?.min_total_stock && 
               item.multi_station_data.min_total_stock[stationIndex] !== undefined) 
                ? item.multi_station_data.min_total_stock[stationIndex] 
                : 0,
            ) : null,
            max_total_stock: stationIndex === 0 ? Number(
              (item.multi_station_data?.max_total_stock && 
               item.multi_station_data.max_total_stock[stationIndex] !== undefined) 
                ? item.multi_station_data.max_total_stock[stationIndex] 
                : 0,
            ) : null,
            monthly_demand: Number(
              item.multi_station_data!.monthly_demand[stationIndex] || 0,
            ),
            monthly_net_demand: Number(
              item.multi_station_data!.monthly_net_demand[stationIndex] || 0,
            ),
            actual_order: Number(
              item.multi_station_data!.actual_order[stationIndex] || 0,
            ),
            // 當月總需求和實際訂購数量 - 只在第一行显示，其他行为null
            monthly_total_demand: stationIndex === 0 ? Number(
              (item.multi_station_data?.monthly_demand && 
               Array.isArray(item.multi_station_data.monthly_demand)) 
                ? item.multi_station_data.monthly_demand.reduce((sum: number, val: number) => sum + val, 0)
                : 0,
            ) : null,
            actual_purchase_quantity: stationIndex === 0 ? Number(
              (item.multi_station_data?.actual_order && 
               Array.isArray(item.multi_station_data.actual_order)) 
                ? item.multi_station_data.actual_order.reduce((sum: number, val: number) => sum + val, 0)
                : 0,
            ) : null,
            moq_remark: String(
              item.multi_station_data!.moq_remark[stationIndex] || "",
            ),
            // --- Key properties ---
            key: uniqueKey,
            id: uniqueKey, // Use the same unique key for id to be safe
            stationIndex: stationIndex,
            stationCount,
            originalId: item.id, // Keep original id for editing
          });
        });
      } else {
        // Single-station item
        const uniqueKey = String(baseId);

        dataRows.push({
          ...item,
          min_total_stock: Number(item.min_stock || 0), // 单站别：最低庫存總數 = 最低库存数量
          max_total_stock: Number(item.max_total_stock || item.max_stock || 0),
          // 单站别：當月總需求和實際訂購数量等于當月需求和實際訂購
          monthly_total_demand: Number(item.monthly_demand || 0),
          actual_purchase_quantity: Number(item.actual_order || 0),
          key: uniqueKey,
          id: uniqueKey,
          stationIndex: 0,
          stationCount: 1,
          originalId: item.id,
        });
      }
    });

    return dataRows;
  }, [calculationItems, applicationForm.period]);

  // 计算表视图列定义 - 改为从API动态生成
  const calculationViewColumns = useMemo(() => {
    // ...保持不变，因为它已经是从API获取动态表头
    if (!calculationHeaders || !Array.isArray(calculationHeaders)) {
      return [];
    }

    const columns: ColumnsType<any> = []; // 改为 any 类型以支持扩展后的数据结构

    // 从API获取的列中找到序号和物料描述列
    const apiColumns: ColumnsType<any> = calculationHeaders.map(
      (header: B453ColumnConfig) => ({
        ...header,
        onCell: (record: any) => {
          // 处理多站别显示的 rowSpan 逻辑 - 只处理序号列
          if (
            header.key === "no" ||
            header.dataIndex === "no"
          ) {
            return {
              rowSpan:
                record.stationIndex === 0
                  ? record.stationCount > 1
                    ? record.stationCount
                    : 1
                  : 0,
            };
          }

          return {};
        },
        render: (value: any, record: any) => {
          // 处理多站别显示的内容
          if (header.key === "no" || header.dataIndex === "no") {
            if (record.stationIndex === 0) {
              // 第一行显示序号
              return (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-medium">{record.no}</span>
                  {record.stationCount > 1 && (
                    <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {record.stationCount}站别
                    </div>
                  )}
                </div>
              );
            } else if (record.stationIndex > 0) {
              // 其他站别行不显示序号
              return null;
            }

            // 🔧 添加 fallback，避免返回 undefined
            return <span className="font-medium">{record.no}</span>;
          }

          if (
            header.key === "material_name" ||
            header.dataIndex === "material_name"
          ) {
            // 统一使用MaterialNameCell组件处理料材名稱显示
            return (
              <MaterialNameCell
                materialName={record.material_name}
                unitPrice={record.unit_price}
                purchaser={record.purchaser}
                isMultiStation={record.stationCount > 1}
                stationCount={record.stationCount}
              />
            );
          }

          // 使用站别列特殊处理
          if (
            header.key === "usage_station" ||
            header.dataIndex === "usage_station"
          ) {
            if (record.stationIndex >= 0) {
              // 🔧 处理空值和 undefined 情况
              const stationName = value || record.usage_station || "未设置";

              return (
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium"
                    style={{ color: !value ? "#999" : "inherit" }}
                  >
                    {stationName}
                  </span>
                  <div className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {record.stationIndex + 1}
                  </div>
                  {!value && (
                    <div className="px-1 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                      空值
                    </div>
                  )}
                </div>
              );
            }
          }

          // 数值列处理
          if (typeof value === "number") {
            if (value > 1000) {
              return value.toLocaleString();
            }

            return value;
          }

          return value;
        },
      }),
    );
    // 找到序号列和物料描述列
    const noColumn = apiColumns.find(
      (col) =>
        "dataIndex" in col && (col.dataIndex === "no" || col.key === "no"),
    );
    const materialColumn = apiColumns.find(
      (col) =>
        "dataIndex" in col &&
        (col.dataIndex === "material_name" || col.key === "material_name"),
    );
    const otherColumns = apiColumns.filter(
      (col) =>
        (!("dataIndex" in col) ||
          (col.dataIndex !== "no" && col.dataIndex !== "material_name")) &&
        col.key !== "no" &&
        col.key !== "material_name",
    );

    // 按照管控表的顺序排列：序号、物料描述、操作、其他列
    if (noColumn) {
      columns.push({ ...noColumn, fixed: "left", width: 60 });
    }
    if (materialColumn) {
      columns.push({ ...materialColumn, fixed: "left", width: 250 });
    }

    // 添加操作列（第3个位置，与管控表一致）
    columns.push({
      title: "操作",
      key: "action",
      fixed: "left",
      width: 80,
      onCell: (record: any) => {
        // 🔧 计算表专用：处理多站别展开数据的 rowSpan
        if (record.stationIndex === 0) {
          return { rowSpan: record.stationCount > 1 ? record.stationCount : 1 };
        } else if (record.stationIndex > 0) {
          return { rowSpan: 0 };
        }

        return {};
      },
      render: (_: any, record: any) => {
        // 🔧 只在多站别的第一行或单站别项目中显示操作按钮
        if (record.stationIndex > 0) {
          return null;
        }

        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="操作">
              <DropdownItem
                key="edit"
                onPress={() => {
                  console.log("🔧 编辑按钮被点击，记录信息:", record);
                  
                  try {
                    // 🔧 使用原始项目数据进行编辑，避免使用展开后的ID
                    let originalId = (record as any).originalId || record.id;
                    console.log("原始ID:", originalId);
                    
                    // 🔧 修复ID匹配问题：确保使用数字ID进行匹配
                    if (typeof originalId === 'string' && originalId.includes('-station-')) {
                      originalId = parseInt(originalId.split('-station-')[0]);
                      console.log("解析后的数字ID:", originalId);
                    }
                    
                    // 🔧 添加调试信息，显示calculationItems的内容
                    console.log("calculationItems数组:", calculationItems.map(item => ({ id: item.id, material_name: item.material_name })));
                    
                    const originalItem = calculationItems.find(
                      (item) => item.id === originalId,
                    );

                    console.log("找到的原始项目:", originalItem);

                    if (originalItem) {
                      console.log("开始调用编辑函数");
                      handleEditDemandCalculationItem(originalItem);
                    } else {
                      console.error("❌ 未找到原始项目");
                      console.error("尝试查找的ID:", originalId);
                      console.error("calculationItems中的ID列表:", calculationItems.map(item => item.id));
                      addToast({
                        title: "编辑失败",
                        description: `未找到要编辑的项目数据 (ID: ${originalId})`,
                        color: "danger",
                        timeout: 3000,
                      });
                    }
                  } catch (error) {
                    console.error("❌ 编辑按钮点击处理失败:", error);
                    addToast({
                      title: "编辑失败",
                      description: `编辑按钮处理错误: ${error instanceof Error ? error.message : '未知错误'}`,
                      color: "danger",
                      timeout: 3000,
                    });
                  }
                }}
              >
                编辑
              </DropdownItem>
              <DropdownItem
                key="toggle"
                onPress={() => {
                  const title =
                    (record as any).is_visible !== false
                      ? "确定隐藏该项目吗?"
                      : "确定显示该项目吗?";

                  if (window.confirm(title)) {
                    // 🔧 修复ID匹配问题：确保使用正确的项目数据进行隐藏/显示
                    let toggleId = (record as any).originalId || record.id;
                    
                    if (typeof toggleId === 'string' && toggleId.includes('-station-')) {
                      toggleId = parseInt(toggleId.split('-station-')[0]);
                    }
                    
                    // 找到原始项目数据
                    const originalItem = calculationItems.find(
                      (item) => item.id === toggleId,
                    );
                    
                    if (originalItem) {
                      handleToggleVisibility(originalItem);
                    } else {
                      console.error("❌ 未找到要隐藏/显示的项目");
                      addToast({
                        title: "操作失败",
                        description: "未找到要操作的项目数据",
                        color: "danger",
                        timeout: 3000,
                      });
                    }
                  }
                }}
              >
                {(record as any).is_visible !== false ? "隐藏" : "显示"}
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                onPress={() => {
                  if (window.confirm("确定永久删除吗?")) {
                    let deleteId = (record as any).originalId || record.id;
                    
                    // 🔧 修复ID匹配问题：确保使用数字ID进行删除
                    if (typeof deleteId === 'string' && deleteId.includes('-station-')) {
                      deleteId = parseInt(deleteId.split('-station-')[0]);
                    }
                    
                    handleDeleteCalculationItem(deleteId);
                  }
                }}
              >
                删除
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      },
    });

    // 添加其他列
    columns.push(...otherColumns);

    return columns;
  }, [calculationHeaders]);

  // 在组件加载时获取表头配置
  useEffect(() => {
    const fetchHeaders = async () => {
      try {
        const [calcHeaders, mgmtHeaders] = await Promise.all([
          materialManagementApi.b453Calculation.getHeaders(),
          materialManagementApi.b453.getHeaders(),
        ]);

        setCalculationHeaders(calcHeaders);
        setManagementHeaders(Array.isArray(mgmtHeaders) ? mgmtHeaders : []);
      } catch (error) {
        console.error("获取表头配置失败:", error);
        addToast({
          title: "错误",
          description: "获取表头配置失败",
          color: "danger",
          timeout: 5000,
        });
      }
    };

    fetchHeaders();
  }, []);

  // 计算动态列和总宽度
  const calculationColumnsData = useMemo(() => {
    if (!calculationHeaders || !Array.isArray(calculationHeaders)) {
      return { dynamicColumns: [], totalWidth: 0 };
    }

    const columns: ColumnsType<DynamicCalculationItem> = calculationHeaders.map(
      (header: B453ColumnConfig) => ({
        ...header,
        render: (value: any) => {
          if (typeof value === "number") {
            if (value > 1000) {
              return value.toLocaleString();
            }

            return value;
          }

          return value;
        },
      }),
    );

    // 添加操作列
    columns.push({
      title: "操作",
      key: "action",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            color="secondary"
            size="sm"
            onClick={() => handleEditCalculationItem(record)}
          >
            编辑
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="操作">
              <DropdownItem
                key="toggle-visibility"
                onClick={() => handleToggleVisibility(record)}
              >
                {record.is_visible === false ? "显示" : "隐藏"}
              </DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger">
                <Popconfirm
                  cancelText="取消"
                  okText="确认"
                  title="确认删除吗？"
                  onConfirm={() => handleDeleteCalculationItem(record.id)}
                >
                  <span style={{ width: "100%", display: "block" }}>删除</span>
                </Popconfirm>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </Space>
      ),
    });

    const totalW = columns.reduce(
      (acc, col) => acc + ((col.width as number) || 100),
      0,
    );

    return { dynamicColumns: columns, totalWidth: totalW };
  }, [calculationHeaders, calculationItems]); // calculationItems is needed for re-rendering on hide

  // 需求计算表专用编辑函数
  const handleEditDemandCalculationItem = (item: DynamicCalculationItem) => {
    console.log("🔧 开始编辑需求计算项目:", item);
    
    try {
      // 🔧 修复多站别ID问题：确保使用正确的数字ID
      let correctItem = item;

      // 如果item的ID是字符串格式（如"1685-station-1"），从原始数据中获取正确的item
      const itemId = String(item.id);

      if (itemId.includes("-station-")) {
        const originalId = parseInt(itemId.split("-station-")[0]);
        const foundOriginalItem = calculationItems.find(
          (calcItem) => calcItem.id === originalId,
        );

        if (foundOriginalItem) {
          correctItem = foundOriginalItem;
        }
      }

      setCurrentDemandCalculationItem(correctItem);

      // 🔧 添加调试信息
      console.log("编辑需求计算项目:", {
        originalItemId: item.id,
        correctItemId: correctItem.id,
        isMultiStation: correctItem.is_multi_station,
        multiStationData: (correctItem as any).multi_station_data,
      });

      // 检查是否为多站别数据 (假设通过 multi_station_data 字段判断)
      const isMulti = correctItem.is_multi_station || false;
      const multiData = (correctItem as any).multi_station_data;

      setIsDemandMultiStation(isMulti);

      // 🔧 无论是多站别还是单站别，都需要设置基本的表单数据
      const formData = {
        ...correctItem,
        no: correctItem.no,
        material_name: correctItem.material_name,
        usage_station: correctItem.usage_station,
        usage_per_set: correctItem.usage_per_set,
        usage_count: correctItem.usage_count,
        monthly_capacity: correctItem.monthly_capacity,
        min_stock: correctItem.min_stock,
        max_stock: correctItem.max_stock,
        monthly_demand: correctItem.monthly_demand,
        monthly_net_demand: correctItem.monthly_net_demand,
        actual_order: correctItem.actual_order,
        moq_remark: correctItem.moq_remark,
      };

      console.log("设置表单数据:", formData);
      setDemandCalculationFormData(formData);

      if (isMulti && multiData && multiData.stations?.length > 0) {
        // 如果是多站别，还需要设置多站别数据
        const multiStationData = {
          stations: multiData.stations || [],
          usage_per_set: multiData.usage_per_set || [],
          usage_count: multiData.usage_count || [],
          monthly_capacity: multiData.monthly_capacity || [],
          min_stock: multiData.min_stock || [],
          min_total_stock: multiData.min_total_stock || multiData.min_stock || [],
          max_stock: multiData.max_stock || [],
          max_total_stock: multiData.max_total_stock || multiData.max_stock || [],
          monthly_demand: multiData.monthly_demand || [],
          monthly_net_demand: multiData.monthly_net_demand || [],
          actual_order: multiData.actual_order || [],
          moq_remark: multiData.moq_remark || [],
        };
        
        console.log("设置多站别数据:", multiStationData);
        setDemandMultiStationData(multiStationData);
      }

      // 显示需求计算表编辑模态框
      console.log("显示需求计算表编辑模态框");
      setDemandCalculationModalVisible(true);
      
      // 添加成功提示
      addToast({
        title: "编辑模式",
        description: "已进入编辑模式，请修改相关信息",
        color: "success",
        timeout: 3000,
      });
      
    } catch (error) {
      console.error("❌ 编辑需求计算项目失败:", error);
      addToast({
        title: "编辑失败",
        description: `编辑功能出现错误: ${error instanceof Error ? error.message : '未知错误'}`,
        color: "danger",
        timeout: 5000,
      });
    }
  };

  // 转换为多站别函数
  const convertToMultiStation = () => {
    const currentData = demandCalculationFormData;

    setIsDemandMultiStation(true);

    // 将单站别数据转换为多站别第一个条目
    setDemandMultiStationData({
      stations: [currentData.usage_station || "新站别"],
      usage_per_set: [currentData.usage_per_set || 0],
      usage_count: [currentData.usage_count || 0],
      monthly_capacity: [currentData.monthly_capacity || 0],
      min_stock: [currentData.min_stock || 0],
      min_total_stock: [currentData.min_stock || 0], // 初始值设为最低库存
      max_stock: [currentData.max_stock || 0],
      max_total_stock: [currentData.max_stock || 0], // 初始值设为最高库存
      monthly_demand: [currentData.monthly_demand || 0],
      monthly_net_demand: [currentData.monthly_net_demand || 0],
      actual_order: [currentData.actual_order || 0],
      moq_remark: [currentData.moq_remark || ""],
    });
  };

  // 添加新站别
  const addNewDemandStation = () => {
    setDemandMultiStationData((prev) => ({
      stations: [...prev.stations, "新站别"],
      usage_per_set: [...prev.usage_per_set, 0],
      usage_count: [...prev.usage_count, 0],
      monthly_capacity: [...prev.monthly_capacity, 0],
      min_stock: [...prev.min_stock, 0],
      min_total_stock: [...(prev.min_total_stock || []), 0],
      max_stock: [...prev.max_stock, 0],
      max_total_stock: [...(prev.max_total_stock || []), 0],
      monthly_demand: [...prev.monthly_demand, 0],
      monthly_net_demand: [...prev.monthly_net_demand, 0],
      actual_order: [...prev.actual_order, 0],
      moq_remark: [...prev.moq_remark, ""],
    }));
  };

  // 删除站别
  const removeDemandStation = (index: number) => {
    if (demandMultiStationData.stations.length <= 1) {
      // 如果只剩一个站别，转回单站别
      const data = demandMultiStationData;

      setIsDemandMultiStation(false);
      setDemandCalculationFormData((prev) => ({
        ...prev,
        usage_station: data.stations[0] || "",
        usage_per_set: data.usage_per_set[0] || 0,
        usage_count: data.usage_count[0] || 0,
        monthly_capacity: data.monthly_capacity[0] || 0,
        min_stock: data.min_stock[0] || 0,
        max_stock: data.max_stock[0] || 0,
        monthly_demand: data.monthly_demand[0] || 0,
        monthly_net_demand: data.monthly_net_demand[0] || 0,
        actual_order: data.actual_order[0] || 0,
        moq_remark: data.moq_remark[0] || "",
      }));

      return;
    }

    setDemandMultiStationData((prev) => ({
      stations: prev.stations.filter((_, i) => i !== index),
      usage_per_set: prev.usage_per_set.filter((_, i) => i !== index),
      usage_count: prev.usage_count.filter((_, i) => i !== index),
      monthly_capacity: prev.monthly_capacity.filter((_, i) => i !== index),
      min_stock: prev.min_stock.filter((_, i) => i !== index),
      min_total_stock: prev.min_total_stock.filter((_, i) => i !== index),
      max_stock: prev.max_stock.filter((_, i) => i !== index),
      max_total_stock: prev.max_total_stock.filter((_, i) => i !== index),
      monthly_demand: prev.monthly_demand.filter((_, i) => i !== index),
      monthly_net_demand: prev.monthly_net_demand.filter((_, i) => i !== index),
      actual_order: prev.actual_order.filter((_, i) => i !== index),
      moq_remark: prev.moq_remark.filter((_, i) => i !== index),
    }));
  };

  // 更新站别数据
  const updateDemandStationData = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setDemandMultiStationData((prev) => {
      const newData = { ...prev };

      if (field === "stations") {
        newData.stations[index] = value as string;
      } else if (field === "moq_remark") {
        // 备注字段保持为字符串
        newData.moq_remark[index] = value as string;
      } else {
        // 数值字段转换为数字
        (newData as any)[field][index] =
          typeof value === "string" ? parseFloat(value) || 0 : value;
      }

      return newData;
    });
  };

  const handleDemandCalculationSubmit = async () => {
    try {
      const isEditing = !!currentDemandCalculationItem;

      // Helper function to safely parse numbers
      const parseNumber = (value: any, isDecimal = false) => {
        if (value === undefined || value === null || value === "") {
          return 0;
        }
        const num = isDecimal
          ? parseFloat(value.toString())
          : parseInt(value.toString());

        return isNaN(num) ? 0 : num;
      };

      // 构建需求计算表专用的表单数据
      const formData: Partial<DynamicCalculationItem> & { [key: string]: any } =
        {
          // 基本信息
          material_name: demandCalculationFormData.material_name || "",

          // 多站别支持
          is_multi_station: isDemandMultiStation,
        };

      // 🔧 只在新建时设置no字段，编辑时保持原有的no避免唯一约束冲突
      if (!isEditing) {
        formData.no =
          parseNumber(demandCalculationFormData.no) ||
          calculationItems.length + 1;
      }

      if (isDemandMultiStation) {
        // 多站别数据
        formData.multi_station_data = {
          stations: demandMultiStationData.stations,
          usage_per_set: demandMultiStationData.usage_per_set,
          usage_count: demandMultiStationData.usage_count,
          monthly_capacity: demandMultiStationData.monthly_capacity,
          min_stock: demandMultiStationData.min_stock,
          min_total_stock: demandMultiStationData.min_total_stock,
          max_stock: demandMultiStationData.max_stock,
          max_total_stock: demandMultiStationData.max_total_stock,
          monthly_demand: demandMultiStationData.monthly_demand,
          monthly_net_demand: demandMultiStationData.monthly_net_demand,
          actual_order: demandMultiStationData.actual_order,
          moq_remark: demandMultiStationData.moq_remark,
        };

        // 计算汇总数据
        formData.usage_station = demandMultiStationData.stations.join(", ");
        formData.monthly_demand = demandMultiStationData.monthly_demand.reduce(
          (sum, val) => sum + val,
          0,
        );
        formData.actual_order = demandMultiStationData.actual_order.reduce(
          (sum, val) => sum + val,
          0,
        );
        formData.monthly_net_demand =
          demandMultiStationData.monthly_net_demand.reduce(
            (sum, val) => sum + val,
            0,
          );
      } else {
        // 单站别数据
        formData.usage_station = demandCalculationFormData.usage_station || "";
        formData.usage_per_set = parseNumber(
          demandCalculationFormData.usage_per_set,
        );
        formData.usage_count = parseNumber(
          demandCalculationFormData.usage_count,
        );
        formData.monthly_capacity = parseNumber(
          demandCalculationFormData.monthly_capacity,
        );
        formData.min_stock = parseNumber(demandCalculationFormData.min_stock);
        formData.max_stock = parseNumber(demandCalculationFormData.max_stock);
        formData.monthly_demand = parseNumber(
          demandCalculationFormData.monthly_demand,
        );
        formData.monthly_net_demand = parseNumber(
          demandCalculationFormData.monthly_net_demand,
        );
        formData.actual_order = parseNumber(
          demandCalculationFormData.actual_order,
        );
        formData.moq_remark = demandCalculationFormData.moq_remark || "";
      }

      if (currentDemandCalculationItem) {
        // 🔧 最后一层保护：确保ID是正确的数字格式
        let correctId = currentDemandCalculationItem.id;
        const idStr = String(correctId);

        if (idStr.includes("-station-")) {
          correctId = parseInt(idStr.split("-station-")[0]);
          console.warn("发现展开格式的ID，已自动修正:", {
            originalId: idStr,
            correctedId: correctId,
          });
        }

        // 🔧 添加缺失的必要字段
        const completeFormData = {
          ...formData,
          // 确保JSON字段有默认值
          monthly_data: formData.monthly_data || {},
          chase_data: formData.chase_data || {},
          stock_snapshots: formData.stock_snapshots || {},
          multi_station_data: formData.multi_station_data || {
            stations: [],
            usage_per_set: [],
            usage_count: [],
            monthly_capacity: [],
            min_stock: [],
            min_total_stock: [],
            max_stock: [],
            max_total_stock: [],
            monthly_demand: [],
            monthly_net_demand: [],
            actual_order: [],
            moq_remark: [],
          } as any,
          // 确保必要的字符串字段不为空
          purchaser: formData.purchaser || "",
          linked_material: formData.linked_material || "",
        };

        // 🔧 添加调试信息确认API调用的ID和数据
        console.log("更新需求计算项目:", {
          id: correctId,
          idType: typeof correctId,
          apiUrl: `/dynamic-calculation-items/${correctId}/`,
          formData: completeFormData,
        });

        const updatedItem = await dynamicCalculationItemService.update(
          correctId,
          completeFormData,
        );

        // 更新本地状态
        setCalculationItems((prevItems) =>
          prevItems.map((item) =>
            item.id === currentDemandCalculationItem.id ? updatedItem : item,
          ),
        );

        addToast({
          title: "成功",
          description: "需求计算项目更新成功",
          color: "success",
          timeout: 3000,
        });
      } else {
        const newItem = await dynamicCalculationItemService.create({
          ...formData,
          form: applicationForm.id,
        });

        setCalculationItems((prevItems) => [...prevItems, newItem]);

        addToast({
          title: "成功",
          description: "需求计算项目创建成功",
          color: "success",
          timeout: 3000,
        });
      }

      setDemandCalculationModalVisible(false);
    } catch (error) {
      console.error("需求计算项目提交失败:", error);
      addToast({
        title: "错误",
        description: "操作失败，请重试",
        color: "danger",
        timeout: 5000,
      });
    }
  };

  // 实时同步单个项目的数据
  const handleRealTimeSync = async (
    itemId: number, 
    syncType: 'chase_to_order' | 'order_to_chase',
    targetWeek?: string
  ) => {
    try {
      const targetMonthKey = `${monthInfo.year}-${String(monthInfo.targetMonth).padStart(2, "0")}`;
      
      const result = await suppliesApi.syncSingleItemData(
        itemId,
        syncType,
        targetMonthKey,
        targetWeek
      );
      
      // 刷新数据
      await loadCalculationItems();
      
      // 静默同步，不显示消息，避免干扰用户体验
      console.log('实时同步成功:', result.message);
      
    } catch (error) {
      console.error('实时同步失败:', error);
      // 静默处理错误，避免干扰用户体验
    }
  };

  // 同步进料需求与實際請購數量（批量同步，保留原有功能）
  const handleSyncChaseDataWithActualOrder = async (direction: 'chase_to_order' | 'order_to_chase', targetWeek?: string) => {
    try {
      const targetMonthKey = `${monthInfo.year}-${String(monthInfo.targetMonth).padStart(2, "0")}`;
      
      const result = await suppliesApi.syncChaseDataWithActualOrder(
        applicationForm.id,
        direction,
        targetMonthKey,
        targetWeek
      );
      
      // 刷新数据
      await loadCalculationItems();
      
      // 显示成功消息
      alert(`同步成功！${result.message}`);
      
    } catch (error) {
      console.error('同步失败:', error);
      alert('同步失败，请重试');
    }
  };

  return (
    <div>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {applicationForm.name}
              </span>
              <Chip color="primary" size="sm" variant="flat">
                {applicationForm.code}
              </Chip>
              <Chip color="success" size="sm" variant="flat">
                {applicationForm.department}
              </Chip>
              <Chip color="warning" size="sm" variant="flat">
                {applicationForm.period}
              </Chip>
            </div>
            {allowReturn && ( // 只在允许返回时显示返回按钮
              <Button
                aria-label="返回上一页"
                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                onPress={onBack}
              >
                返回
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="px-4">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="b453_view" title="B453耗材表">
              <div className="space-y-8">
                {/* 顶部操作按钮 */}
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      aria-label="新增耗材项目"
                      color="primary"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={handleCreateCalculationItem}
                    >
                      新增耗材项目
                    </Button>
                    <Button
                      startContent={<CalculatorIcon className="w-4 h-4" />}
                      variant="ghost"
                      onPress={handleCalculateDemands}
                    >
                      批量计算需求量
                    </Button>
                    <Button
                      color="secondary"
                      variant="ghost"
                      onPress={handleOpenBatchPurchaserModal}
                    >
                      批量设置采购员
                    </Button>
                    <Button
                      color="success"
                      isLoading={loading}
                      startContent={<ArrowPathIcon className="w-4 h-4" />}
                      variant="ghost"
                      onPress={refreshData}
                    >
                      刷新数据
                    </Button>
                    {/* <ImportSuppliesButton
                      defaultFormId={applicationForm.id}
                      onImportSuccess={loadCalculationItems}
                    /> */}
                    {selectedRowKeys.length >= 2 && !isMixedSelection && (
                      <>
                        {includeHidden && hiddenSelected.length > 0 && (
                          <Button
                            key="bulk-show"
                            aria-label="批量显示选中项目"
                            color="success"
                            variant="flat"
                            onPress={() =>
                              handleBulkShow(
                                hiddenSelected.map((item) => item.id),
                              )
                            }
                          >
                            显示选中 ({hiddenSelected.length})
                          </Button>
                        )}
                        {visibleSelected.length > 0 && (
                          <Button
                            key="bulk-hide"
                            aria-label="批量隐藏选中项目"
                            color="danger"
                            variant="flat"
                            onPress={() =>
                              handleBulkHide(
                                visibleSelected.map((item) => item.id),
                              )
                            }
                          >
                            隐藏选中 ({visibleSelected.length})
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={includeHidden}
                      onChange={() => setIncludeHidden(!includeHidden)}
                    >
                      显示隐藏项
                    </Checkbox>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                          variant="ghost"
                        >
                          导出
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="导出选项">
                        <DropdownItem
                          key="management"
                          onPress={handleExportManagement}
                        >
                          导出管控表
                        </DropdownItem>
                        <DropdownItem
                          key="calculation"
                          onPress={handleExportCalculation}
                        >
                          导出需求计算表
                        </DropdownItem>
                        <DropdownItem
                          key="all"
                          className="text-primary"
                          color="primary"
                          onPress={handleExportAll}
                        >
                          全部导出
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>

                {/* 表一：耗材管控表 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">表一：耗材管控表</h3>
                      <Chip color="success" size="sm" variant="flat">
                        重点关注采购、库存、成本管控
                      </Chip>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        color="primary"
                        variant="flat"
                        size="sm"
                        onPress={() => handleSyncChaseDataWithActualOrder('chase_to_order')}
                      >
                        进料需求→實際請購
                      </Button>
                      <Button
                        color="secondary"
                        variant="flat"
                        size="sm"
                        onPress={async () => {
                          // 让用户选择要安排在哪一周
                          const targetWeek = prompt(
                            '请选择要将實際請購數量安排在哪一周？\n' +
                            'W01 - 第一周\n' +
                            'W02 - 第二周（推荐）\n' +
                            'W03 - 第三周\n' +
                            'W04 - 第四周\n\n' +
                            '请输入 W01/W02/W03/W04（默认W02）:',
                            'W02'
                          );
                          
                          if (targetWeek && ['W01', 'W02', 'W03', 'W04'].includes(targetWeek.toUpperCase())) {
                            await handleSyncChaseDataWithActualOrder('order_to_chase', targetWeek.toUpperCase());
                          } else if (targetWeek !== null) {
                            // 用户输入了无效值，使用默认值
                            await handleSyncChaseDataWithActualOrder('order_to_chase', 'W02');
                          }
                        }}
                      >
                        實際請購→进料需求
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : calculationItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">暂无管控表数据</p>
                      <Button
                        className="mt-2"
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={handleCreateCalculationItem}
                      >
                        添加耗材项目
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <Table
                        className="ant-table-striped"
                        columns={managementViewColumns}
                        dataSource={calculationItems}
                        loading={loading}
                        pagination={false}
                        rowKey="id"
                        rowSelection={{
                          type: "checkbox",
                          selectedRowKeys,
                          onChange: (keys) => setSelectedRowKeys(keys),
                        }}
                        scroll={{
                          x: 2320,
                          scrollToFirstRowOnChange: true,
                        }}
                        size="small"
                      />
                    </div>
                  )}
                </div>

                <Divider />

                {/* 表二：耗材需求计算表 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      表二：耗材需求计算表
                    </h3>
                    <Chip color="warning" size="sm" variant="flat">
                      重点关注需求计算、产能分析
                    </Chip>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : calculationItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">暂无计算表数据</p>
                      <Button
                        className="mt-2"
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={handleCreateCalculationItem}
                      >
                        添加计算项目
                      </Button>
                    </div>
                  ) : (
                    <MergedCellTable
                      columns={calculationViewColumns}
                      dataSource={expandedCalculationItems}
                      loading={loading}
                      rowClassName={(record) => {
                        if (record.stationIndex > 0) {
                          return "bg-gray-25";
                        }
                        return "";
                      }}
                      rowKey="id"
                      rowSelection={{
                        type: "checkbox",
                        selectedRowKeys,
                        onChange: (keys: any) => setSelectedRowKeys(keys),
                        getCheckboxProps: (record: any) => ({
                          // 只在第一行显示复选框
                          disabled: record.stationIndex !== 0,
                          style: {
                            display:
                              record.stationIndex === 0
                                ? "inline-block"
                                : "none",
                          },
                        }),
                      }}
                      scroll={{
                        x: 1800,
                        scrollToFirstRowOnChange: true,
                      }}
                      size="small"
                    />
                  )}
                </div>

                {/* 汇总信息卡片 */}
                {calculationItems.length > 0 && (
                  <Card className="bg-blue-50">
                    <CardBody className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-blue-600">
                            {calculationItems.length}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            管控项目数
                          </div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-green-600">
                            ¥
                            {calculationItems
                              .reduce((sum, item) => sum + calculateTotalAmount(item), 0)
                              .toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            总采购金额
                          </div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-purple-600">
                            {calculationItems
                              .reduce((sum, item) => sum + calculateActualOrder(item), 0)
                              .toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            总订购数量
                          </div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-orange-600">
                            {calculationItems[0]?.monthly_capacity &&
                            typeof calculationItems[0].monthly_capacity ===
                              "number"
                              ? calculationItems[0].monthly_capacity.toLocaleString()
                              : "363,000"}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            当月产能
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>

            {/* 需求与采购信息标签页 */}
            <Tab key="demand_purchase_view" title="需求与采购信息">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Chip color="primary" size="sm" variant="flat">
                    需求与采购信息：當月需求、實際請購、MOQ备注
                  </Chip>
                  <Button
                    startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                    variant="ghost"
                    onPress={() => {
                      // 导出需求与采购信息
                      console.log('导出需求与采购信息');
                    }}
                  >
                    导出需求采购表
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : calculationItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">暂无需求与采购数据</p>
                  </div>
                ) : (
                  <DemandPurchaseTable
                    dataSource={expandedCalculationItems}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 1200 }}
                  />
                )}
              </div>
            </Tab>

            {/* 预测数据标签页 */}
            {forecastData.length > 0 && (
              <Tab key="forecast_view" title="预测数据">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Chip color="secondary" size="sm" variant="flat">
                      预测数据：PRPM立项、进料安排、月度数据
                    </Chip>
                    <Button
                      startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                      variant="ghost"
                      onPress={handleExportForecast}
                    >
                      导出预测数据
                    </Button>
                  </div>

                  {forecastData.map((forecast) => (
                    <Card key={forecast.id} className="w-full">
                      <CardHeader>
                        <span className="text-lg font-semibold">
                          {forecast.name}
                        </span>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-6">
                          {/* 月度管控数据 */}
                          {forecast.forecast_data?.monthly_control_data && (
                            <div>
                              <h4 className="text-md font-semibold mb-3 text-blue-600">
                                月度管控数据
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(
                                  forecast.forecast_data.monthly_control_data,
                                ).map(([month, data]: [string, any]) => (
                                  <Card key={month} className="bg-gray-50">
                                    <CardHeader className="pb-2">
                                      <div className="text-sm font-medium text-gray-500">
                                        {month}
                                      </div>
                                    </CardHeader>
                                    <CardBody className="text-center">
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          项目数:{" "}
                                          <span className="font-semibold">
                                            {data.items}
                                          </span>
                                        </div>
                                        <div>
                                          总库存:{" "}
                                          <span className="font-semibold text-green-600">
                                            {data.total_stock}
                                          </span>
                                        </div>
                                        <div>
                                          仓库需求:{" "}
                                          <span className="font-semibold text-orange-600">
                                            {data.total_warehouse_demand || 0}
                                          </span>
                                        </div>
                                        <div>
                                          总金额:{" "}
                                          <span className="font-semibold text-red-600">
                                            ¥
                                            {data.total_amount?.toFixed(2) ||
                                              "0.00"}
                                          </span>
                                        </div>
                                      </div>
                                    </CardBody>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PRPM立项安排 */}
                          {forecast.forecast_data?.prpm_schedule && (
                            <div>
                              <h4 className="text-md font-semibold mb-3 text-green-600">
                                PRPM立项安排
                              </h4>
                              <div className="bg-green-50 p-4 rounded-lg">
                                {Object.entries(
                                  forecast.forecast_data.prpm_schedule,
                                ).map(([material, date]: [string, any]) => (
                                  <div
                                    key={material}
                                    className="flex justify-between items-center"
                                  >
                                    <span className="text-sm font-medium">
                                      {material}
                                    </span>
                                    <Chip
                                      color="success"
                                      size="sm"
                                      variant="flat"
                                    >
                                      {date}
                                    </Chip>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 进料需求安排 */}
                          {forecast.forecast_data?.material_demand_schedule && (
                            <div>
                              <h4 className="text-md font-semibold mb-3 text-purple-600">
                                {monthInfo.targetMonth}月进料需求安排
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(
                                  forecast.forecast_data
                                    .material_demand_schedule,
                                ).map(([period, quantity]: [string, any]) => (
                                  <Card
                                    key={period}
                                    className={`${quantity > 0 ? "bg-purple-50" : "bg-gray-50"}`}
                                  >
                                    <CardBody className="text-center">
                                      <div className="text-md font-bold">
                                        {period}
                                      </div>
                                      <div
                                        className={`text-lg font-bold ${quantity > 0 ? "text-purple-600" : "text-gray-400"}`}
                                      >
                                        {typeof quantity === "number"
                                          ? quantity.toLocaleString()
                                          : "0"}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        pcs
                                      </div>
                                    </CardBody>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 产能预测信息 */}
                          {forecast.forecast_data?.capacity_forecast && (
                            <div>
                              <h4 className="text-md font-semibold mb-3 text-orange-600">
                                产能预测信息
                              </h4>
                              <div className="bg-orange-50 p-4 rounded-lg space-y-4">
                                {/* 当月产能 */}
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">
                                    当月产能:
                                  </span>
                                  <span className="font-bold text-orange-600">
                                    {(
                                      forecast.forecast_data
                                        .capacity_forecast as any
                                    )?.monthly_capacity?.toLocaleString() ||
                                      "363,000"}
                                  </span>
                                </div>

                                {/* 六个月产能数据 */}
                                <div className="space-y-2">
                                  <div className="text-sm font-medium mb-2">
                                    最近六个月产能数据:
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                      <thead>
                                        <tr>
                                          {Object.keys(
                                            (
                                              forecast.forecast_data
                                                .capacity_forecast as any
                                            )?.six_month_capacity || {},
                                          ).map((month) => (
                                            <th
                                              key={month}
                                              className="px-2 py-1 text-xs font-medium text-gray-500"
                                            >
                                              {month}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          {Object.entries(
                                            (
                                              forecast.forecast_data
                                                .capacity_forecast as any
                                            )?.six_month_capacity || {},
                                          ).map(([month, capacity]) => (
                                            <td
                                              key={month}
                                              className="px-2 py-1 text-center"
                                            >
                                              <span className="text-sm font-semibold text-blue-600">
                                                {(
                                                  capacity as number
                                                ).toLocaleString()}
                                              </span>
                                            </td>
                                          ))}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* 涉及测试站 */}
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">
                                    涉及测试站:
                                  </span>
                                  <div className="flex gap-1">
                                    {(
                                      (
                                        forecast.forecast_data
                                          .capacity_forecast as any
                                      )?.usage_stations || []
                                    ).map((station: string) => (
                                      <Chip
                                        key={station}
                                        color="warning"
                                        size="sm"
                                        variant="flat"
                                      >
                                        {station}
                                      </Chip>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </Tab>
            )}
          </Tabs>
        </CardBody>
      </Card>

      {/* 已移除独立的管控表项目模态框，现在使用整合的计算项目模态框 */}

      {/* 计算表项目创建/编辑模态框 */}
      <Modal
        className="mx-4"
        isOpen={calculationModalVisible}
        placement="center"
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={setCalculationModalVisible}
      >
        <ModalContent className="max-h-[90vh]">
          <ModalHeader>
            {currentCalculationItem ? "编辑计算项目" : "新增计算项目"}
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="No."
                  placeholder="请输入编号"
                  type="number"
                  value={calculationFormData.no?.toString() || ""}
                  onChange={(e) =>
                    setCalculationFormData({
                      ...calculationFormData,
                      no: parseInt(e.target.value),
                    })
                  }
                />

                <Input
                  isRequired
                  label="使用站别"
                  placeholder="请输入使用站别"
                  value={calculationFormData.usage_station || ""}
                  onChange={(e) =>
                    setCalculationFormData({
                      ...calculationFormData,
                      usage_station: e.target.value,
                    })
                  }
                />
              </div>

              <SupplyAutoComplete
                isRequired
                description="输入关键词搜索数据库中的耗材，选择后自动填充库存信息"
                label="料材名称"
                placeholder="请输入料材名称进行搜索..."
                value={calculationFormData.material_name || ""}
                onChange={(value) =>
                  setCalculationFormData({
                    ...calculationFormData,
                    material_name: value,
                  })
                }
                onSupplySelect={(supply) => handleSupplySelect(supply)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  description="例如：高姐姐、李采购、王采购等"
                  label="采购员"
                  placeholder="请输入采购员"
                  value={calculationFormData.purchaser || ""}
                  onChange={(e) =>
                    setCalculationFormData({
                      ...calculationFormData,
                      purchaser: e.target.value,
                    })
                  }
                />

                <Input
                  label="单价 (RMB)"
                  placeholder="请输入单价"
                  startContent={<span className="text-default-400">¥</span>}
                  type="number"
                  value={calculationFormData.unit_price?.toString() || ""}
                  onChange={(e) =>
                    setCalculationFormData({
                      ...calculationFormData,
                      unit_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="每臺機用量"
                  placeholder="请输入使用量"
                  type="number"
                  value={calculationFormData.usage_per_set?.toString() || ""}
                  onChange={(e) =>
                    setCalculationFormData({
                      ...calculationFormData,
                      usage_per_set: parseInt(e.target.value) || 0,
                    })
                  }
                />

                <Input
                  label="使用次数"
                  placeholder="请输入使用次数"
                  type="number"
                  value={calculationFormData.usage_count?.toString() || ""}
                  onChange={(e) =>
                    setCalculationFormData({
                      ...calculationFormData,
                      usage_count: parseInt(e.target.value) || 0,
                    })
                  }
                />

                <Input
                  label="当月产能"
                  placeholder="请输入当月产能"
                  type="number"
                  value={calculationFormData.monthly_capacity?.toString() || ""}
                  onChange={(e) =>
                    setCalculationFormData({
                      ...calculationFormData,
                      monthly_capacity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {/* 月度库存和需求数据 */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">月度库存和需求数据</h4>
                <div className="text-sm text-gray-600 mb-2">
                  请按照表格显示的顺序填写，确保数据对应正确
                </div>

                {/* 按月份顺序排列，每个月份包含库存和需求 */}
                {monthInfo.months.slice(0, 3).map((m, index) => {
                  // 计算上个月的库存日期
                  let prevMonth = m.month - 1;
                  let prevYear = m.year;

                  if (prevMonth <= 0) {
                    prevMonth = 12;
                    prevYear = m.year - 1;
                  }
                  const stockKey = `${prevYear}/${String(prevMonth).padStart(2, "0")}/22`;
                  const stockLabel = `${prevYear}/${String(prevMonth).padStart(2, "0")}/22库存`;

                  const monthKey = `${m.year}-${String(m.month).padStart(2, "0")}`;
                  const demandLabel = `${m.year}年${m.month}月需求`;

                  return (
                    <div
                      key={m.year + "-" + m.month}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <h5 className="font-medium mb-3 text-blue-600">
                        {m.year}年{m.month}月份明細
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={stockLabel}
                          placeholder={`请输入${stockLabel}`}
                          type="number"
                          value={
                            calculationFormData.monthly_data?.[
                              stockKey
                            ]?.stock?.toString() || ""
                          }
                          onChange={(e) =>
                            setCalculationFormData((prev) => ({
                              ...prev,
                              monthly_data: {
                                ...prev.monthly_data,
                                [stockKey]: {
                                  ...prev.monthly_data?.[stockKey],
                                  stock: parseInt(e.target.value) || 0,
                                },
                              },
                            }))
                          }
                        />
                        <Input
                          label={demandLabel}
                          placeholder={`请输入${demandLabel}`}
                          type="number"
                          value={
                            calculationFormData.monthly_data?.[
                              monthKey
                            ]?.demand?.toString() || ""
                          }
                          onChange={(e) =>
                            setCalculationFormData((prev) => ({
                              ...prev,
                              monthly_data: {
                                ...prev.monthly_data,
                                [monthKey]: {
                                  ...prev.monthly_data?.[monthKey],
                                  demand: parseInt(e.target.value) || 0,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                })}

                {/* 目标月份库存 */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h5 className="font-medium mb-3 text-blue-600">
                    {monthInfo.year}年{monthInfo.targetMonth}月份库存
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                    <Input
                      label={`${monthInfo.year}/${String(monthInfo.targetMonth).padStart(2, "0")}/22库存`}
                      placeholder={`请输入${monthInfo.year}/${String(monthInfo.targetMonth).padStart(2, "0")}/22库存`}
                      type="number"
                      value={
                        calculationFormData.monthly_data?.[
                          `${monthInfo.year}/${String(monthInfo.targetMonth).padStart(2, "0")}/22`
                        ]?.stock?.toString() || ""
                      }
                      onChange={(e) =>
                        setCalculationFormData((prev) => ({
                          ...prev,
                          monthly_data: {
                            ...prev.monthly_data,
                            [`${monthInfo.year}/${String(monthInfo.targetMonth).padStart(2, "0")}/22`]:
                              {
                                ...prev.monthly_data?.[
                                  `${monthInfo.year}/${String(monthInfo.targetMonth).padStart(2, "0")}/22`
                                ],
                                stock: parseInt(e.target.value) || 0,
                              },
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* 库存快照 */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h5 className="font-medium mb-3 text-green-600">
                    PR開立時間與數量
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={`${monthInfo.year}/06/19`}
                      placeholder={`请输入${monthInfo.year}/06/19`}
                      type="number"
                      value={
                        calculationFormData.stock_snapshots?.[
                          `${monthInfo.year}-06-19`
                        ]?.toString() || ""
                      }
                      onChange={(e) =>
                        setCalculationFormData((prev) => ({
                          ...prev,
                          stock_snapshots: {
                            ...prev.stock_snapshots,
                            [`${monthInfo.year}-06-19`]:
                              parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                    />
                    <Input
                      label={`${monthInfo.year}/06/25`}
                      placeholder={`请输入${monthInfo.year}/06/25`}
                      type="number"
                      value={
                        calculationFormData.stock_snapshots?.[
                          `${monthInfo.year}-06-25`
                        ]?.toString() || ""
                      }
                      onChange={(e) =>
                        setCalculationFormData((prev) => ({
                          ...prev,
                          stock_snapshots: {
                            ...prev.stock_snapshots,
                            [`${monthInfo.year}-06-25`]:
                              parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 追料需求数据 */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">追料需求数据</h4>
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h5 className="font-medium mb-3 text-purple-600">
                    {monthInfo.targetMonth}月追料需求
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["W01", "W02", "W03", "W04"].map((week) => {
                      const targetMonthKey = `${monthInfo.year}-${String(monthInfo.targetMonth).padStart(2, "0")}`;
                      const label = `${monthInfo.targetMonth}月${week}需求`;

                      return (
                        <Input
                          key={week}
                          label={label}
                          placeholder={`请输入${label}`}
                          type="number"
                          value={
                            calculationFormData.chase_data?.[targetMonthKey]?.[
                              week
                            ]?.toString() || ""
                          }
                          onChange={(e) =>
                            setCalculationFormData((prev) => ({
                              ...prev,
                              chase_data: {
                                ...prev.chase_data,
                                [targetMonthKey]: {
                                  ...prev.chase_data?.[targetMonthKey],
                                  [week]: parseInt(e.target.value) || 0,
                                },
                              },
                            }))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 备注信息 */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">备注信息</h4>
                <Input
                  label="備註(MOQ)"
                  placeholder="请输入备注信息，如最小订购量等"
                  value={calculationFormData.moq_remark || ""}
                  onChange={(e) =>
                    setCalculationFormData({
                      ...calculationFormData,
                      moq_remark: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setCalculationModalVisible(false)}
            >
              取消
            </Button>
            <Button color="primary" onPress={handleCalculationSubmit}>
              {currentCalculationItem ? "更新" : "创建"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 批量设置采购员模态框 */}
      <Modal
        isOpen={batchPurchaserModalVisible}
        placement="center"
        size="md"
        onOpenChange={setBatchPurchaserModalVisible}
      >
        <ModalContent>
          <ModalHeader>批量设置采购员</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600">
                将为当前申请表下的所有{" "}
                <span className="font-semibold text-blue-600">
                  {calculationItems.length}
                </span>{" "}
                个计算项目统一设置采购员。
              </p>
              <Input
                description="例如：高姐姐、李采购、王采购等"
                label="采购员"
                placeholder="请输入采购员名称"
                value={batchPurchaserName}
                onChange={(e) => setBatchPurchaserName(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setBatchPurchaserModalVisible(false)}
            >
              取消
            </Button>
            <Button color="primary" onPress={handleBatchSetPurchaser}>
              批量设置
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 需求计算表专用编辑弹窗 */}
      <Modal
        className="mx-4"
        isOpen={demandCalculationModalVisible}
        placement="center"
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={setDemandCalculationModalVisible}
      >
        <ModalContent className="max-h-[90vh]">
          <ModalHeader>
            {currentDemandCalculationItem
              ? "编辑需求计算项目"
              : "新增需求计算项目"}
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {/* 调试信息和模式显示 */}
              <div className="bg-yellow-100 p-3 rounded text-sm mb-4 border">
                <strong>🔍 调试信息:</strong>
                <br />• 多站别模式: {isDemandMultiStation ? "是" : "否"}
                <br />• 站别数量:{" "}
                {isDemandMultiStation
                  ? demandMultiStationData.stations.length
                  : 1}
                <br />• 当前模式:{" "}
                {isDemandMultiStation ? "多站别编辑" : "单站别编辑"}
              </div>

              {/* 强制显示转换按钮 - 单站别模式 */}
              {!isDemandMultiStation && (
                <div className="bg-green-100 p-4 rounded-lg border border-green-300 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-green-800">✅ 单站别模式</h4>
                    <Button
                      className="font-bold"
                      color="success"
                      size="lg"
                      startContent={<PlusIcon />}
                      variant="solid"
                      onPress={convertToMultiStation}
                    >
                      🔄 转换为多站别
                    </Button>
                  </div>
                  <p className="text-sm text-green-600">
                    点击右侧按钮可以将此项目转换为多站别模式
                  </p>
                </div>
              )}

              {/* 多站别模式指示 */}
              {isDemandMultiStation && (
                <div className="bg-blue-100 p-4 rounded-lg border border-blue-300 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-blue-800">
                      🔵 多站别模式 - {demandMultiStationData.stations.length}{" "}
                      个站别
                    </h4>
                    <Button
                      color="success"
                      size="sm"
                      startContent={<PlusIcon />}
                      variant="bordered"
                      onPress={addNewDemandStation}
                    >
                      添加站别
                    </Button>
                  </div>
                  <p className="text-sm text-blue-600">
                    当前为多站别编辑模式，可以管理多个使用站别
                  </p>
                </div>
              )}

              {/* 紧急转换选项 */}
              <div className="bg-red-100 p-3 rounded-lg border border-red-300 mb-4">
                <h4 className="font-bold text-red-800 text-sm mb-2">
                  🆘 紧急转换选项
                </h4>
                <div className="flex gap-2">
                  <Button
                    color="danger"
                    size="sm"
                    variant="bordered"
                    onPress={convertToMultiStation}
                  >
                    强制转多站别
                  </Button>
                  <Button
                    color="warning"
                    size="sm"
                    variant="bordered"
                    onPress={() => setIsDemandMultiStation(false)}
                  >
                    强制转单站别
                  </Button>
                </div>
              </div>
              {/* 基础信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="No."
                  placeholder="请输入编号"
                  type="number"
                  value={demandCalculationFormData.no?.toString() || ""}
                  onChange={(e) =>
                    setDemandCalculationFormData({
                      ...demandCalculationFormData,
                      no: parseInt(e.target.value),
                    })
                  }
                />

                <Input
                  isRequired
                  label="料材名称"
                  placeholder="请输入料材名称"
                  value={demandCalculationFormData.material_name || ""}
                  onChange={(e) =>
                    setDemandCalculationFormData({
                      ...demandCalculationFormData,
                      material_name: e.target.value,
                    })
                  }
                />
              </div>

              {/* 根据模式显示不同的编辑界面 */}
              {!isDemandMultiStation ? (
                /* 单站别编辑界面 */
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold">单站别数据</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      isRequired
                      label="使用站别"
                      placeholder="请输入使用站别（如：SMT站、测试站A等）"
                      type="text"
                      value={demandCalculationFormData.usage_station || ""}
                      onChange={(e) =>
                        setDemandCalculationFormData({
                          ...demandCalculationFormData,
                          usage_station: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="每臺機用量"
                      placeholder="请输入使用量"
                      type="number"
                      value={
                        demandCalculationFormData.usage_per_set?.toString() ||
                        ""
                      }
                      onChange={(e) =>
                        setDemandCalculationFormData({
                          ...demandCalculationFormData,
                          usage_per_set: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                /* 多站别编辑界面 */
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">多站别数据管理</h4>
                  <ScrollShadow className="max-h-96">
                    <HeroTable aria-label="多站别编辑">
                      <TableHeader>
                        <TableColumn>使用站别</TableColumn>
                        <TableColumn>每臺機用量</TableColumn>
                        <TableColumn>使用次数</TableColumn>
                        <TableColumn>当月产能</TableColumn>
                        <TableColumn>最低库存</TableColumn>
                        <TableColumn>最低庫存總數</TableColumn>
                        <TableColumn>最高库存</TableColumn>
                        <TableColumn>最高庫存總數</TableColumn>
                        <TableColumn>当月需求/站</TableColumn>
                        <TableColumn>实际订购</TableColumn>
                        <TableColumn>备注(MOQ)</TableColumn>
                        <TableColumn>操作</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {demandMultiStationData.stations.map(
                          (station, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  className="w-full"
                                  placeholder="请输入使用站别"
                                  size="sm"
                                  type="text"
                                  value={station}
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "stations",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.usage_per_set[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "usage_per_set",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.usage_count[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "usage_count",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.monthly_capacity[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "monthly_capacity",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.min_stock[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "min_stock",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.min_total_stock?.[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "min_total_stock",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.max_stock[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "max_stock",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.max_total_stock[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "max_total_stock",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.monthly_demand[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "monthly_demand",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  size="sm"
                                  type="number"
                                  value={
                                    demandMultiStationData.actual_order[
                                      index
                                    ]?.toString() || "0"
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "actual_order",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-full"
                                  placeholder="备注信息"
                                  size="sm"
                                  type="text"
                                  value={
                                    demandMultiStationData.moq_remark[index] ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateDemandStationData(
                                      index,
                                      "moq_remark",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  color="danger"
                                  size="sm"
                                  startContent={<TrashIcon />}
                                  variant="light"
                                  onPress={() => removeDemandStation(index)}
                                >
                                  删除
                                </Button>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </HeroTable>
                  </ScrollShadow>

                  {/* 汇总信息 */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium mb-2">汇总信息</h5>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        总需求:{" "}
                        <span className="font-semibold text-orange-600">
                          {demandMultiStationData.monthly_demand.reduce(
                            (sum, val) => sum + val,
                            0,
                          )}
                        </span>
                      </div>
                      <div>
                        总订购:{" "}
                        <span className="font-semibold text-green-600">
                          {demandMultiStationData.actual_order.reduce(
                            (sum, val) => sum + val,
                            0,
                          )}
                        </span>
                      </div>
                      <div>
                        站别数:{" "}
                        <span className="font-semibold text-blue-600">
                          {demandMultiStationData.stations.length}
                        </span>
                      </div>
                      <div>
                        备注数:{" "}
                        <span className="font-semibold text-purple-600">
                          {
                            demandMultiStationData.moq_remark.filter(
                              (remark) => remark && remark.trim(),
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 计算相关字段 */}
              {/* 单站别模式的额外字段 */}
              {!isDemandMultiStation && (
                <>
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">计算参数</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="使用次数"
                        placeholder="请输入使用次数"
                        type="number"
                        value={
                          demandCalculationFormData.usage_count?.toString() ||
                          ""
                        }
                        onChange={(e) =>
                          setDemandCalculationFormData({
                            ...demandCalculationFormData,
                            usage_count: parseInt(e.target.value) || 0,
                          })
                        }
                      />

                      <Input
                        label={`${monthInfo.targetMonthLabel}产能`}
                        placeholder="请输入当月产能"
                        type="number"
                        value={
                          demandCalculationFormData.monthly_capacity?.toString() ||
                          ""
                        }
                        onChange={(e) =>
                          setDemandCalculationFormData({
                            ...demandCalculationFormData,
                            monthly_capacity: parseInt(e.target.value) || 0,
                          })
                        }
                      />

                      <Input
                        label="实际订购数量"
                        placeholder="请输入订购数量"
                        type="number"
                        value={
                          demandCalculationFormData.actual_order?.toString() ||
                          ""
                        }
                        onChange={(e) =>
                          setDemandCalculationFormData({
                            ...demandCalculationFormData,
                            actual_order: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* 库存和需求 */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">库存和需求</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="最低库存数量"
                        placeholder="请输入最低库存"
                        type="number"
                        value={
                          demandCalculationFormData.min_stock?.toString() || ""
                        }
                        onChange={(e) =>
                          setDemandCalculationFormData({
                            ...demandCalculationFormData,
                            min_stock: parseInt(e.target.value) || 0,
                          })
                        }
                      />

                      <Input
                        label="最高库存数量"
                        placeholder="请输入最高库存"
                        type="number"
                        value={
                          demandCalculationFormData.max_stock?.toString() || ""
                        }
                        onChange={(e) =>
                          setDemandCalculationFormData({
                            ...demandCalculationFormData,
                            max_stock: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={`${monthInfo.targetMonthLabel}需求`}
                        placeholder="请输入月需求"
                        type="number"
                        value={
                          demandCalculationFormData.monthly_demand?.toString() ||
                          ""
                        }
                        onChange={(e) =>
                          setDemandCalculationFormData({
                            ...demandCalculationFormData,
                            monthly_demand: parseInt(e.target.value) || 0,
                          })
                        }
                      />

                      <Input
                        label={`${monthInfo.targetMonthLabel}总需求`}
                        placeholder="请输入总需求"
                        type="number"
                        value={
                          demandCalculationFormData.monthly_net_demand?.toString() ||
                          ""
                        }
                        onChange={(e) =>
                          setDemandCalculationFormData({
                            ...demandCalculationFormData,
                            monthly_net_demand: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* 备注信息 */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">备注信息</h4>
                    <Input
                      label="備註(MOQ)"
                      placeholder="请输入备注信息，如最小订购量等"
                      value={demandCalculationFormData.moq_remark || ""}
                      onChange={(e) =>
                        setDemandCalculationFormData({
                          ...demandCalculationFormData,
                          moq_remark: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setDemandCalculationModalVisible(false)}
            >
              取消
            </Button>
            <Button color="primary" onPress={handleDemandCalculationSubmit}>
              {currentDemandCalculationItem ? "更新" : "创建"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DynamicApplicationDetail;
