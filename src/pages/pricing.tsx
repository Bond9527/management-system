import React, { useState } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Badge,
  Tabs,
  Tab,
  CardHeader,
} from "@heroui/react";
import * as XLSX from 'xlsx-js-style';
import { addToast } from "@heroui/toast";

import { getCurrentYearMonth } from "../utils/dateUtils";

// 临时函数定义
const setSmartAlignment = (ws: any, options?: any) => {
  if (!options) return ws;

  // 遍历所有单元格，根据关键词设置对齐方式
  Object.keys(ws).forEach((cellRef) => {
    if (cellRef === '!ref' || cellRef === '!merges' || cellRef === '!cols') return;
    
    const cell = ws[cellRef];
    if (!cell || !cell.v) return;

    const cellValue = String(cell.v);
    const { r: rowIndex, c: colIndex } = XLSX.utils.decode_cell(cellRef);
    
    // 初始化样式对象
    if (!cell.s) cell.s = {};
    if (!cell.s.alignment) cell.s.alignment = {};

    // 检查是否在底部对齐行中
    if (options.bottomAlignRows) {
      const colKey = String.fromCharCode(65 + colIndex); // 转换为列字母 (A, B, C...)
      if (options.bottomAlignRows[colKey] && options.bottomAlignRows[colKey].includes(rowIndex)) {
        cell.s.alignment.horizontal = 'left';
        cell.s.alignment.vertical = 'bottom';
        return;
      }
    }

    // 检查是否在左对齐列中
    if (options.leftAlignColumns) {
      if (options.leftAlignColumns.includes(colIndex)) {
        cell.s.alignment.horizontal = 'left';
        cell.s.alignment.vertical = 'center';
        return;
      }
    }

    // 检查是否包含左对齐关键词
    if (options.leftAlignKeywords) {
      const shouldLeftAlign = options.leftAlignKeywords.some((keyword: string) =>
        cellValue.includes(keyword)
      );
      if (shouldLeftAlign) {
        // 特殊处理合计行：如果包含"合計"关键词，则居中显示
        if (cellValue.includes('合計')) {
          cell.s.alignment.horizontal = 'center';
          cell.s.alignment.vertical = 'center';
          
          // 同时处理同一行中合计数值单元格的居中显示
          // 查找同一行中其他包含数字的单元格并设置为居中
          Object.keys(ws).forEach((otherCellRef) => {
            if (otherCellRef === '!ref' || otherCellRef === '!merges' || otherCellRef === '!cols') return;
            
            const otherCell = ws[otherCellRef];
            if (!otherCell || !otherCell.v) return;
            
            const otherCellValue = String(otherCell.v);
            const { r: otherRowIndex, c: otherColIndex } = XLSX.utils.decode_cell(otherCellRef);
            
            // 如果是同一行且包含数字（可能是合计数值）
            if (otherRowIndex === rowIndex && /\d/.test(otherCellValue) && !otherCellValue.includes('合計')) {
              if (!otherCell.s) otherCell.s = {};
              if (!otherCell.s.alignment) otherCell.s.alignment = {};
              otherCell.s.alignment.horizontal = 'center';
              otherCell.s.alignment.vertical = 'center';
            }
          });
        } else {
          cell.s.alignment.horizontal = 'left';
          cell.s.alignment.vertical = 'center';
          cell.s.alignment.wrapText = false; // 禁用自动换行
          
          // 如果是备注相关的内容，确保合并单元格的其他部分也是左对齐
          if (cellValue.includes('備註') || cellValue.includes('安全庫存') || cellValue.includes('歷史資料') || 
              cellValue.includes('採購員') || cellValue.includes('單價') || cellValue.includes('市場行情') || 
              cellValue.includes('採購成本') || /^\d+\./.test(cellValue)) {
            
            // 查找同一行中其他单元格并设置为左对齐
            Object.keys(ws).forEach((otherCellRef) => {
              if (otherCellRef === '!ref' || otherCellRef === '!merges' || otherCellRef === '!cols') return;
              
              const otherCell = ws[otherCellRef];
              if (!otherCell) return;
              
              const { r: otherRowIndex, c: otherColIndex } = XLSX.utils.decode_cell(otherCellRef);
              
              // 如果是同一行且在合并范围内（A-C列）
              if (otherRowIndex === rowIndex && otherColIndex <= 2) {
                if (!otherCell.s) otherCell.s = {};
                if (!otherCell.s.alignment) otherCell.s.alignment = {};
                otherCell.s.alignment.horizontal = 'left';
                otherCell.s.alignment.vertical = 'center';
                otherCell.s.alignment.wrapText = false; // 禁用自动换行
              }
            });
          }
        }
        return;
      }
    }

    // 默认居中对齐（包括水平和垂直）
    cell.s.alignment.horizontal = 'center';
    cell.s.alignment.vertical = 'center';
  });

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
    // 不要重新初始化alignment，避免覆盖已设置的对齐方式
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
      
      // 为耗材描述列（B列，索引为1）设置自动换行，但排除备注行
      if (colIndex === 1 && signatureRow) {
        // 检查是否为备注行（备注行在签名行之前）
        const isRemarkRow = rowIndex >= signatureRow - 5; // 备注行在签名行前5行
        
        if (!isRemarkRow) {
          cell.s.alignment.wrapText = true; // 启用自动换行
          cell.s.alignment.vertical = 'top'; // 顶部对齐
        }
      }
    }
  });

  return ws;
};

import { title } from "@/components/primitives";
import { PlusIcon, DownloadIcon } from "@/components/icons";
import { materialManagementApi } from "@/services/materialManagement";

// B482耗材管控申請表数据结构 - 根据正确的表格格式
interface B482SupplyItem {
  id: number;
  serialNumber: number; // 序號
  materialDescription: string; // 物料描述
  unit: string; // 單位
  purchaser: string; // 採購員
  unitPrice: number; // 單價(RMB)
  maxSafetyStock: number; // 最高安全庫存
  minSafetyStock: number; // 最低安全庫存
  moq: number; // 最小採購量(MOQ)
  unpurchasedAmount: number; // 未採購量(RMB)
  leadTime: number; // L/T(Day)
  june2025: number; // 2025年6月份
  july2025: number; // 2025年7月份
  julyM1: number; // 7月M1
  julyM2: number; // 7月M2
  julyM3: number; // 7月M3
  julyM4: number; // 7月M4
  remark: string; // 備註
  // 🆕 新增计算参数 (可选)
  usagePerSet?: number; // 每臺機用量
  usageCount?: number; // 使用次數
  monthlyCapacity?: number; // 當月產能
  enableAutoCalculation?: boolean; // 是否启用自动计算
  // 🆕 新增隐藏状态字段
  isHidden?: boolean; // 是否隐藏
}

// Andor耗材需求计算数据结构
interface AndorSupplyItem {
  id: number;
  month: string; // 月份 (如 2025.7)
  no: number; // No.
  materialName: string; // 耗材名稱
  usageStation: string; // 使用站別
  usagePerSet: number; // 每臺機用量
  usageCount: number; // 使用次數
  monthlyCapacity: number; // 當月產能
  minInventory: number; // 最低庫存
  maxInventory: number; // 最高庫存
  monthlyDemand: number; // 當月需求/站 (計算得出)
  remark: string; // 備註 (實際訂購數量)
  maxTotalInventory?: number; // 最高庫存总數 (該耗材所有站別的庫存數總和)
  // 🆕 新增隐藏状态字段
  isHidden?: boolean; // 是否隐藏
}

// 产能预测数据结构
interface CapacityForecast {
  maxCapacity: number; // 最高产能
  minCapacity: number; // 最低产能
  apr24: number; // 4月-24
  may25: number; // 5月-25
  jun25: number; // 6月-25
  jul25: number; // 7月-25
}

// B453 SMT ATE耗材管控表数据结构
interface B453SupplyItem {
  id: number;
  serialNumber: number; // 序號
  materialDescription: string; // 物料描述
  unit: string; // 單位
  purchaser: string; // 採購員
  unitPrice: number; // 單價(RMB)
  minSafetyStock: number; // 安全庫存-最低
  maxSafetyStock: number; // 安全庫存-最高
  moq: number; // 最小采购量(MOQ)
  leadTimeWeeks: number; // L/T(Wks)
  // 月度明细数据 (库存+需求)
  apr2025Stock: number; // 2025/4/1庫存
  may2025Demand: number; // 2025年5月份需求
  may2025Stock: number; // 2025/5/22庫存
  jun2025Demand: number; // 2025年6月份需求
  jun2025Stock: number; // 2025/6/23庫存
  jul2025Demand: number; // 2025年7月份需求
  jul2025Stock: number; // 2025/7/20庫存
  aug2025Demand: number; // 2025年8月份需求
  remark: string; // 備註
  // 🆕 新增计算关联字段
  calculationId?: number; // 关联的计算表ID
  hasCalculation?: boolean; // 是否有关联的计算表
  // 🆕 新增隐藏状态字段
  isHidden?: boolean; // 是否隐藏
}

// B453耗材需求计算表数据结构
interface B453CalculationItem {
  id: number;
  no: number; // No.
  materialName: string; // 料件名稱
  usageStation: string; // 使用站別
  usagePerMachine: number; // 每台机用量
  usageCount: number; // 使用次數
  monthlyCapacity: number; // 當月產能
  minStock: number; // 最低庫存數
  minTotalStock: number; // 最低庫存總數
  maxStock: number; // 最高庫存數
  maxTotalStock: number; // 最高庫存總數
  actualStock: number; // 實際庫存數量
  monthlyDemandPerStation: number; // 当月需求/站
  monthlyTotalDemand: number; // 当月總需求
  moqRemark: string; // 備註(MOQ)
  // 🆕 新增管控表关联字段
  managementId?: number; // 关联的管控表ID
  linkedMaterial?: string; // 关联的物料描述
  unitPrice?: number; // 单价 (从管控表同步)
  moq?: number; // MOQ (从管控表同步)
  purchaser?: string; // 采购员
  leadTimeWeeks?: number; // 交期(周)
  // 🆕 新增隐藏状态字段
  isHidden?: boolean; // 是否隐藏
}

// B453产能预测数据结构
interface B453ForecastData {
  mar24: number; // Mar-24
  oct24: number; // Oct-24
  dec24: number; // Dec-24
  jan25: number; // Jan-25
  feb25: number; // Feb-25
  mar25: number; // Mar-25
  apr25: number; // Apr-25
  may25: number; // May-25
  jun25: number; // Jun-25
  jul25: number; // Jul-25
}

// 初始化B482数据 - 根据实际表格修正
const initialB482Data: B482SupplyItem[] = [
  {
    id: 1,
    serialNumber: 1,
    materialDescription: "故障排除線(SUB Batt SA測試夾具偵1.PRO.000556測試針)", // 修正：更准确的物料描述
    unit: "pcs",
    purchaser: "陳雲",
    unitPrice: 9.23,
    maxSafetyStock: 416,
    minSafetyStock: 118,
    moq: 200,
    unpurchasedAmount: 2760,
    leadTime: 15,
    june2025: 41,
    july2025: 299,
    julyM1: 300,
    julyM2: 0,
    julyM3: 200,
    julyM4: 0,
    remark: "MOQ:200PCS 訂貨用",
    // 🆕 计算参数
    usagePerSet: 18,
    usageCount: 30000,
    monthlyCapacity: 497700,
    enableAutoCalculation: true,
  },
  {
    id: 2,
    serialNumber: 2,
    materialDescription: "故障排除線(A/P 測試夾具.塔/JI8-6000-B-60-BB-i/線材)", // 修正：更准确的物料描述
    unit: "pcs",
    purchaser: "陳雲",
    unitPrice: 62.16,
    maxSafetyStock: 28,
    minSafetyStock: 8,
    moq: 32,
    unpurchasedAmount: 1989.12,
    leadTime: 21,
    june2025: 10,
    july2025: 40,
    julyM1: 32,
    julyM2: 0,
    julyM3: 0,
    julyM4: 40,
    remark: "MOQ:32PCS FLK訂貨",
    // 🆕 计算参数
    usagePerSet: 4,
    usageCount: 100000,
    monthlyCapacity: 497700,
    enableAutoCalculation: true,
  },
];

// 初始化Andor耗材计算数据 - 根据实际表格修正
const initialAndorData: AndorSupplyItem[] = [
  {
    id: 1,
    month: "2025.7",
    no: 1,
    materialName: "3.PRO.000556/測試針", // ✓ 与实际表格一致
    usageStation: "Batt SA",
    usagePerSet: 18,
    usageCount: 30000,
    monthlyCapacity: 497700,
    minInventory: 267,
    maxInventory: 416,
    monthlyDemand: 299,
    remark: "300 (MOQ:200)",
  },
  {
    id: 2,
    month: "2025.7",
    no: 2,
    materialName: "JI8-6000-B-60-BB-i/線材(HWTE線)", // ✓ 与实际表格一致
    usageStation: "403-QT3",
    usagePerSet: 4,
    usageCount: 100000,
    monthlyCapacity: 497700,
    minInventory: 18,
    maxInventory: 28,
    monthlyDemand: 20,
    remark: "32 (MOQ:32)",
  },
  {
    id: 3,
    month: "2025.7",
    no: 2,
    materialName: "JI8-6000-B-60-BB-i/線材(HWTE線)", // ✓ 与实际表格一致
    usageStation: "507-Gatekeeper",
    usagePerSet: 4,
    usageCount: 100000,
    monthlyCapacity: 497700,
    minInventory: 18,
    maxInventory: 28,
    monthlyDemand: 20,
    remark: "",
  },
];

// 产能预测数据 - 根据实际表格验证
const initialForecastData: CapacityForecast = {
  maxCapacity: 694000, // ✓ 与实际表格一致
  minCapacity: 445000, // ✓ 与实际表格一致
  apr24: 694000, // ✓ 与实际表格一致
  may25: 445000, // ✓ 与实际表格一致
  jun25: 509000, // ✓ 与实际表格一致
  jul25: 497700, // ✓ 与实际表格一致
};

// 初始化B453数据 - 根据实际表格修正
const initialB453Data: B453SupplyItem[] = [
  {
    id: 1,
    serialNumber: 1,
    materialDescription: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    unit: "pcs",
    purchaser: "湯麗瑩",
    unitPrice: 9.82,
    minSafetyStock: 228,
    maxSafetyStock: 512,
    moq: 100,
    leadTimeWeeks: 15,
    apr2025Stock: 240, // 修正：2025/4/2庫存
    may2025Demand: 500, // 修正：2025年5月份需求
    may2025Stock: 200, // 修正：2025/5/2庫存
    jun2025Demand: 500, // 修正：2025年6月份需求
    jun2025Stock: 200, // 修正：2025/6/3庫存
    jul2025Demand: 500, // 修正：2025年7月份需求
    jul2025Stock: 500, // 修正：2025/7/20庫存 (以物料立库存数量)
    aug2025Demand: 0, // 修正：8月份需求
    remark: "4910", // 修正：總金額
    // 🆕 新增计算关联字段
    calculationId: 1,
    hasCalculation: true,
  },
  {
    id: 2,
    serialNumber: 2,
    materialDescription:
      "設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)",
    unit: "pcs",
    purchaser: "湯麗瑩",
    unitPrice: 9.05, // 修正：单价
    minSafetyStock: 61, // 修正：最低安全库存
    maxSafetyStock: 138, // 修正：最高安全库存
    moq: 100,
    leadTimeWeeks: 15,
    apr2025Stock: 0, // 修正：2025/4/2庫存
    may2025Demand: 200, // 修正：2025年5月份需求
    may2025Stock: 80, // 修正：2025/5/2庫存
    jun2025Demand: 200, // 修正：2025年6月份需求
    jun2025Stock: 75, // 修正：2025/6/3庫存
    jul2025Demand: 100, // 修正：2025年7月份需求
    jul2025Stock: 100, // 修正：2025/7/20庫存
    aug2025Demand: 0, // 修正：8月份需求
    remark: "805", // 修正：總金額
    // 🆕 新增计算关联字段
    calculationId: 2,
    hasCalculation: true,
  },
  {
    id: 3,
    serialNumber: 3,
    materialDescription:
      "設備耗材類-(B453/AJ FCT設備/探針/GKS-075 291 064 V.2000)",
    unit: "pcs",
    purchaser: "湯麗瑩",
    unitPrice: 1.27, // 修正：单价
    minSafetyStock: 58, // 修正：最低安全库存
    maxSafetyStock: 129, // 修正：最高安全库存
    moq: 100,
    leadTimeWeeks: 15,
    apr2025Stock: 50, // 修正：2025/4/2庫存
    may2025Demand: 100, // 修正：2025年5月份需求
    may2025Stock: 60, // 修正：2025/5/2庫存
    jun2025Demand: 100, // 修正：2025年6月份需求
    jun2025Stock: 65, // 修正：2025/6/3庫存
    jul2025Demand: 100, // 修正：2025年7月份需求
    jul2025Stock: 100, // 修正：2025/7/20庫存
    aug2025Demand: 0, // 修正：8月份需求
    remark: "197", // 修正：總金額
    // 🆕 新增计算关联字段
    calculationId: 3,
    hasCalculation: true,
  },
  {
    id: 4,
    serialNumber: 4,
    materialDescription: "生產耗材類-(B453/膠材清潔劑/RK-58D 450ML(金千)",
    unit: "pcs",
    purchaser: "湯麗瑩",
    unitPrice: 159.8, // 新增：单价
    minSafetyStock: 3, // 新增：最低安全库存
    maxSafetyStock: 6, // 新增：最高安全库存
    moq: 1,
    leadTimeWeeks: 15,
    apr2025Stock: 3, // 新增：2025/4/2庫存
    may2025Demand: 1, // 新增：2025年5月份需求
    may2025Stock: 3, // 新增：2025/5/2庫存
    jun2025Demand: 6, // 新增：2025年6月份需求
    jun2025Stock: 2, // 新增：2025/6/3庫存
    jul2025Demand: 5, // 新增：2025年7月份需求
    jul2025Stock: 5, // 新增：2025/7/20庫存
    aug2025Demand: 0, // 新增：8月份需求
    remark: "799", // 新增：總金額
    // 🆕 新增计算关联字段
    calculationId: 4,
    hasCalculation: true,
  },
];

