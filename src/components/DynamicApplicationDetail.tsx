import React, { useState, useEffect } from 'react';
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
} from '@heroui/react';
import { addToast } from '@heroui/toast';
import { PlusIcon, CalculatorIcon, ArrowUpTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
// 暂时保留Ant Design的Table组件，因为它比较复杂
import { Table, Space, Popconfirm } from 'antd';
import * as XLSX from 'xlsx';
import {
  ApplicationForm,
  DynamicSupplyItem,
  DynamicCalculationItem,
  DynamicForecastData,
  dynamicSupplyItemService,
  dynamicCalculationItemService,
  dynamicForecastDataService,
} from '../services/materialManagement';
import SupplyAutoComplete from './SupplyAutoComplete';
import { SupplyItem } from '../services/supplies';

interface DynamicApplicationDetailProps {
  applicationForm: ApplicationForm;
  onBack: () => void;
  allowReturn?: boolean;  // 添加这个可选属性
}

const DynamicApplicationDetail: React.FC<DynamicApplicationDetailProps> = ({
  applicationForm,
  onBack,
  allowReturn = true,  // 设置默认值为true
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('management_view');
  const [calculationItems, setCalculationItems] = useState<DynamicCalculationItem[]>([]);
  const [forecastData, setForecastData] = useState<DynamicForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCapacityEditModal, setShowCapacityEditModal] = useState(false);
  const [editingCapacityData, setEditingCapacityData] = useState<Record<string, number>>({});

  // 模态框状态 - 只保留计算项目相关
  const [calculationModalVisible, setCalculationModalVisible] = useState(false);
  const [batchPurchaserModalVisible, setBatchPurchaserModalVisible] = useState(false);
  const [currentCalculationItem, setCurrentCalculationItem] = useState<DynamicCalculationItem | null>(null);

  // 表单数据 - 只保留计算项目相关
  const [calculationFormData, setCalculationFormData] = useState<Partial<DynamicCalculationItem>>({
    actual_order: 0,
    unit_price: 0,
    // 月度库存和需求明细默认值
    apr_2025_stock: 0,
    may_2025_demand: 0,
    may_2025_stock: 0,
    jun_2025_demand: 0,
    jun_2025_stock: 0,
    jul_2025_stock: 0,
    aug_2025_demand: 0,
    // 现阶段库存默认值
    current_stock_0619: 0,
    current_stock_0625: 0,
    // 追料需求默认值
    jul_m01_demand: 0,
    jul_m02_demand: 0,
    jul_m03_demand: 0,
    jul_m04_demand: 0,
    total_amount: 0
  });

  const [batchPurchaserName, setBatchPurchaserName] = useState('');

  useEffect(() => {
    loadCalculationItems();
    loadForecastData();
  }, [applicationForm.id]);

  // 初始化编辑数据
  useEffect(() => {
    if (forecastData.length > 0 && forecastData[0].forecast_data?.capacity_forecast?.six_month_capacity) {
      setEditingCapacityData(forecastData[0].forecast_data.capacity_forecast.six_month_capacity);
    }
  }, [forecastData]);

  // 加载计算表数据
  const loadCalculationItems = async () => {
    setLoading(true);
    try {
      const data = await dynamicCalculationItemService.getByForm(applicationForm.id);
      setCalculationItems(data);
    } catch (error) {
      console.error('加载计算表数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载预测数据
  const loadForecastData = async () => {
    try {
      const data = await dynamicForecastDataService.getByForm(applicationForm.id);
      setForecastData(data);
    } catch (error) {
      console.error('加载预测数据失败');
    }
  };

  // 由于现在使用整合数据，供应项目相关的操作已合并到计算项目中

  // 计算表相关操作
  const handleCreateCalculationItem = () => {
    setCurrentCalculationItem(null);
    setCalculationFormData({ 
      no: calculationItems.length + 1,  // 自动设置序号
      material_name: '',  // 必填字段
      usage_station: '',  // 必填字段
      usage_per_set: 1,  // 默认每套机用量为1
      usage_count: 1000,  // 默认使用次数为1000
      monthly_capacity: 497700,  // 默认月产能
      min_stock: 0,  // 默认最低库存
      max_stock: 0,  // 默认最高库存
      monthly_demand: 0,  // 默认月需求
      monthly_net_demand: 0,  // 默认净需求
      actual_order: 0,  // 默认实际订购数量
      unit_price: 0,  // 默认单价
      purchaser: '',  // 默认采购员
      
      // 月度库存和需求明细默认值
      apr_2025_stock: 0,
      may_2025_demand: 0,
      may_2025_stock: 0,
      jun_2025_demand: 0,
      jun_2025_stock: 0,
      jul_2025_stock: 0,
      aug_2025_demand: 0,
      
      // 现阶段库存默认值
      current_stock_0619: 0,
      current_stock_0625: 0,
      
      // 追料需求默认值
      jul_m01_demand: 0,
      jul_m02_demand: 0,
      jul_m03_demand: 0,
      jul_m04_demand: 0,
      
      total_amount: 0,
      moq_remark: '',  // 默认备注为空
    });
    setCalculationModalVisible(true);
  };

  const handleEditCalculationItem = (item: DynamicCalculationItem) => {
    setCurrentCalculationItem(item);
    setCalculationFormData(item);
    setCalculationModalVisible(true);
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
        ),
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error('删除计算项目失败:', error);
      addToast({
        title: "错误",
        description: "删除失败，请重试",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 处理耗材选择 - 自动填充相关信息
  const handleSupplySelect = (supply: SupplyItem) => {
    setCalculationFormData(prev => ({
      ...prev,
      material_name: supply.name,
      purchaser: supply.purchaser || prev.purchaser,
      unit_price: parseFloat(supply.unit_price) || prev.unit_price,
      moq: supply.min_order_quantity || prev.moq,
      usage_per_set: supply.usage_per_machine || prev.usage_per_set,
      usage_count: supply.standard_usage_count || prev.usage_count,
      usage_station: supply.usage_station || prev.usage_station,
      // 根据库存数量设置建议的库存值
      min_stock: supply.min_stock || prev.min_stock,
      max_stock: supply.max_stock || prev.max_stock,
      // 可以根据当前库存量设置初始值
      current_stock_0619: supply.current_stock || prev.current_stock_0619,
      current_stock_0625: supply.current_stock || prev.current_stock_0625,
    }));
    
    // 显示自动填充提示
    addToast({
      title: "提示",
      description: `✅ 已自动填充耗材信息：
      
📦 物料名称: ${supply.name}
👤 采购员: ${supply.purchaser || '未指定'}
💰 单价: ¥${parseFloat(supply.unit_price).toFixed(2)}
📊 当前库存: ${supply.current_stock.toLocaleString()}
🏭 MOQ: ${supply.min_order_quantity || '未设置'}
      
请检查并完善其他计算参数。`,
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

  const handleCalculationSubmit = async () => {
    let submittedFormData: Partial<DynamicCalculationItem> | null = null;
    
    try {
      const isEditing = !!currentCalculationItem;
      
      // Helper function to safely parse numbers
      const parseNumber = (value: any, isDecimal = false) => {
        if (value === undefined || value === null || value === '') {
          return 0;
        }
        const num = isDecimal ? parseFloat(value.toString()) : parseInt(value.toString());
        return isNaN(num) ? 0 : num;
      };
      
      // Helper function to check if a value should be included
      const shouldIncludeValue = (value: any): boolean => {
        return value !== undefined && value !== null && value !== '';
      };
      
      // Helper function to format decimal number
      const formatDecimal = (value: number): string => {
        return value.toFixed(2);
      };
      
      // Calculate total amount if we have unit price
      const calculateTotalAmount = (): number => {
        const unitPrice = parseNumber(calculationFormData.unit_price, true);
        const monthlyDemand = parseNumber(calculationFormData.monthly_demand);
        return unitPrice * monthlyDemand;
      };
      
      // Ensure all necessary fields have proper types
      const formData: Partial<DynamicCalculationItem> = {
        form: applicationForm.id,
        
        // Basic information - integers (required)
        no: parseNumber(calculationFormData.no) || (calculationItems.length + 1),
        
        // String fields - required with default empty string
        material_name: calculationFormData.material_name || '',
        usage_station: calculationFormData.usage_station || '',
        purchaser: calculationFormData.purchaser || '',  // 确保有默认值
        moq_remark: calculationFormData.moq_remark || '',
        linked_material: calculationFormData.linked_material || '',
        
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
        ...(shouldIncludeValue(calculationFormData.moq) ? { moq: parseNumber(calculationFormData.moq) } : {}),
        ...(shouldIncludeValue(calculationFormData.linked_supply_item_id) ? { linked_supply_item_id: parseNumber(calculationFormData.linked_supply_item_id) } : {}),
        
        // Decimal fields - only include if they have values
        ...(shouldIncludeValue(calculationFormData.unit_price) ? { unit_price: parseNumber(calculationFormData.unit_price, true) } : {}),
        
        // Monthly data - integers (required)
        apr_2025_stock: parseNumber(calculationFormData.apr_2025_stock),
        may_2025_demand: parseNumber(calculationFormData.may_2025_demand),
        may_2025_stock: parseNumber(calculationFormData.may_2025_stock),
        jun_2025_demand: parseNumber(calculationFormData.jun_2025_demand),
        jun_2025_stock: parseNumber(calculationFormData.jun_2025_stock),
        jul_2025_stock: parseNumber(calculationFormData.jul_2025_stock),
        aug_2025_demand: parseNumber(calculationFormData.aug_2025_demand),
        
        // Current stock data - integers (required)
        current_stock_0619: parseNumber(calculationFormData.current_stock_0619),
        current_stock_0625: parseNumber(calculationFormData.current_stock_0625),
        
        // Demand data - integers (required)
        jul_m01_demand: parseNumber(calculationFormData.jul_m01_demand),
        jul_m02_demand: parseNumber(calculationFormData.jul_m02_demand),
        jul_m03_demand: parseNumber(calculationFormData.jul_m03_demand),
        jul_m04_demand: parseNumber(calculationFormData.jul_m04_demand),
        
        // Calculate total amount only if we have unit price
        ...(shouldIncludeValue(calculationFormData.unit_price) ? { total_amount: calculateTotalAmount() } : {}),
      };
      
      submittedFormData = formData;

      // Add debug logging
      console.log('表单提交数据:', {
        isEditing,
        currentCalculationItem,
        formData,
        applicationForm,
        calculationItems: calculationItems.length
      });

      if (currentCalculationItem) {
        await dynamicCalculationItemService.update(currentCalculationItem.id, formData);
        console.log('更新计算项目成功');
      } else {
        await dynamicCalculationItemService.create(formData);
        console.log('创建计算项目成功');
      }

      // 关闭模态框并重新加载数据
      setCalculationModalVisible(false);
      // 重新加载计算项目数据
      await loadCalculationItems();
      // 移除这行，不再强制切换到管控表视图
      // setActiveTab('management_view');

    } catch (error) {
      console.error('提交计算项目失败:', error);
      addToast({
        title: "错误",
        description: "提交失败，请检查数据是否正确",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
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
      const response = await fetch(`/api/dynamic-calculation-items/batch_update_purchaser/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          form_id: applicationForm.id,
          purchaser: purchaser
        }),
      });

      if (!response.ok) {
        throw new Error('批量设置采购员失败');
      }

      // 重新加载数据
      await loadCalculationItems();
      addToast({
        title: "成功",
        description: `成功将所有项目的采购员设置为：${purchaser}`,
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
    } catch (error) {
      console.error('批量设置采购员失败:', error);
      addToast({
        title: "错误",
        description: "批量设置采购员失败，请重试",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 解析申请周期并生成动态月份信息
  const parseApplicationPeriod = () => {
    const period = applicationForm.period || '2025年7月';
    
    // 提取年份和月份
    const yearMatch = period.match(/(\d{4})/);
    const monthMatch = period.match(/(\d{1,2})月/);
    
    const year = yearMatch ? parseInt(yearMatch[1]) : 2025;
    const targetMonth = monthMatch ? parseInt(monthMatch[1]) : 7;
    
    // 生成目标月份的前后月份
    const months = [];
    for (let i = -2; i <= 2; i++) {
      const currentMonth = targetMonth + i;
      let actualMonth = currentMonth;
      let actualYear = year;
      
      if (currentMonth <= 0) {
        actualMonth = 12 + currentMonth;
        actualYear = year - 1;
      } else if (currentMonth > 12) {
        actualMonth = currentMonth - 12;
        actualYear = year + 1;
      }
      
      months.push({
        year: actualYear,
        month: actualMonth,
        label: `${actualYear}年${actualMonth}月`,
        shortLabel: `${actualMonth}月`,
        isTarget: i === 0
      });
    }
    
    return {
      year,
      targetMonth,
      months,
      targetMonthLabel: `${year}年${targetMonth}月`
    };
  };

  // 获取动态月份信息
  const monthInfo = parseApplicationPeriod();

  // 🔧 动态生成字段名称映射
  const generateFieldMapping = () => {
    const targetMonth = monthInfo.targetMonth;
    const targetYear = monthInfo.year;
    const months = monthInfo.months.slice(0, 3); // 前3个月
    
    // 月份数字到英文缩写的映射
    const monthToAbbr = (month: number): string => {
      const map: { [key: number]: string } = {
        1: 'jan', 2: 'feb', 3: 'mar', 4: 'apr', 5: 'may', 6: 'jun',
        7: 'jul', 8: 'aug', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dec'
      };
      return map[month] || 'jan';
    };
    
    // 生成月份字段名称映射
    const fieldMapping = {
      // 第一个月需求和库存
      prevMonthDemand: `${monthToAbbr(months[0].month)}_2025_demand`,
      prevMonthStock: `${monthToAbbr(months[0].month)}_2025_stock`,
      
      // 第二个月需求和库存
      secondMonthDemand: `${monthToAbbr(months[1].month)}_2025_demand`,
      secondMonthStock: `${monthToAbbr(months[1].month)}_2025_stock`,
      
      // 目标月份需求和库存
      targetMonthDemand: 'monthly_demand', // 这个字段在计算表中是通用的
      targetMonthStock: `${monthToAbbr(months[2].month)}_2025_stock`,
      
      // 追料需求字段（使用目标月份）
      m01Field: `${monthToAbbr(targetMonth)}_m01_demand`,
      m02Field: `${monthToAbbr(targetMonth)}_m02_demand`,
      m03Field: `${monthToAbbr(targetMonth)}_m03_demand`,
      m04Field: `${monthToAbbr(targetMonth)}_m04_demand`,
    };
    
    console.log('🔧 字段映射生成:', {
      targetMonth,
      months: months.map(m => `${m.year}年${m.month}月`),
      fieldMapping
    });
    
    return fieldMapping;
  };

  // 获取字段映射
  const fieldMapping = generateFieldMapping();

  // 打开批量设置采购员模态框
  const handleOpenBatchPurchaserModal = () => {
    setBatchPurchaserName('');
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }

    const purchaserName = batchPurchaserName.trim();
    
    const itemsToUpdate = calculationItems.filter(item => item.purchaser !== purchaserName);
    
    if (itemsToUpdate.length === 0) {
      addToast({
        title: "提示",
        description: "所有项目的采购员已经是这个值，无需更新",
        color: "primary",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12" y2="8"/>
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
      setBatchPurchaserName('');
      addToast({
        title: "成功",
        description: `成功将 ${itemsToUpdate.length} 个项目的采购员设置为: ${purchaserName}`,
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
    } catch (error) {
      console.error('批量设置采购员失败:', error);
      
      let errorMessage = '批量设置采购员失败';
      if (error instanceof Error) {
        errorMessage += `：${error.message}`;
      }
      
      addToast({
        title: "错误",
        description: `❌ ${errorMessage}\n\n请检查网络连接或联系管理员`,
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
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
      const result = await dynamicCalculationItemService.calculateDemands(applicationForm.id);
      await loadCalculationItems();
      addToast({
        title: "成功",
        description: result.message,
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
    } catch (error) {
      console.error('计算需求失败:', error);
      addToast({
        title: "错误",
        description: "计算失败，请重试",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 导出管控表 - B453标准格式
  const handleExportManagement = () => {
    const wb = XLSX.utils.book_new();
    
    // 🔧 动态生成月份明细标题
    const targetMonth = monthInfo.targetMonth;
    const targetYear = monthInfo.year;
    const months = monthInfo.months.slice(0, 3); // 取前3个月（前两个月+当前月）
    
    // 动态生成主标题
    const mainTitle = `TE課B453 SMT ATE ${targetYear}年${targetMonth}月份耗材管控表`;
    
    // 动态生成主表头
    const mainHeaders = [
      '序號', '物料描述', '單位', '採購員', '', '安全庫存', '', '最小採購量(MOQ)', 'L/T Wks',
      `${targetYear}年${months[1].month}月份明細`, '', // 第二个月
      `${targetYear}年${months[2].month}月份明細`, '', // 第三个月（目标月）
      '现阶段库存', '', 
      '追料需求', '', '', '', 
      '总金额(RMB)', '備註'
    ];
    
    // 动态生成子表头
    const subHeaders = [
      '', '', '', '', '單價(RMB)', '最低', '最高', '', '', 
      `${targetYear}/${months[0].month}/2庫存`, // 第一个月库存
      `${targetYear}年${months[1].month}月份需求`, // 第二个月需求
      `${targetYear}/${months[1].month}/2庫存`, // 第二个月库存
      `${targetYear}年${months[2].month}月份需求`, // 第三个月需求
      `${targetYear}/${months[2].month}/2庫存`, // 第三个月库存
      `${targetYear}/${months[2].month}/19數量`, // 现阶段库存
      `${targetYear-1}/${months[2].month}/25數量`, // 去年同期库存
      `${targetMonth}月M01`, `${targetMonth}月M02`, `${targetMonth}月M03`, `${targetMonth}月M04`, // 追料需求
      '', ''
    ];
    
    // 🔧 按照真实B453格式重新设计表头（完整23列版本A-W）
    const worksheetData = [
      // 第1行：主标题行 (A1:W1合并)
      [mainTitle, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // 第2行：主表头 (第一级)
      mainHeaders,
      
      // 第3行：子表头 (第二级)
      subHeaders,
      
      // 数据行 (23列完整版本 A-W)
      ...calculationItems.map(item => [
        item.no || '',                                                            // A: 序號
        item.material_name || '',                                                 // B: 物料描述
        'pcs',                                                                   // C: 單位
        item.purchaser || '未指定',                                              // D: 採購員
        typeof item.unit_price === 'number' ? item.unit_price.toFixed(2) : '0.00', // E: 單價(RMB)
        item.min_stock || 0,                                                     // F: 安全庫存-最低
        item.max_stock || 0,                                                     // G: 安全庫存-最高
        item.moq || '',                                                          // H: 最小採購量(MOQ)
        '15',                                                                    // I: L/T Wks
        item.apr_2025_stock || 0,                                               // J: 2025/4/2庫存
        item.may_2025_demand || 0,                                              // K: 2025年5月份需求
        item.may_2025_stock || 0,                                               // L: 2025/5/2庫存
        item.jun_2025_demand || 0,                                              // M: 2025年6月份需求
        item.jun_2025_stock || 0,                                               // N: 2025/6/2庫存
        item.monthly_demand || 0,                                               // O: 2025年7月份需求
        item.current_stock_0619 || 0,                                           // P: 2025/6/19現階段數量
        item.current_stock_0625 || 0,                                           // Q: 2024/6/25現階段數量
        item.jul_m01_demand || 0,                                               // R: 7月M01
        item.jul_m02_demand || 0,                                               // S: 7月M02
        item.jul_m03_demand || 0,                                               // T: 7月M03
        item.jul_m04_demand || 0,                                               // U: 7月M04
        ((item.unit_price || 0) * (item.monthly_demand || 0)).toFixed(2),       // V: 總金額(RMB)
        item.moq_remark || ''                                                   // W: 備註
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 🔧 按照真实B453格式设置列宽 (23列完整版本 A-W)
    ws['!cols'] = [
      { wch: 8 },   // A: 序號
      { wch: 40 },  // B: 物料描述
      { wch: 8 },   // C: 單位
      { wch: 10 },  // D: 採購員
      { wch: 12 },  // E: 單價(RMB)
      { wch: 10 },  // F: 安全庫存-最低
      { wch: 10 },  // G: 安全庫存-最高
      { wch: 12 },  // H: 最小採購量(MOQ)
      { wch: 8 },   // I: L/T Wks
      { wch: 12 },  // J: 2025/4/2庫存
      { wch: 12 },  // K: 2025年5月份需求
      { wch: 12 },  // L: 2025/5/2庫存
      { wch: 12 },  // M: 2025年6月份需求
      { wch: 12 },  // N: 2025/6/2庫存
      { wch: 12 },  // O: 2025年7月份需求
      { wch: 12 },  // P: 2025/6/19數量
      { wch: 12 },  // Q: 2024/6/25數量
      { wch: 10 },  // R: 7月M01
      { wch: 10 },  // S: 7月M02
      { wch: 10 },  // T: 7月M03
      { wch: 10 },  // U: 7月M04
      { wch: 12 },  // V: 總金額(RMB)
      { wch: 15 }   // W: 備註
    ];

    // 🔧 按照真实B453格式设置合并单元格 (23列版本 A-W)
    ws['!merges'] = [
      // 第1行：主标题行 (A1:W1) - 23列
      { s: { r: 0, c: 0 }, e: { r: 0, c: 22 } },
      
      // 第2行：主表头合并
      { s: { r: 1, c: 5 }, e: { r: 1, c: 6 } },   // 安全庫存 (F2:G2)
      { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } },  // 2025年5月份明細 (J2:K2)
      { s: { r: 1, c: 11 }, e: { r: 1, c: 12 } }, // 2025年6月份明細 (L2:M2)
      { s: { r: 1, c: 13 }, e: { r: 1, c: 14 } }, // 2025年7月份明細 (N2:O2)
      { s: { r: 1, c: 15 }, e: { r: 1, c: 16 } }, // 现阶段库存 (P2:Q2)
      { s: { r: 1, c: 17 }, e: { r: 1, c: 20 } }  // 追料需求 (R2:U2)
    ];

    XLSX.utils.book_append_sheet(wb, ws, "B453耗材管控表");
    
    const fileName = `B453_SMT_ATE耗材管控表_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addToast({
      title: "成功",
      description: "管控表导出成功",
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

  // 导出计算表
  const handleExportCalculation = () => {
    const wb = XLSX.utils.book_new();
    
    // 获取六个月产能数据
    const sixMonthCapacity = forecastData.length > 0 ? 
      (forecastData[0].forecast_data?.capacity_forecast?.six_month_capacity || {}) : {};
    
    const calculationData = [
      [`TE課B453 SMT ATE ${applicationForm.period}耗材需求計算`, '', '', '', '', '', '', '', '', '', '', ''],
      ['No.', '料材名稱', '使用站別', '每套機用量', '使用次數', `${monthInfo.targetMonthLabel}產能`, '最低庫存數量', '最高庫存數量', `${monthInfo.targetMonthLabel}需求`, `${monthInfo.targetMonthLabel}網路需求`, '實際訂購數量', '備註(MOQ)'],
      ...calculationItems.map(item => [
        item.no || '',
        item.material_name || '',
        item.usage_station || '',
        item.usage_per_set || 0,
        item.usage_count || 0,
        item.monthly_capacity || 0,
        item.min_stock || 0,
        item.max_stock || 0,
        item.monthly_demand || 0,
        item.monthly_net_demand || 0,
        item.actual_order || 0,
        item.moq_remark || ''
      ]),
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      [`${monthInfo.targetMonthLabel}產能按${monthInfo.targetMonthLabel}Cum Input Qty為準`, '', '', '', '', '', '', '', '', '', '', ''],
      [`${monthInfo.targetMonthLabel}需求=${monthInfo.targetMonthLabel}產能*每套機用量/使用次數`, '', '', '', '', '', '', '', '', '', '', ''],
      ['最低庫存=六個月中最低產能*每套機用量/使用次數', '', '', '', '', '', '', '', '', '', '', ''],
      ['最高庫存=六個月中最高產能*每套機用量/使用次數', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['產能預測', '', '', '', '', '', '', '', '', '', '', ''],
      ['Item', ...Object.keys(sixMonthCapacity), ''],
      ['Forecast', ...Object.values(sixMonthCapacity).map(value => value || ''), '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(calculationData);
    
    ws['!cols'] = [
      { wch: 8 },
      { wch: 50 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "B453耗材需求計算");
    
    const fileName = `B453_SMT_ATE耗材需求計算_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addToast({
      title: "成功",
      description: "计算表导出成功",
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

  // 导出预测数据
  const handleExportForecast = () => {
    const wb = XLSX.utils.book_new();
    
    const forecastSheetData = [
      [`TE課B453 SMT ATE ${applicationForm.period}預測數據`, '', '', '', '', ''],
      ['預測項目', '3月', '4月', '5月', '6月', '7月'],
             ...forecastData.map(forecast => [
         forecast.name,
         (forecast.forecast_data?.capacity_forecast as any)?.mar_25 || '',
         (forecast.forecast_data?.capacity_forecast as any)?.apr_25 || '',
         (forecast.forecast_data?.capacity_forecast as any)?.may_25 || '',
         (forecast.forecast_data?.capacity_forecast as any)?.jun_25 || '',  
         (forecast.forecast_data?.capacity_forecast as any)?.jul_25 || ''
       ]),
      ['', '', '', '', '', ''],
      ['PRPM立項安排', '', '', '', '', ''],
      ['物料', '預計立項時間', '', '', '', ''],
    ];

    if (forecastData.length > 0 && forecastData[0].forecast_data?.prpm_schedule) {
      Object.entries(forecastData[0].forecast_data.prpm_schedule).forEach(([material, date]) => {
        forecastSheetData.push([material, String(date), '', '', '', '']);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(forecastSheetData);
    
    ws['!cols'] = [
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "B453預測數據");
    
    const fileName = `B453_SMT_ATE預測數據_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addToast({
      title: "成功",
      description: "预测数据导出成功",
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

  // 复制预测数据
  const copyForecastData = async (sourceFormId: number, targetFormId: number) => {
    try {
      await dynamicForecastDataService.copyToNewForm(sourceFormId, targetFormId);
      addToast({
        title: "成功",
        description: "产能数据复制成功",
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
      loadForecastData();
    } catch (error) {
      console.error('复制产能数据失败:', error);
      addToast({
        title: "错误",
        description: "复制产能数据失败",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  // 渲染产能预测信息
  const renderCapacityForecast = (forecast: DynamicForecastData) => {
    if (!forecast.forecast_data?.capacity_forecast) return null;

    const capacityData = forecast.forecast_data.capacity_forecast;
    return (
      <div>
        <h4 className="text-md font-semibold mb-3 text-orange-600">产能预测信息</h4>
        <div className="bg-orange-50 p-4 rounded-lg space-y-4">
          {/* 当月产能 */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">当月产能:</span>
            <span className="font-bold text-orange-600">
              {capacityData.monthly_capacity?.toLocaleString() || '0'}
            </span>
          </div>

          {/* 六个月产能数据 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">最近六个月产能数据:</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={() => {
                    setEditingCapacityData(capacityData.six_month_capacity || {});
                    setShowCapacityEditModal(true);
                  }}
                >
                  编辑产能数据
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    {Object.keys(capacityData.six_month_capacity || {}).map((month) => (
                      <th key={month} className="px-2 py-1 text-xs font-medium text-gray-500">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Object.entries(capacityData.six_month_capacity || {}).map(([month, capacity]) => (
                      <td key={month} className="px-2 py-1 text-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {(capacity as number).toLocaleString()}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 已移除独立的管控表列定义，现在使用整合的管控表视图

  // 管控表视图列定义 - B453标准格式，动态生成月份列
  const managementViewColumns = [
    {
      title: '序号',
      dataIndex: 'no',
      key: 'no',
      width: 60,
    },
    {
      title: '物料描述',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '单位',
      key: 'unit_type',
      width: 60,
      render: () => 'pcs',
    },
    {
      title: '采购员',
      dataIndex: 'purchaser',
      key: 'purchaser',
      width: 80,
      render: (purchaser: string) => {
        return purchaser || '未指定';
      },
    },
    {
      title: '单价(RMB)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (price: any) => {
        const numPrice = price ? parseFloat(price.toString()) : 0;
        return (
          <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
            ¥{numPrice.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '安全库存',
      children: [
        {
          title: '最低',
          dataIndex: 'min_stock',
          key: 'min_stock',
          width: 80,
        },
        {
          title: '最高',
          dataIndex: 'max_stock',  
          key: 'max_stock',
          width: 80,
        },
      ],
    },
    {
      title: 'MOQ',
      dataIndex: 'moq',
      key: 'moq',
      width: 80,
    },
    {
      title: 'L/T(Wks)',
      key: 'lead_time',
      width: 80,
      render: () => '2', // 标准L/T为2周
    },
    // 🔧 动态生成月份列（使用字段映射）
    ...monthInfo.months.slice(0, 3).map((monthData, index) => ({
      title: `${monthData.label}明细`,
      children: [
        // 第一个月显示需求和库存
        ...(index === 0 ? [
          {
            title: `${monthData.shortLabel}需求`,
            dataIndex: fieldMapping.prevMonthDemand,
            key: fieldMapping.prevMonthDemand,
            width: 100,
            render: (demand: number) => (
              <span style={{ color: '#fa8c16', fontWeight: 'normal' }}>
                {(typeof demand === 'number' ? demand.toLocaleString() : '0')}
              </span>
            ),
          },
          {
            title: `${monthData.year}/${monthData.month}/2库存`,
            dataIndex: fieldMapping.prevMonthStock,
            key: fieldMapping.prevMonthStock,
            width: 100,
            render: (stock: number) => (
              <span style={{ color: '#722ed1' }}>
                {(typeof stock === 'number' ? stock.toLocaleString() : '0')}
              </span>
            ),
          }
        ] : []),
        // 第二个月显示需求和库存
        ...(index === 1 ? [
          {
            title: `${monthData.shortLabel}需求`,
            dataIndex: fieldMapping.secondMonthDemand,
            key: fieldMapping.secondMonthDemand,
            width: 100,
            render: (demand: number) => (
              <span style={{ color: '#fa8c16', fontWeight: 'normal' }}>
                {(typeof demand === 'number' ? demand.toLocaleString() : '0')}
              </span>
            ),
          },
          {
            title: `${monthData.year}/${monthData.month}/2库存`,
            dataIndex: fieldMapping.secondMonthStock,
            key: fieldMapping.secondMonthStock,
            width: 100,
            render: (stock: number) => (
              <span style={{ color: '#722ed1' }}>
                {(typeof stock === 'number' ? stock.toLocaleString() : '0')}
              </span>
            ),
          }
        ] : []),
        // 目标月份显示需求和库存
        ...(index === 2 ? [
          {
            title: `${monthData.shortLabel}需求`,
            dataIndex: fieldMapping.targetMonthDemand,
            key: fieldMapping.targetMonthDemand,
            width: 100,
            render: (demand: number) => (
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                {(typeof demand === 'number' ? demand.toLocaleString() : '0')}
              </span>
            ),
          },
          {
            title: `${monthData.year}/${monthData.month}/2库存`,
            dataIndex: fieldMapping.targetMonthStock,
            key: fieldMapping.targetMonthStock,
            width: 100,
            render: (stock: number) => (
              <span style={{ color: '#722ed1' }}>
                {(typeof stock === 'number' ? stock.toLocaleString() : '0')}
              </span>
            ),
          }
        ] : []),
      ],
    })),
    {
      title: '现阶段库存',
      children: [
        {
          title: `${monthInfo.year}/${monthInfo.targetMonth > 1 ? monthInfo.targetMonth - 1 : 12}/19数量`,
          dataIndex: 'current_stock_0619',
          key: 'current_stock_0619',
          width: 100,
          render: (stock: number) => (
            <span style={{ color: '#13c2c2', backgroundColor: '#e6fffb' }}>
              {(typeof stock === 'number' ? stock.toLocaleString() : '0')}
            </span>
          ),
        },
        {
          title: `${monthInfo.year}/${monthInfo.targetMonth > 1 ? monthInfo.targetMonth - 1 : 12}/25数量`,
          dataIndex: 'current_stock_0625',
          key: 'current_stock_0625',
          width: 100,
          render: (stock: number) => (
            <span style={{ color: '#13c2c2', backgroundColor: '#e6fffb' }}>
              {(typeof stock === 'number' ? stock.toLocaleString() : '0')}
            </span>
          ),
        },
      ],
    },
    {
      title: '追料需求',
      children: [
        {
          title: `${monthInfo.targetMonth}月M01`,
          dataIndex: fieldMapping.m01Field,
          key: fieldMapping.m01Field,
          width: 80,
          render: (demand: number) => (
            <span style={{ color: '#eb2f96' }}>
              {(typeof demand === 'number' ? demand.toLocaleString() : '0')}
            </span>
          ),
        },
        {
          title: `${monthInfo.targetMonth}月M02`,
          dataIndex: fieldMapping.m02Field,
          key: fieldMapping.m02Field,
          width: 80,
          render: (demand: number) => (
            <span style={{ color: '#eb2f96' }}>
              {(typeof demand === 'number' ? demand.toLocaleString() : '0')}
            </span>
          ),
        },
        {
          title: `${monthInfo.targetMonth}月M03`,
          dataIndex: fieldMapping.m03Field,
          key: fieldMapping.m03Field,
          width: 80,
          render: (demand: number) => (
            <span style={{ color: '#eb2f96' }}>
              {(typeof demand === 'number' ? demand.toLocaleString() : '0')}
            </span>
          ),
        },
        {
          title: `${monthInfo.targetMonth}月M04`,
          dataIndex: fieldMapping.m04Field,  
          key: fieldMapping.m04Field,
          width: 80,
          render: (demand: number) => (
            <span style={{ color: '#eb2f96' }}>
              {(typeof demand === 'number' ? demand.toLocaleString() : '0')}
            </span>
          ),
        },
      ],
    },
    {
      title: '总金额(RMB)',
      key: 'total_amount',
      width: 120,
      render: (_: any, record: DynamicCalculationItem) => {
        const unitPrice = record.unit_price ? parseFloat(record.unit_price.toString()) : 0;
        const monthlyDemand = record.monthly_demand || 0;
        const total = unitPrice * monthlyDemand;
        return (
          <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
            ¥{total.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: DynamicCalculationItem) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleEditCalculationItem(record)}
            className="min-w-12"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDeleteCalculationItem(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              size="sm" 
              color="danger" 
              variant="ghost"
              className="min-w-12"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 计算表视图列定义 - 重点显示计算信息
  const calculationViewColumns = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      width: 60,
    },
    {
      title: '料材名称',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 180,
      // ellipsis: true, // 移除省略号
      render: (name: string, record: DynamicCalculationItem) => (
        <div className="flex flex-col" style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
          <span className="font-medium">{name}</span>
          {record.linked_material && (
            <Chip size="sm" color="secondary" variant="flat" className="mt-1">
              已关联数据库
            </Chip>
          )}
        </div>
      ),
    },
    {
      title: '使用站别',
      dataIndex: 'usage_station',
      key: 'usage_station',
      width: 100,
    },
    {
      title: '单价(RMB)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (price: any) => {
        const numPrice = price ? parseFloat(price.toString()) : 0;
        return (
          <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
            ¥{numPrice.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '计算参数',
      children: [
        {
          title: '每套机用量',
          dataIndex: 'usage_per_set',
          key: 'usage_per_set',
          width: 100,
        },
        {
          title: '使用次数',
          dataIndex: 'usage_count',
          key: 'usage_count',
          width: 100,
          render: (count: number) => (typeof count === 'number' ? count.toLocaleString() : '0'),
        },
        {
          title: '当月产能',
          dataIndex: 'monthly_capacity',
          key: 'monthly_capacity',
          width: 100,
          render: (capacity: number) => (typeof capacity === 'number' ? capacity.toLocaleString() : '0'),
        },
      ],
    },
    {
      title: '库存数量',
      children: [
        {
          title: '最低库存',
          dataIndex: 'min_stock',
          key: 'min_stock',
          width: 90,
        },
        {
          title: '最高库存',
          dataIndex: 'max_stock',
          key: 'max_stock',
          width: 90,
        },
      ],
    },
    {
      title: '需求计算',
      children: [
        {
          title: '当月需求',
          dataIndex: 'monthly_demand',
          key: 'monthly_demand',
          width: 90,
          render: (demand: number) => (
            <span style={{ color: demand > 0 ? '#1890ff' : '#666' }}>
              {(typeof demand === 'number' ? demand.toLocaleString() : '0')}
            </span>
          ),
        },
        {
          title: '当月净需求',
          dataIndex: 'monthly_net_demand',
          key: 'monthly_net_demand',
          width: 100,
          render: (netDemand: number) => (
            <span style={{ color: netDemand > 0 ? '#52c41a' : '#666' }}>
              {(typeof netDemand === 'number' ? netDemand.toLocaleString() : '0')}
            </span>
          ),
        },
      ],
    },
    {
      title: '实际订购',
      dataIndex: 'actual_order',
      key: 'actual_order',
      width: 100,
      render: (order: number) => (
        <span style={{ color: '#722ed1', fontWeight: 'bold' }}>
          {(typeof order === 'number' ? order.toLocaleString() : '0')}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'moq_remark',
      key: 'moq_remark',
      width: 100,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: DynamicCalculationItem) => (
        <div className="flex gap-1 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleEditCalculationItem(record)}
            className="min-w-12 px-2"
          >
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            startContent={<CalculatorIcon className="w-3 h-3" />}
            onPress={() => {
              const updatedRecord = {
                ...record,
                monthly_demand: record.usage_count > 0 ? Math.floor(record.monthly_capacity * record.usage_per_set / record.usage_count) : 0,
              };
              updatedRecord.monthly_net_demand = Math.max(0, updatedRecord.monthly_demand - record.min_stock);
              
              const newItems = calculationItems.map(item => 
                item.id === record.id ? updatedRecord : item
              );
              setCalculationItems(newItems);
              
              dynamicCalculationItemService.update(record.id, {
                monthly_demand: updatedRecord.monthly_demand,
                monthly_net_demand: updatedRecord.monthly_net_demand,
              });
            }}
            className="min-w-16 px-2"
            aria-label="计算需求"
          >
            计算
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDeleteCalculationItem(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              size="sm" 
              color="danger" 
              variant="ghost"
              className="min-w-12 px-2"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{applicationForm.name}</span>
              <Chip size="sm" color="primary" variant="flat">{applicationForm.code}</Chip>
              <Chip size="sm" color="success" variant="flat">{applicationForm.department}</Chip>
              <Chip size="sm" color="warning" variant="flat">{applicationForm.period}</Chip>
            </div>
            {allowReturn && (  // 只在允许返回时显示返回按钮
              <Button 
                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                onPress={onBack}
                aria-label="返回上一页"
              >
                返回
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="px-4">
          <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
            <Tab key="management_view" title="管控表视图">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={handleCreateCalculationItem}
                      aria-label="新增耗材项目"
                    >
                      新增耗材项目
                    </Button>
                    <Chip size="sm" color="success" variant="flat">
                      管控视图：重点关注采购、库存、成本管控
                    </Chip>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                      onPress={handleExportManagement}
                      aria-label="导出管控表"
                    >
                      导出管控表
                    </Button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <Table
                      columns={managementViewColumns}
                      dataSource={calculationItems}
                      rowKey="id"
                      loading={loading}
                      pagination={{ pageSize: 10 }}
                      scroll={{ 
                        x: 2200, 
                        scrollToFirstRowOnChange: true 
                      }}
                      size="small"
                      className="ant-table-striped"
                      style={{
                        '--scroll-bar-width': '8px',
                        '--scroll-bar-height': '8px',
                      } as React.CSSProperties}
                    />
                  </div>
                )}
                
                {/* 管控汇总信息 */}
                {calculationItems.length > 0 && (
                  <Card className="bg-blue-50">
                    <CardBody className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-blue-600">
                            {calculationItems.length}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">管控项目数</div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-green-600">
                            ¥{calculationItems.reduce((sum, item) => {
                              const price = item.unit_price ? parseFloat(item.unit_price.toString()) : 0;
                              const order = typeof item.actual_order === 'number' ? item.actual_order : 0;
                              return sum + price * order;
                            }, 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">总采购金额</div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-purple-600">
                            {calculationItems.reduce((sum, item) => {
                              const order = typeof item.actual_order === 'number' ? item.actual_order : 0;
                              return sum + order;
                            }, 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">总订购数量</div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-orange-600">
                            {calculationItems.length > 0 && calculationItems[0]?.purchaser 
                              ? calculationItems[0].purchaser 
                              : '未指定采购员'}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">责任采购员</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>

            <Tab key="calculation_view" title="需求计算表视图">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={handleCreateCalculationItem}
                    >
                      新增计算项目
                    </Button>
                    <Button
                      variant="ghost"
                      startContent={<CalculatorIcon className="w-4 h-4" />}
                      onPress={handleCalculateDemands}
                    >
                      批量计算需求量
                    </Button>
                    <Button
                      variant="ghost"
                      color="secondary"
                      onPress={handleOpenBatchPurchaserModal}
                    >
                      批量设置采购员
                    </Button>
                    <Chip size="sm" color="warning" variant="flat">
                      计算视图：重点关注需求计算、产能分析
                    </Chip>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                      onPress={handleExportCalculation}
                    >
                      导出计算表
                    </Button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <Table
                      columns={calculationViewColumns}
                      dataSource={calculationItems}
                      rowKey="id"
                      loading={loading}
                      pagination={{ pageSize: 10 }}
                      scroll={{ 
                        x: 1600, 
                        scrollToFirstRowOnChange: true 
                      }}
                      size="small"
                      className="ant-table-striped"
                      style={{
                        '--scroll-bar-width': '8px',
                        '--scroll-bar-height': '8px',
                      } as React.CSSProperties}
                    />
                  </div>
                )}
                
                {/* 计算汇总信息 */}
                {calculationItems.length > 0 && (
                  <Card className="bg-orange-50">
                    <CardBody className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-blue-600">
                            {calculationItems[0]?.monthly_capacity && typeof calculationItems[0].monthly_capacity === 'number' 
                              ? calculationItems[0].monthly_capacity.toLocaleString() 
                              : '363,000'}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">当月产能</div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-green-600">
                            {calculationItems.reduce((sum, item) => {
                              const demand = typeof item.monthly_demand === 'number' ? item.monthly_demand : 0;
                              return sum + demand;
                            }, 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">总计算需求</div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-purple-600">
                            {calculationItems.reduce((sum, item) => {
                              const netDemand = typeof item.monthly_net_demand === 'number' ? item.monthly_net_demand : 0;
                              return sum + netDemand;
                            }, 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">总净需求</div>
                        </div>
                        <div className="text-center py-4">
                          <div className="text-3xl font-bold text-red-600">
                            {calculationItems.reduce((sum, item) => {
                              const order = typeof item.actual_order === 'number' ? item.actual_order : 0;
                              return sum + order;
                            }, 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">总实际订购</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                                 )}
               </div>
             </Tab>

             {/* 预测数据标签页 */}
             {forecastData.length > 0 && (
               <Tab key="forecast_view" title="预测数据">
                 <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <Chip size="sm" color="secondary" variant="flat">
                       预测数据：PRPM立项、进料安排、月度数据
                     </Chip>
                     <Button
                       variant="ghost"
                       startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                       onPress={handleExportForecast}
                     >
                       导出预测数据
                     </Button>
                   </div>

                   {forecastData.map((forecast, index) => (
                     <Card key={index} className="w-full">
                       <CardHeader>
                         <span className="text-lg font-semibold">{forecast.name}</span>
                       </CardHeader>
                       <CardBody>
                         <div className="space-y-6">
                           {/* 月度管控数据 */}
                           {forecast.forecast_data?.monthly_control_data && (
                             <div>
                               <h4 className="text-md font-semibold mb-3 text-blue-600">月度管控数据</h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                 {Object.entries(forecast.forecast_data.monthly_control_data).map(([month, data]: [string, any]) => (
                                   <Card key={month} className="bg-gray-50">
                                     <CardBody className="text-center">
                                       <div className="text-lg font-bold text-blue-600">{month}</div>
                                       <div className="space-y-1 text-sm">
                                         <div>项目数: <span className="font-semibold">{data.items}</span></div>
                                         <div>总库存: <span className="font-semibold text-green-600">{data.total_stock}</span></div>
                                         <div>仓库需求: <span className="font-semibold text-orange-600">{data.total_warehouse_demand || 0}</span></div>
                                         <div>总金额: <span className="font-semibold text-red-600">¥{data.total_amount?.toFixed(2) || '0.00'}</span></div>
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
                               <h4 className="text-md font-semibold mb-3 text-green-600">PRPM立项安排</h4>
                               <div className="bg-green-50 p-4 rounded-lg">
                                 {Object.entries(forecast.forecast_data.prpm_schedule).map(([material, date]: [string, any]) => (
                                   <div key={material} className="flex justify-between items-center">
                                     <span className="text-sm font-medium">{material}</span>
                                     <Chip size="sm" color="success" variant="flat">{date}</Chip>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* 进料需求安排 */}
                           {forecast.forecast_data?.material_demand_schedule && (
                             <div>
                               <h4 className="text-md font-semibold mb-3 text-purple-600">{monthInfo.targetMonth}月进料需求安排</h4>
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 {Object.entries(forecast.forecast_data.material_demand_schedule).map(([period, quantity]: [string, any]) => (
                                   <Card key={period} className={`${quantity > 0 ? 'bg-purple-50' : 'bg-gray-50'}`}>
                                     <CardBody className="text-center">
                                       <div className="text-md font-bold">{period}</div>
                                                                               <div className={`text-lg font-bold ${quantity > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                                          {(typeof quantity === 'number' ? quantity.toLocaleString() : '0')}
                                        </div>
                                       <div className="text-xs text-gray-600">pcs</div>
                                     </CardBody>
                                   </Card>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* 产能预测信息 */}
                           {forecast.forecast_data?.capacity_forecast && (
                             <div>
                               <h4 className="text-md font-semibold mb-3 text-orange-600">产能预测信息</h4>
                               <div className="bg-orange-50 p-4 rounded-lg space-y-4">
                                 {/* 当月产能 */}
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm font-medium">当月产能:</span>
                                   <span className="font-bold text-orange-600">
                                     {(forecast.forecast_data.capacity_forecast as any)?.monthly_capacity?.toLocaleString() || '363,000'}
                                   </span>
                                 </div>

                                 {/* 六个月产能数据 */}
                                 <div className="space-y-2">
                                   <div className="text-sm font-medium mb-2">最近六个月产能数据:</div>
                                   <div className="overflow-x-auto">
                                     <table className="min-w-full">
                                       <thead>
                                         <tr>
                                           {Object.keys((forecast.forecast_data.capacity_forecast as any)?.six_month_capacity || {}).map((month) => (
                                             <th key={month} className="px-2 py-1 text-xs font-medium text-gray-500">
                                               {month}
                                             </th>
                                           ))}
                                         </tr>
                                       </thead>
                                       <tbody>
                                         <tr>
                                           {Object.entries((forecast.forecast_data.capacity_forecast as any)?.six_month_capacity || {}).map(([month, capacity]) => (
                                             <td key={month} className="px-2 py-1 text-center">
                                               <span className="text-sm font-semibold text-blue-600">
                                                 {(capacity as number).toLocaleString()}
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
                                   <span className="text-sm font-medium">涉及测试站:</span>
                                   <div className="flex gap-1">
                                     {((forecast.forecast_data.capacity_forecast as any)?.usage_stations || []).map((station: string, idx: number) => (
                                       <Chip key={idx} size="sm" color="warning" variant="flat">{station}</Chip>
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
      <Modal isOpen={calculationModalVisible} onOpenChange={setCalculationModalVisible} size="2xl" scrollBehavior="inside" placement="center" className="mx-4">
        <ModalContent className="max-h-[90vh]">
          <ModalHeader>
            {currentCalculationItem ? '编辑计算项目' : '新增计算项目'}
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="No."
                  placeholder="请输入编号"
                  value={calculationFormData.no?.toString() || ''}
                  onChange={(e) => setCalculationFormData({...calculationFormData, no: parseInt(e.target.value)})}
                  isRequired
                />

                <Input
                  label="使用站别"
                  placeholder="请输入使用站别"
                  value={calculationFormData.usage_station || ''}
                  onChange={(e) => setCalculationFormData({...calculationFormData, usage_station: e.target.value})}
                  isRequired
                />
              </div>

              <SupplyAutoComplete
                label="料材名称"
                placeholder="请输入料材名称进行搜索..."
                value={calculationFormData.material_name || ''}
                onChange={(value) => setCalculationFormData({...calculationFormData, material_name: value})}
                onSupplySelect={(supply) => handleSupplySelect(supply)}
                isRequired
                description="输入关键词搜索数据库中的耗材，选择后自动填充库存信息"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="采购员"
                  placeholder="请输入采购员"
                  value={calculationFormData.purchaser || ''}
                  onChange={(e) => setCalculationFormData({...calculationFormData, purchaser: e.target.value})}
                  description="例如：高姐姐、李采购、王采购等"
                />

                <Input
                  type="number"
                  label="单价 (RMB)"
                  placeholder="请输入单价"
                  value={calculationFormData.unit_price?.toString() || ''}
                  onChange={(e) => setCalculationFormData({...calculationFormData, unit_price: parseFloat(e.target.value) || 0})}
                  startContent={<span className="text-default-400">¥</span>}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  type="number"
                  label="每套使用量"
                  placeholder="请输入使用量"
                  value={calculationFormData.usage_per_set?.toString() || ''}
                  onChange={(e) => setCalculationFormData({...calculationFormData, usage_per_set: parseInt(e.target.value) || 0})}
                />

                <Input
                  type="number"
                  label="使用次数"
                  placeholder="请输入使用次数"
                  value={calculationFormData.usage_count?.toString() || ''}
                  onChange={(e) => setCalculationFormData({...calculationFormData, usage_count: parseInt(e.target.value) || 0})}
                />

                <Input
                  type="number"
                  label="当月产能"
                  placeholder="请输入当月产能"
                  value={calculationFormData.monthly_capacity?.toString() || ''}
                  onChange={(e) => setCalculationFormData({...calculationFormData, monthly_capacity: parseInt(e.target.value) || 0})}
                />
              </div>

              {/* 月度库存和需求数据 */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">月度库存和需求数据</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="2025/4库存"
                    placeholder="4月库存"
                    value={calculationFormData.apr_2025_stock?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, apr_2025_stock: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    type="number"
                    label="2025/2库存"
                    placeholder="2月库存"
                    value={calculationFormData.may_2025_stock?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, may_2025_stock: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="5月需求"
                    placeholder="5月需求"
                    value={calculationFormData.may_2025_demand?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, may_2025_demand: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    type="number"
                    label="6月需求"
                    placeholder="6月需求"
                    value={calculationFormData.jun_2025_demand?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, jun_2025_demand: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="2025/6/19库存数量"
                    placeholder="6/19库存"
                    value={calculationFormData.current_stock_0619?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, current_stock_0619: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    type="number"
                    label="2024/6/25库存数量"
                    placeholder="6/25库存"
                    value={calculationFormData.current_stock_0625?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, current_stock_0625: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input
                    type="number"
                    label={`${monthInfo.targetMonth}月M01需求`}
                    placeholder="M01"
                    value={calculationFormData.jul_m01_demand?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, jul_m01_demand: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    type="number"
                    label={`${monthInfo.targetMonth}月M02需求`}
                    placeholder="M02"
                    value={calculationFormData.jul_m02_demand?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, jul_m02_demand: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    type="number"
                    label={`${monthInfo.targetMonth}月M03需求`}
                    placeholder="M03"
                    value={calculationFormData.jul_m03_demand?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, jul_m03_demand: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    type="number"
                    label={`${monthInfo.targetMonth}月M04需求`}
                    placeholder="M04"
                    value={calculationFormData.jul_m04_demand?.toString() || ''}
                    onChange={(e) => setCalculationFormData({...calculationFormData, jul_m04_demand: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => setCalculationModalVisible(false)}>
              取消
            </Button>
            <Button color="primary" onPress={handleCalculationSubmit}>
              {currentCalculationItem ? '更新' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 批量设置采购员模态框 */}
      <Modal isOpen={batchPurchaserModalVisible} onOpenChange={setBatchPurchaserModalVisible} size="md" placement="center">
        <ModalContent>
          <ModalHeader>
            批量设置采购员
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600">
                将为当前申请表下的所有 <span className="font-semibold text-blue-600">{calculationItems.length}</span> 个计算项目统一设置采购员。
              </p>
              <Input
                label="采购员"
                placeholder="请输入采购员名称"
                value={batchPurchaserName}
                onChange={(e) => setBatchPurchaserName(e.target.value)}
                description="例如：高姐姐、李采购、王采购等"
                autoFocus
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => setBatchPurchaserModalVisible(false)}>
              取消
            </Button>
            <Button color="primary" onPress={handleBatchSetPurchaser}>
              批量设置
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DynamicApplicationDetail; 