// 初始化B453耗材需求计算数据 - 根据实际表格修正
const initialB453CalculationData: B453CalculationItem[] = [
  // 第一个物料的多个使用站别
  {
    id: 1,
    no: 1,
    materialName: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    usageStation: "MLR Left DFU",
    usagePerMachine: 21,
    usageCount: 50000,
    monthlyCapacity: 363000,
    minStock: 228,
    minTotalStock: 228,
    maxStock: 512,
    maxTotalStock: 512,
    actualStock: 240,
    monthlyDemandPerStation: 181,
    monthlyTotalDemand: 432,
    moqRemark: "MOQ: 100",
    managementId: 1,
    linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    unitPrice: 9.82,
    moq: 100,
    purchaser: "湯麗瑩",
    leadTimeWeeks: 15,
  },
  {
    id: 2,
    no: 1,
    materialName: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    usageStation: "MLR Right FCT",
    usagePerMachine: 8,
    usageCount: 50000,
    monthlyCapacity: 363000,
    minStock: 228,
    minTotalStock: 228,
    maxStock: 512,
    maxTotalStock: 512,
    actualStock: 200,
    monthlyDemandPerStation: 65,
    monthlyTotalDemand: 432,
    moqRemark: "MOQ: 100",
    managementId: 1,
    linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    unitPrice: 9.82,
    moq: 100,
    purchaser: "湯麗瑩",
    leadTimeWeeks: 15,
  },
  {
    id: 3,
    no: 1,
    materialName: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    usageStation: "MLR Right R2 FCT",
    usagePerMachine: 8,
    usageCount: 50000,
    monthlyCapacity: 363000,
    minStock: 228,
    minTotalStock: 228,
    maxStock: 512,
    maxTotalStock: 512,
    actualStock: 200,
    monthlyDemandPerStation: 65,
    monthlyTotalDemand: 432,
    moqRemark: "MOQ: 100",
    managementId: 1,
    linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    unitPrice: 9.82,
    moq: 100,
    purchaser: "湯麗瑩",
    leadTimeWeeks: 15,
  },
  {
    id: 4,
    no: 1,
    materialName: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    usageStation: "MLR Left FCT",
    usagePerMachine: 24,
    usageCount: 50000,
    monthlyCapacity: 363000,
    minStock: 228,
    minTotalStock: 228,
    maxStock: 512,
    maxTotalStock: 512,
    actualStock: 200,
    monthlyDemandPerStation: 202,
    monthlyTotalDemand: 432,
    moqRemark: "MOQ: 100",
    managementId: 1,
    linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    unitPrice: 9.82,
    moq: 100,
    purchaser: "湯麗瑩",
    leadTimeWeeks: 15,
  },
  // 第二个物料的多个使用站别
  {
    id: 5,
    no: 2,
    materialName: "設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)",
    usageStation: "MLR Left FCT",
    usagePerMachine: 8,
    usageCount: 50000,
    monthlyCapacity: 363000,
    minStock: 61,
    minTotalStock: 61,
    maxStock: 138,
    maxTotalStock: 138,
    actualStock: 0,
    monthlyDemandPerStation: 69,
    monthlyTotalDemand: 116,
    moqRemark: "MOQ: 100",
    managementId: 2,
    linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)",
    unitPrice: 9.05,
    moq: 100,
    purchaser: "湯麗瑩",
    leadTimeWeeks: 15,
  },
  {
    id: 6,
    no: 2,
    materialName: "設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)",
    usageStation: "MLR Right FCT",
    usagePerMachine: 8,
    usageCount: 50000,
    monthlyCapacity: 363000,
    minStock: 61,
    minTotalStock: 61,
    maxStock: 138,
    maxTotalStock: 138,
    actualStock: 80,
    monthlyDemandPerStation: 69,
    monthlyTotalDemand: 116,
    moqRemark: "MOQ: 100",
    managementId: 2,
    linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)",
    unitPrice: 9.05,
    moq: 100,
    purchaser: "湯麗瑩",
    leadTimeWeeks: 15,
  },
  // 第三个物料
  {
    id: 7,
    no: 3,
    materialName: "設備耗材類-(B453/AJ FCT設備/探針/GKS-075 291 064 A 2000)",
    usageStation: "AJ FCT",
    usagePerMachine: 18,
    usageCount: 60000,
    monthlyCapacity: 363000,
    minStock: 58,
    minTotalStock: 58,
    maxStock: 129,
    maxTotalStock: 129,
    actualStock: 50,
    monthlyDemandPerStation: 109,
    monthlyTotalDemand: 109,
    moqRemark: "MOQ: 100",
    managementId: 3,
    linkedMaterial: "設備耗材類-(B453/AJ FCT設備/探針/GKS-075 291 064 A 2000)",
    unitPrice: 1.27,
    moq: 100,
    purchaser: "湯麗瑩",
    leadTimeWeeks: 15,
  },
  // 第四个物料
  {
    id: 8,
    no: 4,
    materialName: "生產耗材類-(B453/探針清潔劑 / RK-58D 450ML(金千))",
    usageStation: "所有測試站",
    usagePerMachine: 1.5,
    usageCount: 100000,
    monthlyCapacity: 363000,
    minStock: 3,
    minTotalStock: 3,
    maxStock: 6,
    maxTotalStock: 6,
    actualStock: 3,
    monthlyDemandPerStation: 5,
    monthlyTotalDemand: 5,
    moqRemark: "MOQ: 1",
    managementId: 4,
    linkedMaterial: "生產耗材類-(B453/探針清潔劑 / RK-58D 450ML(金千))",
    unitPrice: 159.8,
    moq: 1,
    purchaser: "湯麗瑩",
    leadTimeWeeks: 15,
  },
];

// 初始化B453产能预测数据
const initialB453ForecastData: B453ForecastData = {
  mar24: 191800,
  oct24: 340100,
  dec24: 340100,
  jan25: 140000,
  feb25: 270000,
  mar25: 312000,
  apr25: 317400,
  may25: 375000,
  jun25: 400000,
  jul25: 363000,
};

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState("b482-andor");

  // 获取当前年月作为默认值
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  // 状态：选择的年份和月份
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // B482相关状态
  const [b482Data, setB482Data] = useState<B482SupplyItem[]>(initialB482Data);
  const [showB482AddModal, setShowB482AddModal] = useState(false);
  const [showB482EditModal, setShowB482EditModal] = useState(false);
  const [editingB482Item, setEditingB482Item] = useState<B482SupplyItem | null>(
    null,
  );
  // 🆕 隐藏状态管理
  const [showHiddenB482Items, setShowHiddenB482Items] = useState(false);
  const [newB482Item, setNewB482Item] = useState<Partial<B482SupplyItem>>({
    serialNumber: 0,
    materialDescription: "",
    unit: "pcs",
    purchaser: "",
    unitPrice: 0,
    maxSafetyStock: 0,
    minSafetyStock: 0,
    moq: 0,
    unpurchasedAmount: 0,
    leadTime: 0,
    june2025: 0,
    july2025: 0,
    julyM1: 0,
    julyM2: 0,
    julyM3: 0,
    julyM4: 0,
    remark: "",
    // 🆕 计算参数
    usagePerSet: 1,
    usageCount: 1000,
    monthlyCapacity: 497700,
    enableAutoCalculation: false,
  });

  // Andor相关状态
  const [andorData, setAndorData] =
    useState<AndorSupplyItem[]>(initialAndorData);
  const [forecastData, setForecastData] =
    useState<CapacityForecast>(initialForecastData);
  const [showAndorAddModal, setShowAndorAddModal] = useState(false);
  const [showAndorEditModal, setShowAndorEditModal] = useState(false);
  const [editingAndorItem, setEditingAndorItem] =
    useState<AndorSupplyItem | null>(null);
  // 🆕 隐藏状态管理
  const [showHiddenAndorItems, setShowHiddenAndorItems] = useState(false);
  const [newAndorItem, setNewAndorItem] = useState<Partial<AndorSupplyItem>>({
    month: "2025.7",
    no: 1,
    materialName: "",
    usageStation: "",
    usagePerSet: 0,
    usageCount: 0,
    monthlyCapacity: 0,
    minInventory: 0,
    maxInventory: 0,
    monthlyDemand: 0,
    remark: "",
  });

  // B453相关状态
  const [b453Data, setB453Data] = useState<B453SupplyItem[]>(initialB453Data);
  const [showB453AddModal, setShowB453AddModal] = useState(false);
  const [showB453EditModal, setShowB453EditModal] = useState(false);
  const [editingB453Item, setEditingB453Item] = useState<B453SupplyItem | null>(
    null,
  );
  // 🆕 隐藏状态管理
  const [showHiddenB453Items, setShowHiddenB453Items] = useState(false);
  const [newB453Item, setNewB453Item] = useState<Partial<B453SupplyItem>>({
    serialNumber: 0,
    materialDescription: "",
    unit: "pcs",
    purchaser: "",
    unitPrice: 0,
    minSafetyStock: 0,
    maxSafetyStock: 0,
    moq: 0,
    leadTimeWeeks: 0,
    apr2025Stock: 0,
    may2025Demand: 0,
    may2025Stock: 0,
    jun2025Demand: 0,
    jun2025Stock: 0,
    jul2025Demand: 0,
    jul2025Stock: 0,
    aug2025Demand: 0,
    remark: "",
  });

  // B453计算表相关状态
  const [b453CalculationData, setB453CalculationData] = useState<
    B453CalculationItem[]
  >(initialB453CalculationData);
  const [b453ForecastData, setB453ForecastData] = useState<B453ForecastData>(
    initialB453ForecastData,
  );
  const [showB453CalcAddModal, setShowB453CalcAddModal] = useState(false);
  const [showB453CalcEditModal, setShowB453CalcEditModal] = useState(false);
  const [editingB453CalcItem, setEditingB453CalcItem] =
    useState<B453CalculationItem | null>(null);
  // 🆕 隐藏状态管理
  const [showHiddenB453CalcItems, setShowHiddenB453CalcItems] = useState(false);
  const [newB453CalcItem, setNewB453CalcItem] = useState<
    Partial<B453CalculationItem>
  >({
    no: 1,
    materialName: "",
    usageStation: "",
    usagePerMachine: 0,
    usageCount: 0,
    monthlyCapacity: 363000,
    minStock: 0,
    minTotalStock: 0,
    maxStock: 0,
    maxTotalStock: 0,
    actualStock: 0,
    monthlyDemandPerStation: 0,
    monthlyTotalDemand: 0,
    moqRemark: "",
  });

  // ================================
  // 🔧 统一计算引擎 - Unified Calculation Engine
  // ================================

  // 通用计算参数接口
  interface CalculationParams {
    monthlyCapacity: number; // 当月产能
    usagePerMachine: number; // 每台机用量
    usageCount: number; // 使用次数
    maxCapacity?: number; // 最高产能 (可选)
    minCapacity?: number; // 最低产能 (可选)
    currentStock?: number; // 当前库存 (可选)
    unitPrice?: number; // 单价 (可选)
  }

  // 计算结果接口
  interface CalculationResult {
    monthlyDemand: number; // 当月需求/站
    maxInventory?: number; // 最高库存
    minInventory?: number; // 最低库存
    netDemand?: number; // 总需求
    demandValue?: number; // 需求金额
  }

  // 🧮 核心统一计算函数
  const unifiedCalculateMonthlyDemand = (params: CalculationParams): number => {
    if (params.usageCount === 0) return 0;

    return Math.round(
      (params.monthlyCapacity * params.usagePerMachine) / params.usageCount,
    );
  };

  const unifiedCalculateMaxInventory = (params: CalculationParams): number => {
    if (!params.maxCapacity || params.usageCount === 0) return 0;

    return Math.round(
      (params.maxCapacity * params.usagePerMachine) / params.usageCount,
    );
  };

  const unifiedCalculateMinInventory = (params: CalculationParams): number => {
    if (!params.minCapacity || params.usageCount === 0) return 0;

    return Math.round(
      (params.minCapacity * params.usagePerMachine) / params.usageCount,
    );
  };

  const unifiedCalculateNetDemand = (
    monthlyDemand: number,
    currentStock: number,
  ): number => {
    return Math.max(0, monthlyDemand - currentStock);
  };

  const unifiedCalculateDemandValue = (
    monthlyDemand: number,
    unitPrice: number,
  ): number => {
    return monthlyDemand * unitPrice;
  };

  // 🎯 统一计算引擎主函数
  const unifiedCalculationEngine = (
    params: CalculationParams,
  ): CalculationResult => {
    const monthlyDemand = unifiedCalculateMonthlyDemand(params);

    const result: CalculationResult = {
      monthlyDemand,
    };

    // 可选计算项
    if (params.maxCapacity) {
      result.maxInventory = unifiedCalculateMaxInventory(params);
    }

    if (params.minCapacity) {
      result.minInventory = unifiedCalculateMinInventory(params);
    }

    if (params.currentStock !== undefined) {
      result.netDemand = unifiedCalculateNetDemand(
        monthlyDemand,
        params.currentStock,
      );
    }

    if (params.unitPrice) {
      result.demandValue = unifiedCalculateDemandValue(
        monthlyDemand,
        params.unitPrice,
      );
    }

    return result;
  };

  // ================================
  // 📊 系统特定计算函数 - 基于统一引擎
  // ================================

  // 格式化价格显示
  const formatPrice = (price: number): string => {
    return `¥${price.toFixed(2)}`;
  };

  // B482计算总价值
  const calculateTotalValue = (): number => {
    return b482Data.reduce((total, item) => total + item.unpurchasedAmount, 0);
  };

  // B482计算总MOQ
  const calculateTotalMOQ = (): number => {
    return b482Data.reduce((total, item) => total + item.moq, 0);
  };

  // 🔄 Andor系统计算 - 使用统一引擎
  const updateAndorCalculations = (item: AndorSupplyItem): AndorSupplyItem => {
    const result = unifiedCalculationEngine({
      monthlyCapacity: item.monthlyCapacity,
      usagePerMachine: item.usagePerSet,
      usageCount: item.usageCount,
      maxCapacity: forecastData.maxCapacity,
      minCapacity: forecastData.minCapacity,
    });

    return {
      ...item,
      monthlyDemand: result.monthlyDemand,
      maxInventory: result.maxInventory || 0,
      minInventory: result.minInventory || 0,
    };
  };

  // 🔄 B453系统计算 - 使用统一引擎
  const updateB453Calculations = (
    item: B453CalculationItem,
  ): B453CalculationItem => {
    // 计算当前物料所有站别的常月需求之和
    const allStationsOfSameMaterial = b453CalculationData.filter(
      (calcItem) => calcItem.materialName === item.materialName,
    );

    // 计算单站需求
    const result = unifiedCalculationEngine({
      monthlyCapacity: item.monthlyCapacity,
      usagePerMachine: item.usagePerMachine,
      usageCount: item.usageCount,
    });

    // 计算总需求（所有站别的需求之和）
    const totalMonthlyDemand = allStationsOfSameMaterial.reduce(
      (sum, station) => {
        const stationDemand = Math.round(
          (station.monthlyCapacity * station.usagePerMachine) /
            station.usageCount,
        );

        return sum + stationDemand;
      },
      0,
    );

    return {
      ...item,
      monthlyDemandPerStation: result.monthlyDemand,
      monthlyTotalDemand: totalMonthlyDemand,
    };
  };

  // 🆕 B453数据关联和同步功能
  const linkB453Data = (
    managementItem: B453SupplyItem,
    calculationItem: B453CalculationItem,
  ) => {
    // 更新管控表的关联信息
    const updatedManagement = {
      ...managementItem,
      calculationId: calculationItem.id,
      hasCalculation: true,
    };

    // 更新计算表的关联信息和同步数据
    const updatedCalculation = {
      ...calculationItem,
      managementId: managementItem.id,
      linkedMaterial: managementItem.materialDescription,
      unitPrice: managementItem.unitPrice,
      moq: managementItem.moq,
      minStock: managementItem.minSafetyStock,
      maxStock: managementItem.maxSafetyStock,
    };

    return { updatedManagement, updatedCalculation };
  };

  const syncB453CalculationFromManagement = (
    managementItem: B453SupplyItem,
  ): B453CalculationItem | null => {
    // 查找关联的计算表项目
    const calculationItem = b453CalculationData.find(
      (calc) => calc.managementId === managementItem.id,
    );

    if (!calculationItem) return null;

    // 同步管控表数据到计算表
    return {
      ...calculationItem,
      linkedMaterial: managementItem.materialDescription,
      unitPrice: managementItem.unitPrice,
      moq: managementItem.moq,
      minStock: managementItem.minSafetyStock,
      maxStock: managementItem.maxSafetyStock,
    };
  };

  const syncB453ManagementFromCalculation = (
    calculationItem: B453CalculationItem,
  ): B453SupplyItem | null => {
    // 查找关联的管控表项目
    const managementItem = b453Data.find(
      (mgmt) => mgmt.id === calculationItem.managementId,
    );

    if (!managementItem) return null;

    // 同步计算表的需求数据到管控表
    const updatedCalculation = updateB453Calculations(calculationItem);

    return {
      ...managementItem,
      jul2025Demand: updatedCalculation.monthlyDemandPerStation,
      // 可以根据需要同步更多字段
    };
  };

  const createB453CalculationFromManagement = (
    managementItem: B453SupplyItem,
  ): B453CalculationItem => {
    const newId =
      Math.max(...b453CalculationData.map((item) => item.id), 0) + 1;

    return {
      id: newId,
      no: newId,
      materialName: managementItem.materialDescription,
      usageStation: "待設定",
      usagePerMachine: 1,
      usageCount: 10000,
      monthlyCapacity: b453ForecastData.jul25,
      minStock: managementItem.minSafetyStock,
      minTotalStock: managementItem.minSafetyStock,
      maxStock: managementItem.maxSafetyStock,
      maxTotalStock: managementItem.maxSafetyStock,
      actualStock: 0,
      monthlyDemandPerStation: 0,
      monthlyTotalDemand: 0,
      moqRemark: `MOQ: ${managementItem.moq}`,
      managementId: managementItem.id,
      linkedMaterial: managementItem.materialDescription,
      unitPrice: managementItem.unitPrice,
      moq: managementItem.moq,
      purchaser: "待設定",
      leadTimeWeeks: 0,
    };
  };

  // 🆕 B482系统自动计算 - 新增功能
  const updateB482Calculations = (
    item: B482SupplyItem,
    capacityData?: {
      monthlyCapacity: number;
      usagePerMachine?: number;
      usageCount?: number;
    },
  ): B482SupplyItem => {
    if (!capacityData) return item;

    const result = unifiedCalculationEngine({
      monthlyCapacity: capacityData.monthlyCapacity,
      usagePerMachine: capacityData.usagePerMachine || 1,
      usageCount: capacityData.usageCount || 1000,
      unitPrice: item.unitPrice,
      currentStock: item.minSafetyStock,
    });

    return {
      ...item,
      july2025: result.monthlyDemand,
      unpurchasedAmount: result.demandValue || item.unpurchasedAmount,
    };
  };

  // B482添加新项目
  const handleAddB482Item = () => {
    if (!newB482Item.materialDescription || !newB482Item.unitPrice) {
      return;
    }

    const nextId = Math.max(...b482Data.map((item) => item.id)) + 1;
    const nextSerialNumber =
      Math.max(...b482Data.map((item) => item.serialNumber)) + 1;

    let completeItem: B482SupplyItem = {
      id: nextId,
      serialNumber: newB482Item.serialNumber || nextSerialNumber,
      materialDescription: newB482Item.materialDescription!,
      unit: newB482Item.unit || "pcs",
      purchaser: newB482Item.purchaser || "",
      unitPrice: newB482Item.unitPrice!,
      maxSafetyStock: newB482Item.maxSafetyStock || 0,
      minSafetyStock: newB482Item.minSafetyStock || 0,
      moq: newB482Item.moq || 0,
      unpurchasedAmount: newB482Item.unpurchasedAmount || 0,
      leadTime: newB482Item.leadTime || 0,
      june2025: newB482Item.june2025 || 0,
      july2025: newB482Item.july2025 || 0,
      julyM1: newB482Item.julyM1 || 0,
      julyM2: newB482Item.julyM2 || 0,
      julyM3: newB482Item.julyM3 || 0,
      julyM4: newB482Item.julyM4 || 0,
      remark: newB482Item.remark || "",
      // 🆕 计算参数
      usagePerSet: newB482Item.usagePerSet || 1,
      usageCount: newB482Item.usageCount || 1000,
      monthlyCapacity: newB482Item.monthlyCapacity || 497700,
      enableAutoCalculation: newB482Item.enableAutoCalculation || false,
    };

    // 🧮 如果启用自动计算，使用统一计算引擎
    if (
      completeItem.enableAutoCalculation &&
      completeItem.usagePerSet &&
      completeItem.usageCount &&
      completeItem.monthlyCapacity
    ) {
      completeItem = updateB482Calculations(completeItem, {
        monthlyCapacity: completeItem.monthlyCapacity,
        usagePerMachine: completeItem.usagePerSet,
        usageCount: completeItem.usageCount,
      });
    }

    setB482Data([...b482Data, completeItem]);

    // 重置表单
    setNewB482Item({
      serialNumber: 0,
      materialDescription: "",
      unit: "pcs",
      purchaser: "",
      unitPrice: 0,
      maxSafetyStock: 0,
      minSafetyStock: 0,
      moq: 0,
      unpurchasedAmount: 0,
      leadTime: 0,
      june2025: 0,
      july2025: 0,
      julyM1: 0,
      julyM2: 0,
      julyM3: 0,
      julyM4: 0,
      remark: "",
      // 🆕 计算参数
      usagePerSet: 1,
      usageCount: 1000,
      monthlyCapacity: 497700,
      enableAutoCalculation: false,
    });
    setShowB482AddModal(false);
  };

  // Andor添加新项目
  const handleAddAndorItem = () => {
    if (!newAndorItem.materialName || !newAndorItem.usageStation) {
      return;
    }

    const nextId = Math.max(...andorData.map((item) => item.id)) + 1;
    const completeItem: AndorSupplyItem = {
      id: nextId,
      month: newAndorItem.month || "2025.7",
      no: newAndorItem.no || 1,
      materialName: newAndorItem.materialName!,
      usageStation: newAndorItem.usageStation!,
      usagePerSet: newAndorItem.usagePerSet || 0,
      usageCount: newAndorItem.usageCount || 0,
      monthlyCapacity: newAndorItem.monthlyCapacity || 0,
      minInventory: 0,
      maxInventory: 0,
      monthlyDemand: 0,
      remark: newAndorItem.remark || "",
    };

    const calculatedItem = updateAndorCalculations(completeItem);

    setAndorData([...andorData, calculatedItem]);

    // 重置表单
    setNewAndorItem({
      month: "2025.7",
      no: 1,
      materialName: "",
      usageStation: "",
      usagePerSet: 0,
      usageCount: 0,
      monthlyCapacity: 0,
      minInventory: 0,
      maxInventory: 0,
      monthlyDemand: 0,
      remark: "",
    });
    setShowAndorAddModal(false);
  };

  // B482编辑项目
  const handleEditB482Item = (item: B482SupplyItem) => {
    setEditingB482Item({ ...item });
    setShowB482EditModal(true);
  };

  // B482保存编辑
  const handleSaveB482Edit = () => {
    if (!editingB482Item) return;

    setB482Data(
      b482Data.map((item) =>
        item.id === editingB482Item.id ? editingB482Item : item,
      ),
    );
    setShowB482EditModal(false);
    setEditingB482Item(null);
  };

  // B482删除项目
  const handleDeleteB482Item = (id: number) => {
    setB482Data(b482Data.filter((item) => item.id !== id));
  };

  // 🆕 B482隐藏/显示操作
  const handleToggleB482ItemVisibility = (id: number) => {
    setB482Data(b482Data.map((item) => 
      item.id === id ? { ...item, isHidden: !item.isHidden } : item
    ));
  };

  const handleShowHiddenB482Items = () => {
    setShowHiddenB482Items(!showHiddenB482Items);
  };

  // Andor编辑项目
  const handleEditAndorItem = (item: AndorSupplyItem) => {
    setEditingAndorItem({ ...item });
    setShowAndorEditModal(true);
  };

  // Andor保存编辑
  const handleSaveAndorEdit = () => {
    if (!editingAndorItem) return;

    const calculatedItem = updateAndorCalculations(editingAndorItem);

    setAndorData(
      andorData.map((item) =>
        item.id === editingAndorItem.id ? calculatedItem : item,
      ),
    );
    setShowAndorEditModal(false);
    setEditingAndorItem(null);
  };

  // Andor删除项目
  const handleDeleteAndorItem = (id: number) => {
    setAndorData(andorData.filter((item) => item.id !== id));
  };

  // 🆕 Andor隐藏/显示操作
  const handleToggleAndorItemVisibility = (id: number) => {
    setAndorData(andorData.map((item) => 
      item.id === id ? { ...item, isHidden: !item.isHidden } : item
    ));
  };

  const handleShowHiddenAndorItems = () => {
    setShowHiddenAndorItems(!showHiddenAndorItems);
  };

  // B453添加新项目
  const handleAddB453Item = () => {
    if (!newB453Item.materialDescription || !newB453Item.unitPrice) {
      return;
    }

    const nextId = Math.max(...b453Data.map((item) => item.id)) + 1;
    const nextSerialNumber =
      Math.max(...b453Data.map((item) => item.serialNumber)) + 1;

    const completeItem: B453SupplyItem = {
      id: nextId,
      serialNumber: newB453Item.serialNumber || nextSerialNumber,
      materialDescription: newB453Item.materialDescription!,
      unit: newB453Item.unit || "pcs",
      purchaser: newB453Item.purchaser || "",
      unitPrice: newB453Item.unitPrice!,
      minSafetyStock: newB453Item.minSafetyStock || 0,
      maxSafetyStock: newB453Item.maxSafetyStock || 0,
      moq: newB453Item.moq || 0,
      leadTimeWeeks: newB453Item.leadTimeWeeks || 0,
      apr2025Stock: newB453Item.apr2025Stock || 0,
      may2025Demand: newB453Item.may2025Demand || 0,
      may2025Stock: newB453Item.may2025Stock || 0,
      jun2025Demand: newB453Item.jun2025Demand || 0,
      jun2025Stock: newB453Item.jun2025Stock || 0,
      jul2025Demand: newB453Item.jul2025Demand || 0,
      jul2025Stock: newB453Item.jul2025Stock || 0,
      aug2025Demand: newB453Item.aug2025Demand || 0,
      remark: newB453Item.remark || "",
    };

    setB453Data([...b453Data, completeItem]);

    // 重置表单
    setNewB453Item({
      serialNumber: 0,
      materialDescription: "",
      unit: "pcs",
      purchaser: "",
      unitPrice: 0,
      minSafetyStock: 0,
      maxSafetyStock: 0,
      moq: 0,
      leadTimeWeeks: 0,
      apr2025Stock: 0,
      may2025Demand: 0,
      may2025Stock: 0,
      jun2025Demand: 0,
      jun2025Stock: 0,
      jul2025Demand: 0,
      jul2025Stock: 0,
      aug2025Demand: 0,
      remark: "",
    });
    setShowB453AddModal(false);
  };

  // B453编辑项目
  const handleEditB453Item = (item: B453SupplyItem) => {
    setEditingB453Item({ ...item });
    setShowB453EditModal(true);
  };

  // B453保存编辑
  const handleSaveB453Edit = () => {
    if (!editingB453Item) return;

    setB453Data(
      b453Data.map((item) =>
        item.id === editingB453Item.id ? editingB453Item : item,
      ),
    );
    setShowB453EditModal(false);
    setEditingB453Item(null);
  };

  // B453删除项目
  const handleDeleteB453Item = (id: number) => {
    setB453Data(b453Data.filter((item) => item.id !== id));
  };

  // 🆕 B453隐藏/显示操作
  const handleToggleB453ItemVisibility = (id: number) => {
    setB453Data(b453Data.map((item) => 
      item.id === id ? { ...item, isHidden: !item.isHidden } : item
    ));
  };

  const handleShowHiddenB453Items = () => {
    setShowHiddenB453Items(!showHiddenB453Items);
  };

  // B453计算表操作函数
  const handleAddB453CalcItem = () => {
    if (!newB453CalcItem.materialName || !newB453CalcItem.usageStation) {
      return;
    }

    const nextId = Math.max(...b453CalculationData.map((item) => item.id)) + 1;
    const completeItem: B453CalculationItem = {
      id: nextId,
      no: newB453CalcItem.no || 1,
      materialName: newB453CalcItem.materialName!,
      usageStation: newB453CalcItem.usageStation!,
      usagePerMachine: newB453CalcItem.usagePerMachine || 0,
      usageCount: newB453CalcItem.usageCount || 0,
      monthlyCapacity: newB453CalcItem.monthlyCapacity || 363000,
      minStock: newB453CalcItem.minStock || 0,
      minTotalStock: newB453CalcItem.minTotalStock || 0,
      maxStock: newB453CalcItem.maxStock || 0,
      maxTotalStock: newB453CalcItem.maxTotalStock || 0,
      actualStock: newB453CalcItem.actualStock || 0,
      monthlyDemandPerStation: newB453CalcItem.monthlyDemandPerStation || 0,
      monthlyTotalDemand: newB453CalcItem.monthlyTotalDemand || 0,
      moqRemark: newB453CalcItem.moqRemark || "",
      managementId: 1,
      linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
      unitPrice: 9.82,
      moq: 100,
      purchaser: "湯麗瑩",
      leadTimeWeeks: 15,
    };

    const calculatedItem = updateB453Calculations(completeItem);

    setB453CalculationData([...b453CalculationData, calculatedItem]);

    // 重置表单
    setNewB453CalcItem({
      no: 1,
      materialName: "",
      usageStation: "",
      usagePerMachine: 0,
      usageCount: 0,
      monthlyCapacity: 363000,
      minStock: 0,
      minTotalStock: 0,
      maxStock: 0,
      maxTotalStock: 0,
      actualStock: 0,
      monthlyDemandPerStation: 0,
      monthlyTotalDemand: 0,
      moqRemark: "",
    });
    setShowB453CalcAddModal(false);
  };

  const handleEditB453CalcItem = (item: B453CalculationItem) => {
    setEditingB453CalcItem({ ...item });
    setShowB453CalcEditModal(true);
  };

  const handleSaveB453CalcEdit = () => {
    if (!editingB453CalcItem) return;

    const calculatedItem = updateB453Calculations(editingB453CalcItem);

    setB453CalculationData(
      b453CalculationData.map((item) =>
        item.id === editingB453CalcItem.id ? calculatedItem : item,
      ),
    );
    setShowB453CalcEditModal(false);
    setEditingB453CalcItem(null);
  };

  const handleDeleteB453CalcItem = (id: number) => {
    setB453CalculationData(
      b453CalculationData.filter((item) => item.id !== id),
    );
  };

  // 🆕 B453计算表隐藏/显示操作
  const handleToggleB453CalcItemVisibility = (id: number) => {
    setB453CalculationData(b453CalculationData.map((item) => 
      item.id === id ? { ...item, isHidden: !item.isHidden } : item
    ));
  };

  const handleShowHiddenB453CalcItems = () => {
    setShowHiddenB453CalcItems(!showHiddenB453CalcItems);
  };

  // 导出Excel - 按照B482正确格式
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // 准备数据 - 按照B482的确切格式，申购人和备注信息放在表格下方
    const worksheetData = [
      // 表头 - 与B482表格完全一致
      [
        "序號",
        "物料描述",
        "單位",
        "採購員",
        "單價(RMB)",
        "最高安全庫存",
        "最低安全庫存",
        "最小採購量(MOQ)",
        "未採購量(RMB)",
        "L/T(Day)",
        "2025年6月份",
        "2025年7月份",
        "7月M1",
        "7月M2",
        "7月M3",
        "7月M4",
        "備註",
      ],
      // 数据行 - 包含所有数据（包括隐藏的），通过Excel行隐藏来控制显示
      ...b482Data.map((item) => [
        item.serialNumber,
        item.materialDescription,
        item.unit,
        item.purchaser,
        item.unitPrice,
        item.maxSafetyStock,
        item.minSafetyStock,
        item.moq,
        item.unpurchasedAmount,
        item.leadTime,
        item.june2025,
        item.july2025,
        item.julyM1,
        item.julyM2,
        item.julyM3,
        item.julyM4,
        item.remark,
      ]),

      // 备注信息行（合并3列显示）
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
        "合計：",
        b482Data
          .reduce(
            (sum, item) =>
              sum + (parseFloat(item.unpurchasedAmount.toString()) || 0),
            0,
          )
          .toFixed(2),
        "",
        "",
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
      ],
      [
        "3.採購員要根據實際需求進行採購，避免過度採購。",
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
        "4.單價要根據市場行情進行調整，確保採購成本合理。",
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
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

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

    // 强制设置页面属性
    ws['!pageSetup'].scale = 100;           // 缩放比例100%
    ws['!pageSetup'].fitToPage = true;      // 适应页面
    ws['!pageSetup'].fitToWidth = 1;        // 适应宽度1页
    ws['!pageSetup'].fitToHeight = 1;       // 适应高度1页
    ws['!pageSetup'].orientation = 'landscape'; // 横向
    ws['!pageSetup'].paperSize = 9;         // A4

    // 优化列宽设置 - 确保表格适应页面宽度
    ws["!cols"] = [
      { wch: 4.33 },  // 序號
      { wch: 35 }, // 物料描述
      { wch: 5.67 },  // 單位
      { wch: 7.33 },  // 採購員
      { wch: 9 }, // 單價(RMB)
      { wch: 5.33 }, // 最高安全庫存
      { wch: 5.33 }, // 最低安全庫存
      { wch: 12 }, // 最小採購量(MOQ)
      { wch: 12 }, // 未採購量(RMB)
      { wch: 8 },  // L/T(Day)
      { wch: 10 }, // 2025年6月份
      { wch: 10 }, // 2025年7月份
      { wch: 8 },  // 7月M1
      { wch: 8 },  // 7月M2
      { wch: 8 },  // 7月M3
      { wch: 8 },  // 7月M4
      { wch: 15 }, // 備註
    ];

    // 优化行高设置 - 减小行高以节省空间
    if (!ws['!rows']) ws['!rows'] = [];
    for (let i = 0; i <= worksheetData.length - 1; i++) {
      ws['!rows'][i] = { hpt: 20 }; // 设置所有行为20磅高度
    }
    ws['!rows'][0] = { hpt: 25 }; // 表头行稍高一些

    // 🆕 设置行隐藏 - 根据数据项的隐藏状态隐藏对应的行
    let hiddenRowsCount = 0;
    console.log(`🔍 开始设置B482行隐藏，总数据项数: ${b482Data.length}`);
    console.log(`🔍 B482数据项隐藏状态:`, b482Data.map(item => ({ id: item.id, material: item.materialDescription, isHidden: item.isHidden })));
    
    // 确保行数组存在
    if (!ws['!rows']) {
      ws['!rows'] = [];
    }
    
    b482Data.forEach((item, index) => {
      if (item.isHidden) {
        const rowIndex = index + 1; // 数据行从第1行开始（第0行是表头）
        
        // 确保行对象存在
        if (!ws['!rows']![rowIndex]) {
          ws['!rows']![rowIndex] = { hpt: 20 };
        }
        
        // 设置隐藏属性
        if (ws['!rows']![rowIndex]) {
          ws['!rows']![rowIndex].hidden = true;
          // 设置行高为0（另一种隐藏方式）
          ws['!rows']![rowIndex].hpt = 0;
        }
        
        hiddenRowsCount++;
        console.log(`🔒 隐藏B482行 ${rowIndex}: ${item.materialDescription} (ID: ${item.id})`);
        if (ws['!rows']![rowIndex]) {
          console.log(`🔒 行对象设置:`, ws['!rows']![rowIndex]);
        }
      }
    });
    
    console.log(`📊 B482总共隐藏了 ${hiddenRowsCount} 行`);
    console.log(`🔍 B482行设置:`, ws['!rows']);
    console.log(`🔍 B482隐藏的行索引:`, ws['!rows']?.filter((row, index) => row?.hidden).map((row, index) => index) || []);
    
    // 额外验证：检查所有隐藏的行
    const hiddenRows = ws['!rows']?.filter((row, index) => row?.hidden) || [];
    console.log(`🔍 验证隐藏行数量: ${hiddenRows.length}`);
    console.log(`🔍 验证隐藏行详情:`, hiddenRows);

    // 设置合并单元格 - 备注行合并3列单元格
    ws["!merges"] = [
      // 备注行合并3列单元格：A列到C列
      { s: { r: worksheetData.length - 1, c: 0 }, e: { r: worksheetData.length - 1, c: 2 } }, // 備註：行 A:C
      { s: { r: worksheetData.length - 2, c: 0 }, e: { r: worksheetData.length - 2, c: 2 } }, // 1.行 A:C
      { s: { r: worksheetData.length - 3, c: 0 }, e: { r: worksheetData.length - 3, c: 2 } }, // 2.行 A:C
      { s: { r: worksheetData.length - 4, c: 0 }, e: { r: worksheetData.length - 4, c: 2 } }, // 3.行 A:C
      { s: { r: worksheetData.length - 5, c: 0 }, e: { r: worksheetData.length - 5, c: 2 } }, // 4.行 A:C
    ];

    // 设置签名行
    const signatureRow = worksheetData.length - 5; // 签名行

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
      if (rowIndex >= worksheetData.length - 6) {
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
      if (rowIndex >= 1 && rowIndex <= b482Data.length) {
        // 物料描述列（B列，索引为1）左对齐，启用自动换行
        if (colIndex === 1) {
          cell.s.alignment.horizontal = 'left';
          cell.s.alignment.vertical = 'top';
          cell.s.alignment.wrapText = true; // 启用自动换行
          return;
        }
        
        // 备注列（Q列，索引为16）左对齐，启用自动换行
        if (colIndex === 16) {
          cell.s.alignment.horizontal = 'left';
          cell.s.alignment.vertical = 'center';
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
      if (rowIndex === 0) {
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
    for (let row = worksheetData.length - 6; row <= worksheetData.length - 1; row++) {
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



    // 设置表头行高度为33（更加美观大方）
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 33 }; // 表头行高度

    // 主标题左对齐
    const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[titleCellRef]) {
      if (!ws[titleCellRef].s) ws[titleCellRef].s = {};
      if (!ws[titleCellRef].s.alignment) ws[titleCellRef].s.alignment = {};
      ws[titleCellRef].s.alignment.horizontal = 'left';
      ws[titleCellRef].s.alignment.vertical = 'center';
    }

    // 🎯 设置表格网格线 - 只给表格数据区域设置边框
    const tableStartRow = 1; // 表格数据开始行（第2行，索引为1）
    const tableEndRow = b482Data.length; // 表格数据结束行
    const tableStartCol = 0; // 表格开始列（A列，索引为0）
    const tableEndCol = 16; // 表格结束列（Q列，索引为16）

    // 只为表格数据区域的所有单元格设置边框（不包括表头）
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

    // 🎯 为表头行设置边框（只给表头行设置边框，不包括其他区域）
    const headerRow = 0; // 表头行（第1行，索引为0）
    for (let colIndex = tableStartCol; colIndex <= tableEndCol; colIndex++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: colIndex });
      
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

    // 设置打印区域 - 限制打印范围到表格区域
    const dataEndRow = b482Data.length; // 数据结束行
    const footerEndRow = dataEndRow + 5; // 备注信息结束行
    ws['!printArea'] = `A1:Q${footerEndRow + 1}`; // 设置打印区域到备注信息结束

    XLSX.utils.book_append_sheet(wb, ws, "B482耗材管控申請表");

    const fileName = `B482_TE課6512部門7月常用消耗材管控申請表_${new Date().toISOString().split("T")[0]}.xlsx`;

    // 尝试使用不同的方法设置页面属性
    const writeOptions = {
      bookType: 'xlsx' as const,
      bookSST: false,
      type: 'binary' as const,
      cellStyles: true,
      compression: true
    };

    // 直接设置工作簿属性
    wb.Props = {
      Title: "B482耗材管控申請表",
      Subject: "耗材管控",
      Author: "系统",
      CreatedDate: new Date()
    };

    // 重新设置工作表属性
    ws['!pageSetup'] = {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      orientation: 'landscape',
      paperSize: 9,
      margins: {
        top: 0.1,
        bottom: 0.1,
        left: 0.1,
        right: 0.1,
        header: 0.1,
        footer: 0.1
      },
      scale: 100
    };

    // 在浏览器环境中生成并下载文件
    const wbout = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: false,
      compression: true
    });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);

    // 添加调试信息
    console.log("🔧 页面设置调试信息：");
    console.log("页边距设置:", ws['!pageSetup']?.margins);
    console.log("适应页面:", ws['!pageSetup']?.fitToPage);
    console.log("适应宽度:", ws['!pageSetup']?.fitToWidth);
    console.log("适应高度:", ws['!pageSetup']?.fitToHeight);
    console.log("打印方向:", ws['!pageSetup']?.orientation);
    console.log("纸张大小:", ws['!pageSetup']?.paperSize);
    console.log("缩放比例:", ws['!pageSetup']?.scale);
    console.log("工作簿属性:", wb.Props);
  };

  // Andor导出函数
  const handleAndorExport = () => {
    const wb = XLSX.utils.book_new();
    const worksheetData = [
      [
        "月份",
        "No.",
        "耗材名稱",
        "使用站別",
        "每臺機用量",
        "使用次數",
        "當月產能",
        "最低庫存",
        "最高庫存",
        "最高庫存总數",
        "當月需求/站",
        "備註(實際訂購數量)",
      ],
      ...andorData.map((item) => {
        // 计算该耗材的最高庫存总數
        const maxTotalInventory = andorData
          .filter(otherItem => otherItem.materialName === item.materialName && otherItem.month === item.month)
          .reduce((total, otherItem) => total + (otherItem.maxInventory || 0), 0);
        
        return [
          item.month,
          item.no,
          item.materialName,
          item.usageStation,
          item.usagePerSet,
          item.usageCount,
          item.monthlyCapacity,
          item.minInventory,
          item.maxInventory,
          maxTotalInventory,
          item.monthlyDemand,
          item.remark,
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 🎨 设置字体样式：使用標楷體
    setFontStyle(ws, '標楷體');

    // 设置表头行高度为33（更加美观大方）
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 33 }; // 表头行高度

    // 🆕 设置行隐藏 - 根据数据项的隐藏状态隐藏对应的行
    let hiddenRowsCount = 0;
    console.log(`🔍 开始设置Andor行隐藏，总数据项数: ${andorData.length}`);
    console.log(`🔍 Andor数据项隐藏状态:`, andorData.map(item => ({ id: item.id, material: item.materialName, isHidden: item.isHidden })));
    
    // 确保行数组存在
    if (!ws['!rows']) {
      ws['!rows'] = [];
    }
    
    andorData.forEach((item, index) => {
      if (item.isHidden) {
        const rowIndex = index + 1; // 数据行从第1行开始（第0行是表头）
        
        // 确保行对象存在
        if (!ws['!rows']![rowIndex]) {
          ws['!rows']![rowIndex] = { hpt: 20 };
        }
        
        // 设置隐藏属性
        if (ws['!rows']![rowIndex]) {
          ws['!rows']![rowIndex].hidden = true;
          // 设置行高为0（另一种隐藏方式）
          ws['!rows']![rowIndex].hpt = 0;
        }
        
        hiddenRowsCount++;
        console.log(`🔒 隐藏Andor行 ${rowIndex}: ${item.materialName} (ID: ${item.id})`);
        if (ws['!rows']![rowIndex]) {
          console.log(`🔒 Andor行对象设置:`, ws['!rows']![rowIndex]);
        }
      }
    });
    
    console.log(`📊 Andor总共隐藏了 ${hiddenRowsCount} 行`);
    console.log(`🔍 Andor行设置:`, ws['!rows']);
    console.log(`🔍 Andor隐藏的行索引:`, ws['!rows']?.filter((row, index) => row?.hidden).map((row, index) => index) || []);
    
    // 额外验证：检查所有隐藏的行
    const hiddenRows = ws['!rows']?.filter((row, index) => row?.hidden) || [];
    console.log(`🔍 验证Andor隐藏行数量: ${hiddenRows.length}`);
    console.log(`🔍 验证Andor隐藏行详情:`, hiddenRows);

    // 主标题左对齐
    const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[titleCellRef]) {
      if (!ws[titleCellRef].s) ws[titleCellRef].s = {};
      if (!ws[titleCellRef].s.alignment) ws[titleCellRef].s.alignment = {};
      ws[titleCellRef].s.alignment.horizontal = 'left';
      ws[titleCellRef].s.alignment.vertical = 'center';
    }

    // 🎯 设置表格网格线 - 只给表格数据区域设置边框
    const tableStartRow = 1; // 表格数据开始行（第2行，索引为1）
    const tableEndRow = andorData.length; // 表格数据结束行
    const tableStartCol = 0; // 表格开始列（A列，索引为0）
    const tableEndCol = 11; // 表格结束列（L列，索引为11）

    // 只为表格数据区域的所有单元格设置边框
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

    // 🎯 为表头行设置边框（只给表头行设置边框，不包括其他区域）
    const headerRow = 0; // 表头行（第1行，索引为0）
    for (let colIndex = tableStartCol; colIndex <= tableEndCol; colIndex++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: colIndex });
      
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

    // 优化列宽设置
    ws["!cols"] = [
      { wch: 8 },  // 月份
      { wch: 6 },  // No.
      { wch: 20 }, // 耗材名稱
      { wch: 12 }, // 使用站別
      { wch: 10 }, // 每臺機用量
      { wch: 8 },  // 使用次數
      { wch: 10 }, // 當月產能
      { wch: 10 }, // 最低庫存
      { wch: 10 }, // 最高庫存
      { wch: 12 }, // 最高庫存总數
      { wch: 10 }, // 當月需求/站
      { wch: 15 }, // 備註(實際訂購數量)
    ];

    // 优化行高设置
    if (!ws['!rows']) ws['!rows'] = [];
    for (let i = 0; i <= andorData.length; i++) {
      ws['!rows'][i] = { hpt: 20 }; // 设置所有行为20磅高度
    }
    ws['!rows'][0] = { hpt: 25 }; // 表头行稍高一些

    // 设置打印区域 - 限制打印范围到表格区域
    const dataEndRow = andorData.length; // 数据结束行
    ws['!printArea'] = `A1:L${dataEndRow + 1}`; // 设置打印区域到数据结束

    XLSX.utils.book_append_sheet(wb, ws, "Andor耗材需求計算");
    
    // 在浏览器环境中生成并下载文件
    const fileName = `Andor7月常用耗材需求計算_${new Date().toISOString().split("T")[0]}.xlsx`;
    const wbout = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: false,
      compression: true
    });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // 🔧 动态生成B453表头的函数
  const generateB453Headers = (
    targetYear: number = new Date().getFullYear(),
    targetMonth: number = new Date().getMonth() + 1,
  ) => {
    // 确保月份在1-12范围内
    targetMonth = Math.max(1, Math.min(12, targetMonth));

    // 生成前两个月和当前月的月份信息
    const months = [];

    for (let i = -2; i <= 0; i++) {
      const currentMonth = targetMonth + i;
      let actualMonth = currentMonth;
      let actualYear = targetYear;

      if (currentMonth <= 0) {
        actualMonth = 12 + currentMonth;
        actualYear = targetYear - 1;
      }

      months.push({
        year: actualYear,
        month: actualMonth,
      });
    }

    // 计算上一年同期月份
    const prevYearMonth = {
      year: targetYear - 1,
      month: targetMonth,
    };

    // 动态生成主标题
    const mainTitle = `TE課B453 SMT ATE ${targetYear}年${targetMonth}月份耗材管控表`;

    // 动态生成主表头
    const mainHeaders = [
      `${months[2].year}/${String(months[2].month).padStart(2, "0")}/22存`,
      `${targetYear}年${targetMonth}月需求`,
      "PR開立時間與數量",
      "",
      "进料需求",
      "",
      "",
      "",
      "总金额(RMB)",
      "備註",
    ];

    // 🔧 中间表头 - 显示日期
    const middleHeaders = [
      `${months[2].year}/${String(months[2].month).padStart(2, "0")}/22`,
      `${targetYear}年${targetMonth}月需求`,
      `${targetYear}/${String(targetMonth).padStart(2, "0")}/19`,
      `${targetYear}/${String(targetMonth).padStart(2, "0")}/25`,
      `${targetMonth}月W01`,
      `${targetMonth}月W02`,
      `${targetMonth}月W03`,
      `${targetMonth}月W04`,
      "总金额",
      "備註",
    ];

    // �� 子表头 - 数量
    const subHeaders = [
      "数量",
      "数量",
      "数量",
      "数量",
      "数量",
      "数量",
      "数量",
      "数量",
      "数量",
      "备注",
    ];

    return {
      mainTitle,
      mainHeaders,
      middleHeaders,
      subHeaders,
      months,
      targetYear,
      targetMonth,
      prevYearMonth,
    };
  };

  // B453导出Excel
  const handleB453Export = () => {
    const wb = XLSX.utils.book_new();

    // 使用选择的年份和月份
    const { mainTitle, mainHeaders, middleHeaders, subHeaders, targetMonth } =
      generateB453Headers();

    // 🔧 按照真实B453格式重新设计表头（完整版本）
    const worksheetData = [
      // 第1行：主标题行 (A1:J1合并)
      [mainTitle, "", "", "", "", "", "", "", "", ""],

      // 第2行：主表头 (第一级)
      mainHeaders,

      // 第3行：中间表头 (第二级)
      middleHeaders,

      // 第4行：子表头 (第三级)
      subHeaders,

      // 数据行 - 包含所有数据（包括隐藏的），通过Excel行隐藏来控制显示
      ...b453Data.map((item) => [
        getB453DataField(item, "stock", targetMonth), // 当月月底库存
        getB453DataField(item, "demand", targetMonth), // 当月需求/站
        0, // PR開立時間與數量 - 当年月/19
        0, // PR開立時間與數量 - 前一年同期/25
        0, // 进料需求 W01
        0, // 进料需求 W02
        0, // 进料需求 W03
        0, // 进料需求 W04
        (
          item.unitPrice * getB453DataField(item, "demand", targetMonth)
        ).toFixed(2), // 总金额(RMB)
        item.remark, // 備註
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 设置列宽
    ws["!cols"] = [
      { wch: 4.33 }, // 月底库存
      { wch: 12 }, // 月需求
      { wch: 12 }, // PR開立時間與數量 - 当年月/19
      { wch: 12 }, // PR開立時間與數量 - 前一年同期/25
      { wch: 10 }, // 进料需求 W01
      { wch: 10 }, // 进料需求 W02
      { wch: 10 }, // 进料需求 W03
      { wch: 10 }, // 进料需求 W04
      { wch: 12 }, // 总金额(RMB)
      { wch: 15 }, // 備註
    ];

    // 设置合并单元格
    ws["!merges"] = [
      // 主标题行合并 A1:J1
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      // PR開立時間與數量 (第2行合并)
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } },
      // 进料需求 (第2行合并)
      { s: { r: 1, c: 4 }, e: { r: 1, c: 7 } },
      // 新增：middleHeaders第3、4列合并，防止Excel自动填充
      { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } },
    ];

    // 🎨 设置字体样式：使用標楷體
    setFontStyle(ws, '標楷體');

    // 设置表头行高度（第1行改为33，第2-4行保持30）
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 33 }; // 主标题行高度
    ws['!rows'][1] = { hpt: 30 }; // 主表头行高度
    ws['!rows'][2] = { hpt: 30 }; // 中间表头行高度
    ws['!rows'][3] = { hpt: 30 }; // 子表头行高度

    // 🆕 设置行隐藏 - 根据数据项的隐藏状态隐藏对应的行
    let hiddenRowsCount = 0;
    console.log(`🔍 开始设置B453行隐藏，总数据项数: ${b453Data.length}`);
    console.log(`🔍 B453数据项隐藏状态:`, b453Data.map(item => ({ id: item.id, material: item.materialDescription, isHidden: item.isHidden })));
    
    // 确保行数组存在
    if (!ws['!rows']) {
      ws['!rows'] = [];
    }
    
    b453Data.forEach((item, index) => {
      if (item.isHidden) {
        const rowIndex = index + 4; // 数据行从第4行开始（前4行是表头）
        
        // 确保行对象存在
        if (!ws['!rows']![rowIndex]) {
          ws['!rows']![rowIndex] = { hpt: 20 };
        }
        
        // 设置隐藏属性
        if (ws['!rows']![rowIndex]) {
          ws['!rows']![rowIndex].hidden = true;
          // 设置行高为0（另一种隐藏方式）
          ws['!rows']![rowIndex].hpt = 0;
        }
        
        hiddenRowsCount++;
        console.log(`🔒 隐藏B453行 ${rowIndex}: ${item.materialDescription} (ID: ${item.id})`);
        if (ws['!rows']![rowIndex]) {
          console.log(`🔒 B453行对象设置:`, ws['!rows']![rowIndex]);
        }
      }
    });
    
    console.log(`📊 B453总共隐藏了 ${hiddenRowsCount} 行`);
    console.log(`🔍 B453行设置:`, ws['!rows']);
    console.log(`🔍 B453隐藏的行索引:`, ws['!rows']?.filter((row, index) => row?.hidden).map((row, index) => index) || []);
    
    // 额外验证：检查所有隐藏的行
    const hiddenRows = ws['!rows']?.filter((row, index) => row?.hidden) || [];
    console.log(`🔍 验证B453隐藏行数量: ${hiddenRows.length}`);
    console.log(`🔍 验证B453隐藏行详情:`, hiddenRows);

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
      for (let colIndex = 0; colIndex < 10; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        
        // 确保单元格存在
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
        }
      }
    }

    // 🎯 使用智能对齐：物料描述和备注左对齐，数值居中
    setSmartAlignment(ws, {
      leftAlignColumns: [1, 9], // 物料描述（B列）和备注（J列）左对齐
      leftAlignKeywords: [
        // 标题内容
        "管控表",
        "TE課B453",
        "SMT ATE",
        "耗材管控表",
        // 备注关键词
        "備註",
        "備註：",
        "MOQ:",
        "訂貨",
        "PCS",
        "週期",
        // 物料描述
        "故障排除線",
        "测试",
        "夹具",
        "線材",
        "耗材",
        "設備",
        "探針",
      ],
    });

    // 🎯 特殊处理合计行的对齐 - 确保合计行和合计数值都居中显示
    const totalRowIndex = 4 + b453Data.length; // 合计行的索引（数据行数 + 4行表头）
    for (let colIndex = 0; colIndex < 10; colIndex++) {
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

    // 🎯 设置表格网格线 - 只给表格数据区域设置边框
    const tableStartRow = 4; // 表格数据开始行（第5行，索引为4）
    const tableEndRow = 3 + b453Data.length; // 表格数据结束行（包含合计行）
    const tableStartCol = 0; // 表格开始列（A列，索引为0）
    const tableEndCol = 9; // 表格结束列（J列，索引为9）

    // 只为表格数据区域的所有单元格设置边框（不包括表头）
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

    // 🎯 为表头区域设置边框（只给表头行设置边框，不包括其他区域）
    const headerStartRow = 1; // 表头开始行（第2行，索引为1）
    const headerEndRow = 3; // 表头结束行（第4行，索引为3）
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

    // 优化列宽设置
    ws["!cols"] = [
      { wch: 12 }, // 月底库存
      { wch: 12 }, // 月需求
      { wch: 12 }, // PR開立時間與數量 - 当年月/19
      { wch: 12 }, // PR開立時間與數量 - 前一年同期/25
      { wch: 8 },  // 进料需求 W01
      { wch: 8 },  // 进料需求 W02
      { wch: 8 },  // 进料需求 W03
      { wch: 8 },  // 进料需求 W04
      { wch: 12 }, // 总金额(RMB)
      { wch: 15 }, // 備註
    ];

    // 优化行高设置
    if (!ws['!rows']) ws['!rows'] = [];
    for (let i = 0; i <= b453Data.length + 3; i++) {
      ws['!rows'][i] = { hpt: 20 }; // 设置所有行为20磅高度
    }
    ws['!rows'][0] = { hpt: 25 }; // 主标题行稍高一些
    ws['!rows'][1] = { hpt: 25 }; // 主表头行稍高一些
    ws['!rows'][2] = { hpt: 25 }; // 中间表头行稍高一些
    ws['!rows'][3] = { hpt: 25 }; // 子表头行稍高一些

    // 设置打印区域 - 限制打印范围到表格区域
    const dataEndRow = b453Data.length; // 数据结束行
    ws['!printArea'] = `A1:J${dataEndRow + 4}`; // 设置打印区域到数据结束（包含表头）

    XLSX.utils.book_append_sheet(wb, ws, "B453耗材管控表");
    
    // 在浏览器环境中生成并下载文件
    const fileName = `B453_SMT_ATE耗材管控表_${new Date().toISOString().split("T")[0]}.xlsx`;
    const wbout = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: false,
      compression: true
    });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // B453计算表导出Excel
  const handleB453CalcExport = async () => {
    try {
      const wb = XLSX.utils.book_new();

      // 从后端获取最新的表头配置
      const headers = await materialManagementApi.b453Calculation.getHeaders();

      // 使用选择的年份和月份
      const calculationData = [
        [
          `TE課B453 SMT ATE ${selectedYear}年${selectedMonth}月份耗材需求計算表`,
          ...Array(headers.length - 1).fill(""),
        ], // 标题行
        headers.map((col) => col.title), // 表头行
        ...b453CalculationData.map((item) => {
          const calculatedItem = updateB453Calculations(item);

          return [
            calculatedItem.no,
            calculatedItem.materialName,
            calculatedItem.usageStation,
            calculatedItem.usagePerMachine,
            calculatedItem.usageCount,
            calculatedItem.monthlyCapacity,
            calculatedItem.minStock,
            calculatedItem.minTotalStock,
            calculatedItem.maxStock,
            calculatedItem.maxTotalStock,
            calculatedItem.monthlyDemandPerStation,
            calculatedItem.monthlyTotalDemand,
            calculatedItem.actualStock,
            calculatedItem.moqRemark,
            calculatedItem.purchaser || "",
            calculatedItem.leadTimeWeeks || "",
          ];
        }),
      ];

      const ws = XLSX.utils.aoa_to_sheet(calculationData);

      // 设置列宽 - 使用headers中的width属性
      ws["!cols"] = headers.map((col) => ({ wch: col.width }));

      // 设置合并单元格
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // 标题行合并
      ];

      // 🎯 使用智能对齐：物料名称左对齐，数值居中
      setSmartAlignment(ws, {
        leftAlignColumns: [2], // 物料名称（C列）左对齐
        leftAlignKeywords: [
          // 标题内容
          "需求計算表",
          "B453",
          // 物料名称相关
          "故障排除線",
          "测试",
          "夹具",
          "線材",
          "耗材",
          "設備",
          "探針",
          // 备注关键词
          "備註",
          "備註：",
          "MOQ:",
          "PCS",
          "週期",
          // 備注行编号
          "1.",
          "2.",
          "3.",
          "4.",
                  // 合计行（特殊处理：居中显示）
        "合計",
        ],
      });

      // 🎨 设置字体样式：使用標楷體
      setFontStyle(ws, '標楷體');

      // 设置表头行高度（第1行改为33，第2行保持30）
      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 33 }; // 主标题行高度
      ws['!rows'][1] = { hpt: 30 }; // 表头行高度

      // 🆕 设置行隐藏 - 根据数据项的隐藏状态隐藏对应的行
      let hiddenRowsCount = 0;
      console.log(`🔍 开始设置B453计算表行隐藏，总数据项数: ${b453CalculationData.length}`);
      console.log(`🔍 B453计算表数据项隐藏状态:`, b453CalculationData.map(item => ({ id: item.id, material: item.materialName, isHidden: item.isHidden })));
      
      // 确保行数组存在
      if (!ws['!rows']) {
        ws['!rows'] = [];
      }
      
      b453CalculationData.forEach((item, index) => {
        if (item.isHidden) {
          const rowIndex = index + 2; // 数据行从第2行开始（前2行是表头）
          
          // 确保行对象存在
          if (!ws['!rows']![rowIndex]) {
            ws['!rows']![rowIndex] = { hpt: 20 };
          }
          
          // 设置隐藏属性
          if (ws['!rows']![rowIndex]) {
            ws['!rows']![rowIndex].hidden = true;
            // 设置行高为0（另一种隐藏方式）
            ws['!rows']![rowIndex].hpt = 0;
          }
          
          hiddenRowsCount++;
          console.log(`🔒 隐藏B453计算表行 ${rowIndex}: ${item.materialName} (ID: ${item.id})`);
          if (ws['!rows']![rowIndex]) {
            console.log(`🔒 B453计算表行对象设置:`, ws['!rows']![rowIndex]);
          }
        }
      });
      
      console.log(`📊 B453计算表总共隐藏了 ${hiddenRowsCount} 行`);
      console.log(`🔍 B453计算表行设置:`, ws['!rows']);
      console.log(`🔍 B453计算表隐藏的行索引:`, ws['!rows']?.filter((row, index) => row?.hidden).map((row, index) => index) || []);
      
      // 额外验证：检查所有隐藏的行
      const hiddenRows = ws['!rows']?.filter((row, index) => row?.hidden) || [];
      console.log(`🔍 验证B453计算表隐藏行数量: ${hiddenRows.length}`);
      console.log(`🔍 验证B453计算表隐藏行详情:`, hiddenRows);

      // 主标题左对齐
      const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[titleCellRef]) {
        if (!ws[titleCellRef].s) ws[titleCellRef].s = {};
        if (!ws[titleCellRef].s.alignment) ws[titleCellRef].s.alignment = {};
        ws[titleCellRef].s.alignment.horizontal = 'left';
        ws[titleCellRef].s.alignment.vertical = 'center';
      }

      // 为表头行（第1-2行）设置垂直居中和文字居中，并设置填充色（第0行保持左对齐）
      for (let rowIndex = 1; rowIndex < 2; rowIndex++) {
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          if (ws[cellRef]) {
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
            }
          }
        }
      }

      // 🎯 设置表格网格线 - 只给表格数据区域设置边框
      const headerStartRow = 1; // 表头开始行（第2行，索引为1）
      const headerEndRow = 1; // 表头结束行（第2行，索引为1）
      const tableStartRow = 2; // 表格数据开始行（第3行，索引为2）
      const tableEndRow = 1 + b453CalculationData.length; // 表格数据结束行
      const tableStartCol = 0; // 表格开始列（A列，索引为0）
      const tableEndCol = headers.length - 1; // 表格结束列

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

      // 优化行高设置
      if (!ws['!rows']) ws['!rows'] = [];
      for (let i = 0; i <= b453CalculationData.length + 1; i++) {
        ws['!rows'][i] = { hpt: 20 }; // 设置所有行为20磅高度
      }
      ws['!rows'][0] = { hpt: 25 }; // 标题行稍高一些
      ws['!rows'][1] = { hpt: 25 }; // 表头行稍高一些

      // 设置打印区域 - 限制打印范围到表格区域
      const dataEndRow = b453CalculationData.length; // 数据结束行
      ws['!printArea'] = `A1:${String.fromCharCode(65 + headers.length - 1)}${dataEndRow + 2}`; // 设置打印区域到数据结束（包含表头）

      XLSX.utils.book_append_sheet(wb, ws, "B453耗材需求計算");
      
      // 在浏览器环境中生成并下载文件
      const fileName = `B453耗材需求計算表_${new Date().toISOString().split("T")[0]}.xlsx`;
      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false,
        compression: true
      });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出失败:", error);
      // 显示错误提示
      addToast({
        title: "导出失败",
        description: "获取表头配置失败，请稍后重试",
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

  // B482 Tab组件
  const B482Tab = () => (
    <div className="flex flex-col gap-6">
      {/* 🧮 统一计算公式说明 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardBody>
          <h3 className="text-lg font-semibold mb-3 text-blue-800">
            🧮 統一計算公式 - B482申請表
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-green-600">當月需求/站</strong>
              <br />= 當月產能 × 每臺機用量 ÷ 使用次數
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-orange-600">需求金額</strong>
              <br />= 當月需求/站 × 單價(RMB)
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-purple-600">自動計算</strong>
              <br />
              啟用後自動更新7月需求量
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">
              {b482Data.length}
            </div>
            <div className="text-sm text-gray-600">總項目數</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">
              {formatPrice(calculateTotalValue())}
            </div>
            <div className="text-sm text-gray-600">總未採購金額</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">
              {calculateTotalMOQ()}
            </div>
            <div className="text-sm text-gray-600">總MOQ數量</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-secondary">
              {b482Data.reduce((total, item) => total + item.july2025, 0)}
            </div>
            <div className="text-sm text-gray-600">7月總需求</div>
          </CardBody>
        </Card>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={<PlusIcon />}
            onClick={handleAddB482Item}
          >
            添加耗材項目
          </Button>
          <Button
            color="success"
            startContent={<DownloadIcon />}
            onClick={handleExport}
          >
            導出Excel
          </Button>
          <Button
            color="warning"
            variant="flat"
            onClick={handleShowHiddenB482Items}
          >
            {showHiddenB482Items ? "隱藏已隱藏項目" : "顯示已隱藏項目"}
          </Button>
          {/* 🧪 测试按钮 */}
          <Button
            color="secondary"
            variant="flat"
            onClick={() => {
              // 添加测试数据
              const testItem: B482SupplyItem = {
                id: Date.now(),
                serialNumber: 999,
                materialDescription: "🧪 测试隐藏耗材",
                unit: "PCS",
                purchaser: "测试员",
                unitPrice: 100,
                maxSafetyStock: 50,
                minSafetyStock: 10,
                moq: 20,
                unpurchasedAmount: 2000,
                leadTime: 7,
                june2025: 100,
                july2025: 150,
                julyM1: 25,
                julyM2: 30,
                julyM3: 35,
                julyM4: 40,
                remark: "测试数据",
                isHidden: true, // 设置为隐藏
              };
              setB482Data([...b482Data, testItem]);
              console.log("🧪 添加了测试隐藏数据:", testItem);
            }}
          >
            添加測試隱藏數據
          </Button>
        </div>
        <Badge color="secondary" size="lg" variant="flat">
          B482申請表數據
        </Badge>
      </div>

      {/* B482耗材管控申請表格 - 按照正确的列头顺序 */}
      <Card className="shadow-lg">
        <CardBody>
          <Table
            aria-label="B482 TE課6512部門7月常用消耗材管控申請表"
            className="min-w-full"
          >
            <TableHeader>
              <TableColumn className="bg-orange-100">序號</TableColumn>
              <TableColumn className="bg-red-100">物料描述</TableColumn>
              <TableColumn className="bg-red-100">單位</TableColumn>
              <TableColumn className="bg-red-100">採購員</TableColumn>
              <TableColumn className="bg-red-100">單價(RMB)</TableColumn>
              <TableColumn className="bg-purple-100">最高安全庫存</TableColumn>
              <TableColumn className="bg-purple-100">最低安全庫存</TableColumn>
              <TableColumn className="bg-orange-100">
                最小採購量(MOQ)
              </TableColumn>
              <TableColumn className="bg-orange-100">未採購量(RMB)</TableColumn>
              <TableColumn className="bg-orange-100">L/T(Day)</TableColumn>
              <TableColumn className="bg-blue-100">2025年6月份</TableColumn>
              <TableColumn className="bg-yellow-100">2025年7月份</TableColumn>
              <TableColumn className="bg-green-100">7月M1</TableColumn>
              <TableColumn className="bg-green-100">7月M2</TableColumn>
              <TableColumn className="bg-green-100">7月M3</TableColumn>
              <TableColumn className="bg-green-100">7月M4</TableColumn>
              <TableColumn className="bg-gray-100">備註</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {b482Data
                .filter((item) => showHiddenB482Items || !item.isHidden)
                .map((item, index) => (
                  <TableRow 
                    key={`${item.id}-${index}`}
                    className={item.isHidden ? "opacity-50 bg-gray-50" : ""}
                  >
                    <TableCell>{item.serialNumber}</TableCell>
                    <TableCell>{item.materialDescription}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.purchaser}</TableCell>
                    <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                    <TableCell>{item.maxSafetyStock}</TableCell>
                    <TableCell>{item.minSafetyStock}</TableCell>
                    <TableCell>{item.moq}</TableCell>
                    <TableCell>{formatPrice(item.unpurchasedAmount)}</TableCell>
                    <TableCell>{item.leadTime} 天</TableCell>
                    <TableCell>{item.june2025}</TableCell>
                    <TableCell>{item.july2025}</TableCell>
                    <TableCell>{item.julyM1}</TableCell>
                    <TableCell>{item.julyM2}</TableCell>
                    <TableCell>{item.julyM3}</TableCell>
                    <TableCell>{item.julyM4}</TableCell>
                    <TableCell>{item.remark}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          color={item.isHidden ? "success" : "warning"}
                          variant="flat"
                          onClick={() => handleToggleB482ItemVisibility(item.id)}
                        >
                          {item.isHidden ? "顯示" : "隱藏"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );

  // Andor Tab组件
  const AndorTab = () => {
    // 计算每个耗材的最高庫存总數
    const calculateMaxTotalInventory = (materialName: string, month: string): number => {
      return andorData
        .filter(item => item.materialName === materialName && item.month === month)
        .reduce((total, item) => total + (item.maxInventory || 0), 0);
    };

    // 为每个项目添加最高庫存总數
    const andorDataWithTotal = andorData.map(item => ({
      ...item,
      maxTotalInventory: calculateMaxTotalInventory(item.materialName, item.month)
    }));

    const groupedData = andorDataWithTotal.reduce(
      (acc, item) => {
        if (!acc[item.month]) {
          acc[item.month] = [];
        }
        acc[item.month].push(item);

        return acc;
      },
      {} as Record<string, AndorSupplyItem[]>,
    );

    return (
      <div className="flex flex-col gap-6">
        {/* 🧮 统一计算公式说明 */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardBody>
            <h3 className="text-lg font-semibold mb-3 text-blue-800">
              🧮 統一計算公式 - Andor需求計算
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-green-200">
                              <strong className="text-green-600">當月需求/站</strong>
              <br />= 當月產能 × 每臺機用量 ÷ 使用次數
              </div>
              <div className="bg-white p-3 rounded border border-orange-200">
                <strong className="text-orange-600">最高庫存</strong>
                <br />= 六個月中最高產能 × 每臺機用量 ÷ 使用次數
              </div>
              <div className="bg-white p-3 rounded border border-red-200">
                <strong className="text-red-600">最低庫存</strong>
                <br />= 六個月中最低產能 × 每臺機用量 ÷ 使用次數
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 产能预测设置 */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">📈 產能預測設置</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Input
                label="最高產能"
                type="number"
                value={forecastData.maxCapacity.toString()}
                onValueChange={(value) =>
                  setForecastData({
                    ...forecastData,
                    maxCapacity: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="最低產能"
                type="number"
                value={forecastData.minCapacity.toString()}
                onValueChange={(value) =>
                  setForecastData({
                    ...forecastData,
                    minCapacity: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="4月-24"
                type="number"
                value={forecastData.apr24.toString()}
                onValueChange={(value) =>
                  setForecastData({
                    ...forecastData,
                    apr24: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="5月-25"
                type="number"
                value={forecastData.may25.toString()}
                onValueChange={(value) =>
                  setForecastData({
                    ...forecastData,
                    may25: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="6月-25"
                type="number"
                value={forecastData.jun25.toString()}
                onValueChange={(value) =>
                  setForecastData({
                    ...forecastData,
                    jun25: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="7月-25"
                type="number"
                value={forecastData.jul25.toString()}
                onValueChange={(value) =>
                  setForecastData({
                    ...forecastData,
                    jul25: parseInt(value) || 0,
                  })
                }
              />
            </div>
          </CardBody>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              color="primary"
              startContent={<PlusIcon />}
              onClick={() => setShowAndorAddModal(true)}
            >
              添加耗材項目
            </Button>
            <Button
              color="success"
              startContent={<DownloadIcon />}
              variant="flat"
              onClick={handleAndorExport}
            >
              導出Excel計算表
            </Button>
            {/* 🆕 隐藏/显示按钮 */}
            <Button
              color="warning"
              variant="flat"
              onClick={handleShowHiddenAndorItems}
            >
              {showHiddenAndorItems ? "隱藏已隱藏項目" : "顯示已隱藏項目"}
            </Button>
            {/* 🧪 测试按钮 */}
            <Button
              color="secondary"
              variant="flat"
              onClick={() => {
                // 添加测试数据
                const testItem: AndorSupplyItem = {
                  id: Date.now(),
                  month: "2025.7",
                  no: 999,
                  materialName: "🧪 测试隐藏耗材",
                  usageStation: "测试站",
                  usagePerSet: 1,
                  usageCount: 1,
                  monthlyCapacity: 1000,
                  minInventory: 10,
                  maxInventory: 50,
                  monthlyDemand: 100,
                  remark: "测试数据",
                  isHidden: true, // 设置为隐藏
                };
                setAndorData([...andorData, testItem]);
                console.log("🧪 添加了Andor测试隐藏数据:", testItem);
              }}
            >
              添加測試隱藏數據
            </Button>
          </div>
          <Badge color="secondary" size="lg" variant="flat">
            總項目: {andorData.length}
          </Badge>
        </div>

        {/* Andor表格 */}
        {Object.entries(groupedData).map(([month, items]) => (
          <Card key={month} className="shadow-lg">
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <Chip color="primary" size="lg">
                  {month}
                </Chip>
                <span className="text-gray-600">({items.length} 項目)</span>
              </div>

              <Table
                aria-label={`${month} 耗材需求計算表`}
                className="min-w-full"
              >
                <TableHeader>
                  <TableColumn className="bg-orange-100">No.</TableColumn>
                  <TableColumn className="bg-orange-100">耗材名稱</TableColumn>
                  <TableColumn className="bg-orange-100">使用站別</TableColumn>
                  <TableColumn className="bg-green-100">每台机用量</TableColumn>
                  <TableColumn className="bg-green-100">使用次數</TableColumn>
                  <TableColumn className="bg-blue-100">當月產能</TableColumn>
                  <TableColumn className="bg-red-100">最低庫存</TableColumn>
                  <TableColumn className="bg-yellow-100">最高庫存</TableColumn>
                  <TableColumn className="bg-pink-100">最高庫存总數</TableColumn>
                  <TableColumn className="bg-purple-100">當月需求/站</TableColumn>
                  <TableColumn className="bg-gray-100">備註</TableColumn>
                  <TableColumn>操作</TableColumn>
                </TableHeader>
                <TableBody>
                  {items
                    .filter((item) => showHiddenAndorItems || !item.isHidden)
                    .map((item, index) => (
                      <TableRow 
                        key={`${item.id}-${index}`}
                        className={item.isHidden ? "opacity-50 bg-gray-50" : ""}
                      >
                        <TableCell>{item.no}</TableCell>
                        <TableCell>{item.materialName}</TableCell>
                        <TableCell>{item.usageStation}</TableCell>
                        <TableCell>{item.usagePerSet}</TableCell>
                        <TableCell>{item.usageCount.toLocaleString()}</TableCell>
                        <TableCell>
                          {item.monthlyCapacity.toLocaleString()}
                        </TableCell>
                        <TableCell>{item.minInventory}</TableCell>
                        <TableCell>{item.maxInventory}</TableCell>
                        <TableCell>{item.maxTotalInventory}</TableCell>
                        <TableCell>{item.monthlyDemand}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              color={item.isHidden ? "success" : "warning"}
                              variant="flat"
                              onClick={() => handleToggleAndorItemVisibility(item.id)}
                            >
                              {item.isHidden ? "顯示" : "隱藏"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  };

  // B453 Tab组件
  const B453Tab = () => {
    const [activeB453Tab, setActiveB453Tab] = useState("management");

    // 计算关联统计
    const linkedManagementCount = b453Data.filter(
      (item) => item.hasCalculation,
    ).length;
    const linkedCalculationCount = b453CalculationData.filter(
      (item) => item.managementId,
    ).length;
    const totalManagementCount = b453Data.length;
    const totalCalculationCount = b453CalculationData.length;

    return (
      <div className="flex flex-col gap-6">
        {/* 🔗 关联状态概览 */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 shadow-lg">
          <CardBody>
            <h3 className="text-lg font-bold text-blue-800 mb-3">
              🔗 數據關聯狀態
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {linkedManagementCount}/{totalManagementCount}
                </div>
                <div className="text-sm text-gray-600">管控表已關聯</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${totalManagementCount > 0 ? (linkedManagementCount / totalManagementCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {linkedCalculationCount}/{totalCalculationCount}
                </div>
                <div className="text-sm text-gray-600">計算表已關聯</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${totalCalculationCount > 0 ? (linkedCalculationCount / totalCalculationCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.min(linkedManagementCount, linkedCalculationCount)}
                </div>
                <div className="text-sm text-gray-600">雙向關聯對</div>
              </div>
              <div className="text-center">
                <Button
                  color="secondary"
                  size="sm"
                  variant="flat"
                  onClick={() => {
                    // 自动关联功能 - 基于物料名称匹配
                    const updatedManagement = [...b453Data];
                    const updatedCalculation = [...b453CalculationData];

                    b453Data.forEach((mgmt) => {
                      if (!mgmt.hasCalculation) {
                        const matchingCalc = b453CalculationData.find(
                          (calc) =>
                            !calc.managementId &&
                            calc.materialName.includes(
                              mgmt.materialDescription.substring(0, 20),
                            ),
                        );

                        if (matchingCalc) {
                          const mgmtIndex = updatedManagement.findIndex(
                            (m) => m.id === mgmt.id,
                          );
                          const calcIndex = updatedCalculation.findIndex(
                            (c) => c.id === matchingCalc.id,
                          );

                          updatedManagement[mgmtIndex] = {
                            ...mgmt,
                            calculationId: matchingCalc.id,
                            hasCalculation: true,
                          };

                          updatedCalculation[calcIndex] = {
                            ...matchingCalc,
                            managementId: mgmt.id,
                            linkedMaterial: mgmt.materialDescription,
                            unitPrice: mgmt.unitPrice,
                            moq: mgmt.moq,
                          };
                        }
                      }
                    });

                    setB453Data(updatedManagement);
                    setB453CalculationData(updatedCalculation);
                  }}
                >
                  🤖 智能關聯
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* B453子标签页 */}
        <Tabs
          color="secondary"
          selectedKey={activeB453Tab}
          size="md"
          variant="underlined"
          onSelectionChange={(key) => setActiveB453Tab(key as string)}
        >
          <Tab key="management" title="📋 管控表">
            <div className="flex flex-col gap-6">
              {/* 统计信息 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {b453Data.length}
                    </div>
                    <div className="text-sm text-gray-600">總項目數</div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {formatPrice(
                        b453Data.reduce(
                          (total, item) =>
                            total +
                            item.unitPrice *
                              getB453DataField(item, "demand", selectedMonth),
                          0,
                        ),
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedMonth}月總需求金額
                    </div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {b453Data.reduce((total, item) => total + item.moq, 0)}
                    </div>
                    <div className="text-sm text-gray-600">總MOQ數量</div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {b453Data.reduce(
                        (total, item) =>
                          total +
                          getB453DataField(item, "demand", selectedMonth),
                        0,
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedMonth}月總需求量
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    color="primary"
                    startContent={<PlusIcon />}
                    onClick={() => setShowB453AddModal(true)}
                  >
                    添加耗材項目
                  </Button>
                  <Button
                    color="success"
                    startContent={<DownloadIcon />}
                    variant="flat"
                    onClick={handleB453Export}
                  >
                    導出Excel管控表
                  </Button>
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={handleShowHiddenB453Items}
                  >
                    {showHiddenB453Items ? "隱藏已隱藏項目" : "顯示已隱藏項目"}
                  </Button>
                </div>
                <Badge color="secondary" size="lg" variant="flat">
                  B453 SMT ATE管控表
                </Badge>
              </div>

              {/* B453 SMT ATE耗材管控表格 */}
              <Card className="shadow-lg">
                <CardBody>
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">
                      📋 TE課B453 SMT ATE {selectedYear}年{selectedMonth}
                      月份耗材管控表
                    </h3>
                    <p className="text-sm text-gray-600">
                      專業設備耗材管控 - 支持多級表頭與月度庫存需求分析
                    </p>
                  </div>

                  <Table
                    aria-label="B453 SMT ATE耗材管控表"
                    className="min-w-full"
                  >
                    <TableHeader>
                      <TableColumn className="bg-orange-100">序號</TableColumn>
                      <TableColumn className="bg-red-100">物料描述</TableColumn>
                      <TableColumn className="bg-red-100">單位</TableColumn>
                      <TableColumn className="bg-red-100">採購員</TableColumn>
                      <TableColumn className="bg-red-100">
                        單價(RMB)
                      </TableColumn>
                      <TableColumn className="bg-purple-100">
                        安全庫存-最低
                      </TableColumn>
                      <TableColumn className="bg-purple-100">
                        安全庫存-最高
                      </TableColumn>
                      <TableColumn className="bg-orange-100">
                        最小采购量(MOQ)
                      </TableColumn>
                      <TableColumn className="bg-orange-100">
                        L/T(Wks)
                      </TableColumn>
                      <TableColumn className="bg-blue-100">
                        {selectedYear}/
                        {selectedMonth - 3 > 0
                          ? selectedMonth - 3
                          : selectedMonth + 9}
                        /1庫存
                      </TableColumn>
                      <TableColumn className="bg-green-100">
                        {selectedMonth - 2 > 0
                          ? selectedMonth - 2
                          : selectedMonth + 10}
                        月需求
                      </TableColumn>
                      <TableColumn className="bg-blue-100">
                        {selectedYear}/
                        {selectedMonth - 2 > 0
                          ? selectedMonth - 2
                          : selectedMonth + 10}
                        /22庫存
                      </TableColumn>
                      <TableColumn className="bg-green-100">
                        {selectedMonth - 1 > 0
                          ? selectedMonth - 1
                          : selectedMonth + 11}
                        月需求
                      </TableColumn>
                      <TableColumn className="bg-blue-100">
                        {selectedYear}/
                        {selectedMonth - 1 > 0
                          ? selectedMonth - 1
                          : selectedMonth + 11}
                        /23庫存
                      </TableColumn>
                      <TableColumn className="bg-yellow-100">
                        {selectedMonth}月需求
                      </TableColumn>
                      <TableColumn className="bg-blue-100">
                        {selectedYear}/{selectedMonth}/20庫存
                      </TableColumn>
                      <TableColumn className="bg-green-100">
                        {selectedMonth + 1 <= 12
                          ? selectedMonth + 1
                          : selectedMonth - 11}
                        月需求
                      </TableColumn>
                      <TableColumn className="bg-purple-100">
                        PR開立時間與數量
                      </TableColumn>
                      <TableColumn className="bg-purple-100">
                        {selectedYear}/{selectedMonth}/19
                      </TableColumn>
                      <TableColumn className="bg-purple-100">
                        {selectedYear}/{selectedMonth}/25
                      </TableColumn>
                      <TableColumn className="bg-gray-100">備註</TableColumn>
                      <TableColumn className="bg-yellow-100">
                        關聯狀態
                      </TableColumn>
                      <TableColumn>操作</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {b453Data
                        .filter((item) => showHiddenB453Items || !item.isHidden)
                        .map((item, index) => (
                          <TableRow
                            key={`${item.id}-${index}`}
                            id={`mgmt-row-${item.id}`}
                            className={item.isHidden ? "opacity-50 bg-gray-50" : ""}
                          >
                          <TableCell>{item.serialNumber}</TableCell>
                          <TableCell>{item.materialDescription}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.purchaser}</TableCell>
                          <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                          <TableCell>{item.minSafetyStock}</TableCell>
                          <TableCell>{item.maxSafetyStock}</TableCell>
                          <TableCell>{item.moq}</TableCell>
                          <TableCell>{item.leadTimeWeeks} 週</TableCell>
                          <TableCell>
                            {getB453DataField(item, "stock", 4)}
                          </TableCell>
                          <TableCell>
                            {getB453DataField(item, "demand", 5)}
                          </TableCell>
                          <TableCell>
                            {getB453DataField(item, "stock", 5)}
                          </TableCell>
                          <TableCell>
                            {getB453DataField(item, "demand", 6)}
                          </TableCell>
                          <TableCell>
                            {getB453DataField(item, "stock", 6)}
                          </TableCell>
                          <TableCell>
                            {getB453DataField(item, "demand", 7)}
                          </TableCell>
                          <TableCell>
                            {getB453DataField(item, "stock", 7)}
                          </TableCell>
                          <TableCell>
                            {getB453DataField(item, "demand", 8)}
                          </TableCell>
                          <TableCell>PR開立時間與數量</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>{item.remark}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                color={item.isHidden ? "success" : "warning"}
                                variant="flat"
                                onClick={() => handleToggleB453ItemVisibility(item.id)}
                              >
                                {item.isHidden ? "顯示" : "隱藏"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="calculation" title="🧮 需求計算">
            <div className="flex flex-col gap-6">
              {/* 计算表统计信息 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {b453CalculationData.length}
                    </div>
                    <div className="text-sm text-gray-600">計算項目數</div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {b453CalculationData.reduce(
                        (total, item) => total + item.monthlyTotalDemand,
                        0,
                      )}
                    </div>
                    <div className="text-sm text-gray-600">總當月需求/站</div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {b453CalculationData.reduce(
                        (total, item) => total + item.actualStock,
                        0,
                      )}
                    </div>
                    <div className="text-sm text-gray-600">總實際訂購</div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {b453ForecastData.jul25.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">7月產能</div>
                  </CardBody>
                </Card>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    color="primary"
                    startContent={<PlusIcon />}
                    onClick={() => setShowB453CalcAddModal(true)}
                  >
                    添加計算項目
                  </Button>
                  <Button
                    color="success"
                    startContent={<DownloadIcon />}
                    variant="flat"
                    onClick={handleB453CalcExport}
                  >
                    導出Excel計算表
                  </Button>
                  <Button
                    color="warning"
                    variant="flat"
                    onClick={handleShowHiddenB453CalcItems}
                  >
                    {showHiddenB453CalcItems ? "隱藏已隱藏項目" : "顯示已隱藏項目"}
                  </Button>
                </div>
                <Badge color="secondary" size="lg" variant="flat">
                  B453 需求計算表
                </Badge>
              </div>

              {/* 🧮 统一计算公式说明 */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardBody>
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">
                    🧮 統一計算公式 - B453需求計算
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-green-200">
                      <strong className="text-green-600">當月需求/站</strong>
                      <br />= 當月產能 × 每臺機用量 ÷ 使用次數
                    </div>
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <strong className="text-orange-600">當月總需求</strong>
                      <br />= 當月需求/站 - 最低庫存數量
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* 🔗 关联功能说明 */}
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardBody>
                  <h3 className="text-lg font-semibold mb-3 text-orange-800">
                    🔗 關聯功能說明
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <strong className="text-blue-600">🔗 關聯按鈕</strong>
                      <br />
                      點擊可跳轉到關聯的表格並高亮顯示
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <strong className="text-green-600">➕ 創建關聯</strong>
                      <br />
                      為未關聯項目創建對應的表格記錄
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-200">
                      <strong className="text-purple-600">🔄 同步數據</strong>
                      <br />
                      將管控表的基本信息同步到計算表
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* B453耗材需求计算表格 */}
              <Card className="shadow-lg">
                <CardBody>
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                    <h3 className="text-lg font-bold text-green-800 mb-2">
                      🧮 TE課B453 SMT ATE 2025年7月份耗材需求計算
                    </h3>
                    <p className="text-sm text-gray-600">
                      自動計算耗材需求量 - 基於產能與使用參數
                    </p>
                  </div>

                  <Table aria-label="B453耗材需求計算表" className="min-w-full">
                    <TableHeader>
                      <TableColumn className="bg-orange-100">No.</TableColumn>
                      <TableColumn>耗材名稱</TableColumn>
                      <TableColumn>使用站別</TableColumn>
                      <TableColumn>每臺機用量</TableColumn>
                      <TableColumn>使用次數</TableColumn>
                      <TableColumn>當月產能</TableColumn>
                      <TableColumn>最低庫存數</TableColumn>
                      <TableColumn>最低庫存總數</TableColumn>
                      <TableColumn>最高庫存數</TableColumn>
                      <TableColumn>最高庫存總數</TableColumn>
                      <TableColumn>當月需求/站</TableColumn>
                      <TableColumn>當月總需求</TableColumn>
                      <TableColumn>實際請購數量</TableColumn>
                      <TableColumn>備註(MOQ)</TableColumn>
                      <TableColumn>操作</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {b453CalculationData
                        .filter((item) => showHiddenB453CalcItems || !item.isHidden)
                        .map((item, index) => {
                          const calculatedItem = updateB453Calculations(item);

                          return (
                            <TableRow 
                              key={`${item.id}-${index}`}
                              className={item.isHidden ? "opacity-50 bg-gray-50" : ""}
                            >
                            <TableCell>{calculatedItem.no}</TableCell>
                            <TableCell>{calculatedItem.materialName}</TableCell>
                            <TableCell>{calculatedItem.usageStation}</TableCell>
                            <TableCell>
                              {calculatedItem.usagePerMachine}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.usageCount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.monthlyCapacity.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.minStock.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.minTotalStock.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.maxStock.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.maxTotalStock.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.monthlyDemandPerStation.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.monthlyTotalDemand.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {calculatedItem.actualStock.toLocaleString()}
                            </TableCell>
                            <TableCell>{calculatedItem.moqRemark}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  color={item.isHidden ? "success" : "warning"}
                                  variant="flat"
                                  onClick={() => handleToggleB453CalcItemVisibility(item.id)}
                                >
                                  {item.isHidden ? "顯示" : "隱藏"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>

              {/* 产能预测表 */}
              <Card className="shadow-lg">
                <CardBody>
                  <h3 className="text-lg font-bold text-purple-800 mb-4">
                    📈 產能預測數據
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Input
                      label="Mar-24"
                      type="number"
                      value={b453ForecastData.mar24.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          mar24: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Oct-24"
                      type="number"
                      value={b453ForecastData.oct24.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          oct24: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Dec-24"
                      type="number"
                      value={b453ForecastData.dec24.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          dec24: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Jan-25"
                      type="number"
                      value={b453ForecastData.jan25.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          jan25: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Feb-25"
                      type="number"
                      value={b453ForecastData.feb25.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          feb25: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Mar-25"
                      type="number"
                      value={b453ForecastData.mar25.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          mar25: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Apr-25"
                      type="number"
                      value={b453ForecastData.apr25.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          apr25: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="May-25"
                      type="number"
                      value={b453ForecastData.may25.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          may25: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Jun-25"
                      type="number"
                      value={b453ForecastData.jun25.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          jun25: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Jul-25"
                      type="number"
                      value={b453ForecastData.jul25.toString()}
                      onValueChange={(value) =>
                        setB453ForecastData({
                          ...b453ForecastData,
                          jul25: parseInt(value) || 0,
                        })
                      }
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  };

  // B482 & Andor 合并Tab组件
  const B482AndorTab = () => {
    const [activeB482AndorTab, setActiveB482AndorTab] = useState("b482");

    return (
      <div className="flex flex-col gap-6">
        {/* B482 & Andor子标签页 */}
        <Tabs
          color="primary"
          selectedKey={activeB482AndorTab}
          size="md"
          variant="underlined"
          onSelectionChange={(key) => setActiveB482AndorTab(key as string)}
        >
          <Tab key="b482" title="📋 B482申請表">
            <B482Tab />
          </Tab>

          <Tab key="andor" title="🧮 Andor需求計算">
            <AndorTab />
          </Tab>
        </Tabs>
      </div>
    );
  };

  // 生成年份选项（前后5年）
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // 生成月份选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // 辅助函数：根据选择的年份获取B453数据字段
  const getB453DataField = (
    item: B453SupplyItem,
    fieldType: "stock" | "demand",
    month: number,
  ) => {
    const year = selectedYear;
    const monthNames = ["apr", "may", "jun", "jul", "aug"];

    // 计算相对于目标月份的偏移
    const targetMonth = selectedMonth;
    const monthOffset = month - targetMonth;
    const monthIndex = 2 + monthOffset; // 2是jul在数组中的索引

    if (monthIndex < 0 || monthIndex >= monthNames.length) {
      return 0; // 超出范围的月份返回0
    }

    const monthName = monthNames[monthIndex];

    if (fieldType === "stock") {
      const fieldName = `${monthName}${year}Stock` as keyof B453SupplyItem;

      return (item[fieldName] as number) || 0;
    } else {
      const fieldName = `${monthName}${year}Demand` as keyof B453SupplyItem;

      return (item[fieldName] as number) || 0;
    }
  };

  // 渲染日期选择和导出按钮
  const renderDateSelector = () => (
    <Card>
      <CardHeader>选择导出日期</CardHeader>
      <CardBody className="flex space-x-4 items-center">
        <div className="flex items-center space-x-2">
          <span>年份：</span>
          <Select
            selectedKeys={new Set([selectedYear.toString()])}
            onSelectionChange={(keys) => {
              const year = parseInt(Array.from(keys)[0] as string);

              setSelectedYear(year);
            }}
          >
            {yearOptions.map((year) => (
              <SelectItem key={year.toString()} textValue={year.toString()}>
                {year}年
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span>月份：</span>
          <Select
            selectedKeys={new Set([selectedMonth.toString()])}
            onSelectionChange={(keys) => {
              const month = parseInt(Array.from(keys)[0] as string);

              setSelectedMonth(month);
            }}
          >
            {monthOptions.map((month) => (
              <SelectItem key={month.toString()} textValue={month.toString()}>
                {month}月
              </SelectItem>
            ))}
          </Select>
        </div>

        <Button color="primary" onPress={handleB453Export}>
          导出B453表格
        </Button>
      </CardBody>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6 py-8 px-4 md:px-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className={title()}>耗材管理系統</h1>
        <p className="text-gray-600 mt-2">
          B482申請表 & Andor需求計算 & B453 SMT ATE管控表
        </p>
      </div>

      {/* Tab切换 */}
      <Tabs
        color="primary"
        selectedKey={activeTab}
        size="lg"
        variant="bordered"
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab key="b482-andor" title="B482 & Andor 申請系統">
          <B482AndorTab />
        </Tab>
        <Tab key="b453" title="B453 SMT ATE">
          <B453Tab />
        </Tab>
      </Tabs>

      {renderDateSelector()}

      {/* B482添加模态框 */}
      <Modal
        isOpen={showB482AddModal}
        size="5xl"
        onClose={() => setShowB482AddModal(false)}
      >
        <ModalContent>
          <ModalHeader>添加B482項目</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="序號"
                type="number"
                value={newB482Item.serialNumber?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    serialNumber: parseInt(value) || 0,
                  })
                }
              />
              <Select
                label="單位"
                selectedKeys={[newB482Item.unit || "pcs"]}
                onSelectionChange={(keys) => {
                  const unit = Array.from(keys)[0] as string;

                  setNewB482Item({ ...newB482Item, unit });
                }}
              >
                <SelectItem key="pcs">pcs</SelectItem>
                <SelectItem key="支">支</SelectItem>
                <SelectItem key="個">個</SelectItem>
                <SelectItem key="條">條</SelectItem>
              </Select>
              <Input
                className="md:col-span-2"
                label="物料描述"
                value={newB482Item.materialDescription || ""}
                onValueChange={(value) =>
                  setNewB482Item({ ...newB482Item, materialDescription: value })
                }
              />
              <Input
                label="採購員"
                value={newB482Item.purchaser || ""}
                onValueChange={(value) =>
                  setNewB482Item({ ...newB482Item, purchaser: value })
                }
              />
              <Input
                label="單價(RMB)"
                type="number"
                value={newB482Item.unitPrice?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    unitPrice: parseFloat(value) || 0,
                  })
                }
              />
              <Input
                label="最高安全庫存"
                type="number"
                value={newB482Item.maxSafetyStock?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    maxSafetyStock: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="最低安全庫存"
                type="number"
                value={newB482Item.minSafetyStock?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    minSafetyStock: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="最小採購量(MOQ)"
                type="number"
                value={newB482Item.moq?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({ ...newB482Item, moq: parseInt(value) || 0 })
                }
              />
              <Input
                label="未採購量(RMB)"
                type="number"
                value={newB482Item.unpurchasedAmount?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    unpurchasedAmount: parseFloat(value) || 0,
                  })
                }
              />
              <Input
                label="L/T(Day)"
                type="number"
                value={newB482Item.leadTime?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    leadTime: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="2025年6月份"
                type="number"
                value={newB482Item.june2025?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    june2025: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="2025年7月份"
                type="number"
                value={newB482Item.july2025?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    july2025: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="7月M1"
                type="number"
                value={newB482Item.julyM1?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    julyM1: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="7月M2"
                type="number"
                value={newB482Item.julyM2?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    julyM2: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="7月M3"
                type="number"
                value={newB482Item.julyM3?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    julyM3: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="7月M4"
                type="number"
                value={newB482Item.julyM4?.toString() || ""}
                onValueChange={(value) =>
                  setNewB482Item({
                    ...newB482Item,
                    julyM4: parseInt(value) || 0,
                  })
                }
              />
              <Textarea
                className="md:col-span-2"
                label="備註"
                value={newB482Item.remark || ""}
                onValueChange={(value) =>
                  setNewB482Item({ ...newB482Item, remark: value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => setShowB482AddModal(false)}
            >
              取消
            </Button>
            <Button color="primary" onClick={handleAddB482Item}>
              添加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* B482编辑模态框 */}
      <Modal
        isOpen={showB482EditModal}
        size="5xl"
        onClose={() => setShowB482EditModal(false)}
      >
        <ModalContent>
          <ModalHeader>編輯B482項目</ModalHeader>
          <ModalBody>
            {editingB482Item && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="序號"
                  type="number"
                  value={editingB482Item.serialNumber.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      serialNumber: parseInt(value) || 0,
                    })
                  }
                />
                <Select
                  label="單位"
                  selectedKeys={[editingB482Item.unit]}
                  onSelectionChange={(keys) => {
                    const unit = Array.from(keys)[0] as string;

                    setEditingB482Item({ ...editingB482Item, unit });
                  }}
                >
                  <SelectItem key="pcs">pcs</SelectItem>
                  <SelectItem key="支">支</SelectItem>
                  <SelectItem key="個">個</SelectItem>
                  <SelectItem key="條">條</SelectItem>
                </Select>
                <Input
                  className="md:col-span-2"
                  label="物料描述"
                  value={editingB482Item.materialDescription}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      materialDescription: value,
                    })
                  }
                />
                <Input
                  label="採購員"
                  value={editingB482Item.purchaser}
                  onValueChange={(value) =>
                    setEditingB482Item({ ...editingB482Item, purchaser: value })
                  }
                />
                <Input
                  label="單價(RMB)"
                  type="number"
                  value={editingB482Item.unitPrice.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      unitPrice: parseFloat(value) || 0,
                    })
                  }
                />
                <Input
                  label="最高安全庫存"
                  type="number"
                  value={editingB482Item.maxSafetyStock.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      maxSafetyStock: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="最低安全庫存"
                  type="number"
                  value={editingB482Item.minSafetyStock.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      minSafetyStock: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="最小採購量(MOQ)"
                  type="number"
                  value={editingB482Item.moq.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      moq: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="未採購量(RMB)"
                  type="number"
                  value={editingB482Item.unpurchasedAmount.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      unpurchasedAmount: parseFloat(value) || 0,
                    })
                  }
                />
                <Input
                  label="L/T(Day)"
                  type="number"
                  value={editingB482Item.leadTime.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      leadTime: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="2025年6月份"
                  type="number"
                  value={editingB482Item.june2025.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      june2025: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="2025年7月份"
                  type="number"
                  value={editingB482Item.july2025.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      july2025: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="7月M1"
                  type="number"
                  value={editingB482Item.julyM1.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      julyM1: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="7月M2"
                  type="number"
                  value={editingB482Item.julyM2.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      julyM2: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="7月M3"
                  type="number"
                  value={editingB482Item.julyM3.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      julyM3: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="7月M4"
                  type="number"
                  value={editingB482Item.julyM4.toString()}
                  onValueChange={(value) =>
                    setEditingB482Item({
                      ...editingB482Item,
                      julyM4: parseInt(value) || 0,
                    })
                  }
                />
                <Textarea
                  className="md:col-span-2"
                  label="備註"
                  value={editingB482Item.remark}
                  onValueChange={(value) =>
                    setEditingB482Item({ ...editingB482Item, remark: value })
                  }
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => setShowB482EditModal(false)}
            >
              取消
            </Button>
            <Button color="primary" onClick={handleSaveB482Edit}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Andor添加模态框 */}
      <Modal
        isOpen={showAndorAddModal}
        size="4xl"
        onClose={() => setShowAndorAddModal(false)}
      >
        <ModalContent>
          <ModalHeader>添加Andor項目</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="月份"
                selectedKeys={[newAndorItem.month || "2025.7"]}
                onSelectionChange={(keys) => {
                  const month = Array.from(keys)[0] as string;

                  setNewAndorItem({ ...newAndorItem, month });
                }}
              >
                <SelectItem key="2025.7">2025.7</SelectItem>
                <SelectItem key="2025.8">2025.8</SelectItem>
                <SelectItem key="2025.9">2025.9</SelectItem>
              </Select>
              <Input
                label="No."
                type="number"
                value={newAndorItem.no?.toString() || ""}
                onValueChange={(value) =>
                  setNewAndorItem({ ...newAndorItem, no: parseInt(value) || 0 })
                }
              />
              <Input
                className="md:col-span-2"
                label="耗材名稱"
                value={newAndorItem.materialName || ""}
                onValueChange={(value) =>
                  setNewAndorItem({ ...newAndorItem, materialName: value })
                }
              />
              <Input
                label="使用站別"
                value={newAndorItem.usageStation || ""}
                onValueChange={(value) =>
                  setNewAndorItem({ ...newAndorItem, usageStation: value })
                }
              />
              <Input
                label="每臺機用量"
                type="number"
                value={newAndorItem.usagePerSet?.toString() || ""}
                onValueChange={(value) =>
                  setNewAndorItem({
                    ...newAndorItem,
                    usagePerSet: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="使用次數"
                type="number"
                value={newAndorItem.usageCount?.toString() || ""}
                onValueChange={(value) =>
                  setNewAndorItem({
                    ...newAndorItem,
                    usageCount: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="當月產能"
                type="number"
                value={newAndorItem.monthlyCapacity?.toString() || ""}
                onValueChange={(value) =>
                  setNewAndorItem({
                    ...newAndorItem,
                    monthlyCapacity: parseInt(value) || 0,
                  })
                }
              />
              <Textarea
                className="md:col-span-2"
                label="備註"
                value={newAndorItem.remark || ""}
                onValueChange={(value) =>
                  setNewAndorItem({ ...newAndorItem, remark: value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => setShowAndorAddModal(false)}
            >
              取消
            </Button>
            <Button color="primary" onClick={handleAddAndorItem}>
              添加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Andor编辑模态框 */}
      <Modal
        isOpen={showAndorEditModal}
        size="4xl"
        onClose={() => setShowAndorEditModal(false)}
      >
        <ModalContent>
          <ModalHeader>編輯Andor項目</ModalHeader>
          <ModalBody>
            {editingAndorItem && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="月份"
                  selectedKeys={[editingAndorItem.month]}
                  onSelectionChange={(keys) => {
                    const month = Array.from(keys)[0] as string;

                    setEditingAndorItem({ ...editingAndorItem, month });
                  }}
                >
                  <SelectItem key="2025.7">2025.7</SelectItem>
                  <SelectItem key="2025.8">2025.8</SelectItem>
                  <SelectItem key="2025.9">2025.9</SelectItem>
                </Select>
                <Input
                  label="No."
                  type="number"
                  value={editingAndorItem.no.toString()}
                  onValueChange={(value) =>
                    setEditingAndorItem({
                      ...editingAndorItem,
                      no: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  className="md:col-span-2"
                  label="耗材名稱"
                  value={editingAndorItem.materialName}
                  onValueChange={(value) =>
                    setEditingAndorItem({
                      ...editingAndorItem,
                      materialName: value,
                    })
                  }
                />
                <Input
                  label="使用站別"
                  value={editingAndorItem.usageStation}
                  onValueChange={(value) =>
                    setEditingAndorItem({
                      ...editingAndorItem,
                      usageStation: value,
                    })
                  }
                />
                <Input
                  label="每臺機用量"
                  type="number"
                  value={editingAndorItem.usagePerSet.toString()}
                  onValueChange={(value) =>
                    setEditingAndorItem({
                      ...editingAndorItem,
                      usagePerSet: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="使用次數"
                  type="number"
                  value={editingAndorItem.usageCount.toString()}
                  onValueChange={(value) =>
                    setEditingAndorItem({
                      ...editingAndorItem,
                      usageCount: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="當月產能"
                  type="number"
                  value={editingAndorItem.monthlyCapacity.toString()}
                  onValueChange={(value) =>
                    setEditingAndorItem({
                      ...editingAndorItem,
                      monthlyCapacity: parseInt(value) || 0,
                    })
                  }
                />
                <div className="md:col-span-2 grid grid-cols-3 gap-4">
                  <Input
                    isReadOnly
                    description="自動計算"
                    label="最低庫存"
                    type="number"
                    value={editingAndorItem.minInventory.toString()}
                  />
                  <Input
                    isReadOnly
                    description="自動計算"
                    label="最高庫存"
                    type="number"
                    value={editingAndorItem.maxInventory.toString()}
                  />
                  <Input
                    isReadOnly
                    description="自動計算"
                                            label="當月需求/站"
                    type="number"
                    value={editingAndorItem.monthlyDemand.toString()}
                  />
                </div>
                <Textarea
                  className="md:col-span-2"
                  label="備註"
                  value={editingAndorItem.remark}
                  onValueChange={(value) =>
                    setEditingAndorItem({ ...editingAndorItem, remark: value })
                  }
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => setShowAndorEditModal(false)}
            >
              取消
            </Button>
            <Button color="primary" onClick={handleSaveAndorEdit}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* B453添加模态框 */}
      <Modal
        isOpen={showB453AddModal}
        size="5xl"
        onClose={() => setShowB453AddModal(false)}
      >
        <ModalContent>
          <ModalHeader>添加B453項目</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="序號"
                type="number"
                value={newB453Item.serialNumber?.toString() || ""}
                onValueChange={(value) =>
                  setNewB453Item({
                    ...newB453Item,
                    serialNumber: parseInt(value) || 0,
                  })
                }
              />
              <Select
                label="單位"
                selectedKeys={[newB453Item.unit || "pcs"]}
                onSelectionChange={(keys) => {
                  const unit = Array.from(keys)[0] as string;

                  setNewB453Item({ ...newB453Item, unit });
                }}
              >
                <SelectItem key="pcs">pcs</SelectItem>
                <SelectItem key="支">支</SelectItem>
                <SelectItem key="個">個</SelectItem>
                <SelectItem key="條">條</SelectItem>
              </Select>
              <Input
                className="md:col-span-2"
                label="物料描述"
                value={newB453Item.materialDescription || ""}
                onValueChange={(value) =>
                  setNewB453Item({ ...newB453Item, materialDescription: value })
                }
              />
              <Input
                label="採購員"
                value={newB453Item.purchaser || ""}
                onValueChange={(value) =>
                  setNewB453Item({ ...newB453Item, purchaser: value })
                }
              />
              <Input
                label="單價(RMB)"
                type="number"
                value={newB453Item.unitPrice?.toString() || ""}
                onValueChange={(value) =>
                  setNewB453Item({
                    ...newB453Item,
                    unitPrice: parseFloat(value) || 0,
                  })
                }
              />
              <Input
                label="安全庫存-最低"
                type="number"
                value={newB453Item.minSafetyStock?.toString() || ""}
                onValueChange={(value) =>
                  setNewB453Item({
                    ...newB453Item,
                    minSafetyStock: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="安全庫存-最高"
                type="number"
                value={newB453Item.maxSafetyStock?.toString() || ""}
                onValueChange={(value) =>
                  setNewB453Item({
                    ...newB453Item,
                    maxSafetyStock: parseInt(value) || 0,
                  })
                }
              />
              <Input
                label="最小采购量(MOQ)"
                type="number"
                value={newB453Item.moq?.toString() || ""}
                onValueChange={(value) =>
                  setNewB453Item({ ...newB453Item, moq: parseInt(value) || 0 })
                }
              />
              <Input
                label="L/T(Wks)"
                type="number"
                value={newB453Item.leadTimeWeeks?.toString() || ""}
                onValueChange={(value) =>
                  setNewB453Item({
                    ...newB453Item,
                    leadTimeWeeks: parseInt(value) || 0,
                  })
                }
              />
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-blue-600">
                  月度明細數據
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    label="2025/4/1庫存"
                    type="number"
                    value={newB453Item.apr2025Stock?.toString() || ""}
                    onValueChange={(value) =>
                      setNewB453Item({
                        ...newB453Item,
                        apr2025Stock: parseInt(value) || 0,
                      })
                    }
                  />
                  <Input
                    label="5月需求"
                    type="number"
                    value={newB453Item.may2025Demand?.toString() || ""}
                    onValueChange={(value) =>
                      setNewB453Item({
                        ...newB453Item,
                        may2025Demand: parseInt(value) || 0,
                      })
                    }
                  />
                  <Input
                    label="2025/5/22庫存"
                    type="number"
                    value={newB453Item.may2025Stock?.toString() || ""}
                    onValueChange={(value) =>
                      setNewB453Item({
                        ...newB453Item,
                        may2025Stock: parseInt(value) || 0,
                      })
                    }
                  />
                  <Input
                    label="6月需求"
                    type="number"
                    value={newB453Item.jun2025Demand?.toString() || ""}
                    onValueChange={(value) =>
                      setNewB453Item({
                        ...newB453Item,
                        jun2025Demand: parseInt(value) || 0,
                      })
                    }
                  />
                  <Input
                    label="2025/6/23庫存"
                    type="number"
                    value={newB453Item.jun2025Stock?.toString() || ""}
                    onValueChange={(value) =>
                      setNewB453Item({
                        ...newB453Item,
                        jun2025Stock: parseInt(value) || 0,
                      })
                    }
                  />
                  <Input
                    label="7月需求"
                    type="number"
                    value={newB453Item.jul2025Demand?.toString() || ""}
                    onValueChange={(value) =>
                      setNewB453Item({
                        ...newB453Item,
                        jul2025Demand: parseInt(value) || 0,
                      })
                    }
                  />
                  <Input
                    label="2025/7/20庫存"
                    type="number"
                    value={newB453Item.jul2025Stock?.toString() || ""}
                    onValueChange={(value) =>
                      setNewB453Item({
                        ...newB453Item,
                        jul2025Stock: parseInt(value) || 0,
                      })
                    }
                  />
                  <Input
                    label="8月需求"
                    type="number"
                    value={newB453Item.aug2025Demand?.toString() || ""}
                    onValueChange={(value) =>
                      setNewB453Item({
                        ...newB453Item,
                        aug2025Demand: parseInt(value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <Textarea
                className="md:col-span-2"
                label="備註"
                value={newB453Item.remark || ""}
                onValueChange={(value) =>
                  setNewB453Item({ ...newB453Item, remark: value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => setShowB453AddModal(false)}
            >
              取消
            </Button>
            <Button color="primary" onClick={handleAddB453Item}>
              添加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* B453编辑模态框 */}
      <Modal
        isOpen={showB453EditModal}
        size="5xl"
        onClose={() => setShowB453EditModal(false)}
      >
        <ModalContent>
          <ModalHeader>編輯B453項目</ModalHeader>
          <ModalBody>
            {editingB453Item && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="序號"
                  type="number"
                  value={editingB453Item.serialNumber.toString()}
                  onValueChange={(value) =>
                    setEditingB453Item({
                      ...editingB453Item,
                      serialNumber: parseInt(value) || 0,
                    })
                  }
                />
                <Select
                  label="單位"
                  selectedKeys={[editingB453Item.unit]}
                  onSelectionChange={(keys) => {
                    const unit = Array.from(keys)[0] as string;

                    setEditingB453Item({ ...editingB453Item, unit });
                  }}
                >
                  <SelectItem key="pcs">pcs</SelectItem>
                  <SelectItem key="支">支</SelectItem>
                  <SelectItem key="個">個</SelectItem>
                  <SelectItem key="條">條</SelectItem>
                </Select>
                <Input
                  className="md:col-span-2"
                  label="物料描述"
                  value={editingB453Item.materialDescription}
                  onValueChange={(value) =>
                    setEditingB453Item({
                      ...editingB453Item,
                      materialDescription: value,
                    })
                  }
                />
                <Input
                  label="採購員"
                  value={editingB453Item.purchaser}
                  onValueChange={(value) =>
                    setEditingB453Item({ ...editingB453Item, purchaser: value })
                  }
                />
                <Input
                  label="單價(RMB)"
                  type="number"
                  value={editingB453Item.unitPrice.toString()}
                  onValueChange={(value) =>
                    setEditingB453Item({
                      ...editingB453Item,
                      unitPrice: parseFloat(value) || 0,
                    })
                  }
                />
                <Input
                  label="安全庫存-最低"
                  type="number"
                  value={editingB453Item.minSafetyStock.toString()}
                  onValueChange={(value) =>
                    setEditingB453Item({
                      ...editingB453Item,
                      minSafetyStock: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="安全庫存-最高"
                  type="number"
                  value={editingB453Item.maxSafetyStock.toString()}
                  onValueChange={(value) =>
                    setEditingB453Item({
                      ...editingB453Item,
                      maxSafetyStock: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="最小采购量(MOQ)"
                  type="number"
                  value={editingB453Item.moq.toString()}
                  onValueChange={(value) =>
                    setEditingB453Item({
                      ...editingB453Item,
                      moq: parseInt(value) || 0,
                    })
                  }
                />
                <Input
                  label="L/T(Wks)"
                  type="number"
                  value={editingB453Item.leadTimeWeeks.toString()}
                  onValueChange={(value) =>
                    setEditingB453Item({
                      ...editingB453Item,
                      leadTimeWeeks: parseInt(value) || 0,
                    })
                  }
                />
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">
                    月度明細數據
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Input
                      label="2025/4/1庫存"
                      type="number"
                      value={editingB453Item.apr2025Stock.toString()}
                      onValueChange={(value) =>
                        setEditingB453Item({
                          ...editingB453Item,
                          apr2025Stock: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="5月需求"
                      type="number"
                      value={editingB453Item.may2025Demand.toString()}
                      onValueChange={(value) =>
                        setEditingB453Item({
                          ...editingB453Item,
                          may2025Demand: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="2025/5/22庫存"
                      type="number"
                      value={editingB453Item.may2025Stock.toString()}
                      onValueChange={(value) =>
                        setEditingB453Item({
                          ...editingB453Item,
                          may2025Stock: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="6月需求"
                      type="number"
                      value={editingB453Item.jun2025Demand.toString()}
                      onValueChange={(value) =>
                        setEditingB453Item({
                          ...editingB453Item,
                          jun2025Demand: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="2025/6/23庫存"
                      type="number"
                      value={editingB453Item.jun2025Stock.toString()}
                      onValueChange={(value) =>
                        setEditingB453Item({
                          ...editingB453Item,
                          jun2025Stock: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="7月需求"
                      type="number"
                      value={editingB453Item.jul2025Demand.toString()}
                      onValueChange={(value) =>
                        setEditingB453Item({
                          ...editingB453Item,
                          jul2025Demand: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="2025/7/20庫存"
                      type="number"
                      value={editingB453Item.jul2025Stock.toString()}
                      onValueChange={(value) =>
                        setEditingB453Item({
                          ...editingB453Item,
                          jul2025Stock: parseInt(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="8月需求"
                      type="number"
                      value={editingB453Item.aug2025Demand.toString()}
                      onValueChange={(value) =>
                        setEditingB453Item({
                          ...editingB453Item,
                          aug2025Demand: parseInt(value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <Textarea
                  className="md:col-span-2"
                  label="備註"
                  value={editingB453Item.remark}
                  onValueChange={(value) =>
                    setEditingB453Item({ ...editingB453Item, remark: value })
                  }
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => setShowB453EditModal(false)}
            >
              取消
            </Button>
            <Button color="primary" onClick={handleSaveB453Edit}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
