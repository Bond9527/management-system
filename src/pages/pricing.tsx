import React, { useState } from "react";
import { title } from "@/components/primitives";
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
  Tooltip,
  Badge,
  Tabs,
  Tab,
} from "@heroui/react";
import { PlusIcon, EditIcon, TrashIcon, DownloadIcon } from "@/components/icons";
import * as XLSX from 'xlsx';

// B482耗材管控申請表数据结构 - 根据正确的表格格式
interface B482SupplyItem {
  id: number;
  serialNumber: number;          // 序號
  materialDescription: string;   // 物料描述
  unit: string;                 // 單位
  purchaser: string;            // 採購員
  unitPrice: number;            // 單價(RMB)
  maxSafetyStock: number;       // 最高安全庫存
  minSafetyStock: number;       // 最低安全庫存
  moq: number;                  // 最小採購量(MOQ)
  unpurchasedAmount: number;    // 未採購量(RMB)
  leadTime: number;             // L/T(Day)
  june2025: number;             // 2025年6月份
  july2025: number;             // 2025年7月份
  julyM1: number;               // 7月M1
  julyM2: number;               // 7月M2
  julyM3: number;               // 7月M3
  julyM4: number;               // 7月M4
  remark: string;               // 備註
  // 🆕 新增计算参数 (可选)
  usagePerSet?: number;         // 每套機用量
  usageCount?: number;          // 使用次數
  monthlyCapacity?: number;     // 當月產能
  enableAutoCalculation?: boolean; // 是否启用自动计算
}

// Andor耗材需求计算数据结构
interface AndorSupplyItem {
  id: number;
  month: string;                    // 月份 (如 2025.7)
  no: number;                      // No.
  materialName: string;            // 耗材名稱
  usageStation: string;            // 使用站別
  usagePerSet: number;             // 每套機用量
  usageCount: number;              // 使用次數
  monthlyCapacity: number;         // 當月產能
  minInventory: number;            // 最低庫存
  maxInventory: number;            // 最高庫存
  monthlyDemand: number;           // 當月需求 (計算得出)
  remark: string;                  // 備註 (實際訂購數量)
}

// 产能预测数据结构
interface CapacityForecast {
  maxCapacity: number;             // 最高产能
  minCapacity: number;             // 最低产能
  apr24: number;                   // 4月-24
  may25: number;                   // 5月-25
  jun25: number;                   // 6月-25
  jul25: number;                   // 7月-25
}

// B453 SMT ATE耗材管控表数据结构
interface B453SupplyItem {
  id: number;
  serialNumber: number;       // 序號
  materialDescription: string; // 物料描述
  unit: string;              // 單位
  purchaser: string;         // 採購員
  unitPrice: number;         // 單價(RMB)
  minSafetyStock: number;    // 安全庫存-最低
  maxSafetyStock: number;    // 安全庫存-最高
  moq: number;               // 最小采购量(MOQ)
  leadTimeWeeks: number;     // L/T(Wks)
  // 月度明细数据 (库存+需求)
  apr2025Stock: number;      // 2025/4/1庫存
  may2025Demand: number;     // 2025年5月份需求
  may2025Stock: number;      // 2025/5/22庫存
  jun2025Demand: number;     // 2025年6月份需求
  jun2025Stock: number;      // 2025/6/23庫存
  jul2025Demand: number;     // 2025年7月份需求
  jul2025Stock: number;      // 2025/7/20庫存
  aug2025Demand: number;     // 2025年8月份需求
  remark: string;            // 備註
  // 🆕 新增计算关联字段
  calculationId?: number;    // 关联的计算表ID
  hasCalculation?: boolean;  // 是否有关联的计算表
}

// B453耗材需求计算表数据结构
interface B453CalculationItem {
  id: number;
  no: number;                 // No.
  materialName: string;       // 料材名稱
  usageStation: string;       // 使用站別
  usagePerSet: number;        // 每套機用量
  usageCount: number;         // 使用次數
  monthlyCapacity: number;    // 當月產能
  minStock: number;           // 最低庫存數量
  maxStock: number;           // 最高庫存數量
  monthlyDemand: number;      // 當月需求 (計算)
  monthlyNetDemand: number;   // 當月網路需求 (計算)
  actualOrder: number;        // 實際訂購數量
  moqRemark: string;          // 備註(MOQ)
  // 🆕 新增管控表关联字段
  managementId?: number;      // 关联的管控表ID
  linkedMaterial?: string;    // 关联的物料描述
  unitPrice?: number;         // 单价 (从管控表同步)
  moq?: number;               // MOQ (从管控表同步)
}

// B453产能预测数据结构
interface B453ForecastData {
  mar24: number;              // Mar-24
  oct24: number;              // Oct-24
  dec24: number;              // Dec-24
  jan25: number;              // Jan-25
  feb25: number;              // Feb-25
  mar25: number;              // Mar-25
  apr25: number;              // Apr-25
  may25: number;              // May-25
  jun25: number;              // Jun-25
  jul25: number;              // Jul-25
}

// 初始化B482数据 - 根据实际表格修正
const initialB482Data: B482SupplyItem[] = [
  {
    id: 1,
    serialNumber: 1,
    materialDescription: "故障排除線(SUB Batt SA測試夾具偵1.PRO.000556測試針)",  // 修正：更准确的物料描述
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
    enableAutoCalculation: true
  },
  {
    id: 2,
    serialNumber: 2,
    materialDescription: "故障排除線(A/P 測試夾具.塔/JI8-6000-B-60-BB-i/線材)",  // 修正：更准确的物料描述
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
    enableAutoCalculation: true
  }
];

// 初始化Andor耗材计算数据 - 根据实际表格修正
const initialAndorData: AndorSupplyItem[] = [
  {
    id: 1,
    month: "2025.7",
    no: 1,
    materialName: "3.PRO.000556/測試針",  // ✓ 与实际表格一致
    usageStation: "Batt SA",
    usagePerSet: 18,
    usageCount: 30000,
    monthlyCapacity: 497700,
    minInventory: 267,
    maxInventory: 416,
    monthlyDemand: 299,
    remark: "300 (MOQ:200)"
  },
  {
    id: 2,
    month: "2025.7",
    no: 2,
    materialName: "JI8-6000-B-60-BB-i/線材(HWTE線)",  // ✓ 与实际表格一致
    usageStation: "403-QT3",
    usagePerSet: 4,
    usageCount: 100000,
    monthlyCapacity: 497700,
    minInventory: 18,
    maxInventory: 28,
    monthlyDemand: 20,
    remark: "32 (MOQ:32)"
  },
  {
    id: 3,
    month: "2025.7",
    no: 2,
    materialName: "JI8-6000-B-60-BB-i/線材(HWTE線)",  // ✓ 与实际表格一致
    usageStation: "507-Gatekeeper",
    usagePerSet: 4,
    usageCount: 100000,
    monthlyCapacity: 497700,
    minInventory: 18,
    maxInventory: 28,
    monthlyDemand: 20,
    remark: ""
  }
];

// 产能预测数据 - 根据实际表格验证
const initialForecastData: CapacityForecast = {
  maxCapacity: 694000,  // ✓ 与实际表格一致
  minCapacity: 445000,  // ✓ 与实际表格一致
  apr24: 694000,        // ✓ 与实际表格一致
  may25: 445000,        // ✓ 与实际表格一致
  jun25: 509000,        // ✓ 与实际表格一致
  jul25: 497700         // ✓ 与实际表格一致
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
    apr2025Stock: 240,        // 修正：2025/4/2庫存
    may2025Demand: 500,       // 修正：2025年5月份需求
    may2025Stock: 200,        // 修正：2025/5/2庫存
    jun2025Demand: 500,       // 修正：2025年6月份需求
    jun2025Stock: 200,        // 修正：2025/6/3庫存
    jul2025Demand: 500,       // 修正：2025年7月份需求
    jul2025Stock: 500,        // 修正：2025/7/20庫存 (以物料立库存数量)
    aug2025Demand: 0,         // 修正：8月份需求
    remark: "4910",           // 修正：總金額
    // 🆕 新增计算关联字段
    calculationId: 1,
    hasCalculation: true
  },
  {
    id: 2,
    serialNumber: 2,
    materialDescription: "設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)",
    unit: "pcs",
    purchaser: "湯麗瑩",
    unitPrice: 9.05,          // 修正：单价
    minSafetyStock: 61,       // 修正：最低安全库存
    maxSafetyStock: 138,      // 修正：最高安全库存
    moq: 100,
    leadTimeWeeks: 15,
    apr2025Stock: 0,          // 修正：2025/4/2庫存
    may2025Demand: 200,       // 修正：2025年5月份需求
    may2025Stock: 80,         // 修正：2025/5/2庫存
    jun2025Demand: 200,       // 修正：2025年6月份需求
    jun2025Stock: 75,         // 修正：2025/6/3庫存
    jul2025Demand: 100,       // 修正：2025年7月份需求
    jul2025Stock: 100,        // 修正：2025/7/20庫存
    aug2025Demand: 0,         // 修正：8月份需求
    remark: "805",            // 修正：總金額
    // 🆕 新增计算关联字段
    calculationId: 2,
    hasCalculation: true
  },
  {
    id: 3,
    serialNumber: 3,
    materialDescription: "設備耗材類-(B453/AJ FCT設備/探針/GKS-075 291 064 V.2000)",
    unit: "pcs",
    purchaser: "湯麗瑩",
    unitPrice: 1.27,          // 修正：单价
    minSafetyStock: 58,       // 修正：最低安全库存
    maxSafetyStock: 129,      // 修正：最高安全库存
    moq: 100,
    leadTimeWeeks: 15,
    apr2025Stock: 50,         // 修正：2025/4/2庫存
    may2025Demand: 100,       // 修正：2025年5月份需求
    may2025Stock: 60,         // 修正：2025/5/2庫存
    jun2025Demand: 100,       // 修正：2025年6月份需求
    jun2025Stock: 65,         // 修正：2025/6/3庫存
    jul2025Demand: 100,       // 修正：2025年7月份需求
    jul2025Stock: 100,        // 修正：2025/7/20庫存
    aug2025Demand: 0,         // 修正：8月份需求
    remark: "197",            // 修正：總金額
    // 🆕 新增计算关联字段
    calculationId: 3,
    hasCalculation: true
  },
  {
    id: 4,
    serialNumber: 4,
    materialDescription: "生產耗材類-(B453/膠材清潔劑/RK-58D 450ML(金千)",
    unit: "pcs",
    purchaser: "湯麗瑩",
    unitPrice: 159.80,        // 新增：单价
    minSafetyStock: 3,        // 新增：最低安全库存
    maxSafetyStock: 6,        // 新增：最高安全库存
    moq: 1,
    leadTimeWeeks: 15,
    apr2025Stock: 3,          // 新增：2025/4/2庫存
    may2025Demand: 1,         // 新增：2025年5月份需求
    may2025Stock: 3,          // 新增：2025/5/2庫存
    jun2025Demand: 6,         // 新增：2025年6月份需求
    jun2025Stock: 2,          // 新增：2025/6/3庫存
    jul2025Demand: 5,         // 新增：2025年7月份需求
    jul2025Stock: 5,          // 新增：2025/7/20庫存
    aug2025Demand: 0,         // 新增：8月份需求
    remark: "799",            // 新增：總金額
    // 🆕 新增计算关联字段
    calculationId: 4,
    hasCalculation: true
  }
];

// 初始化B453耗材需求计算数据 - 根据实际表格修正
const initialB453CalculationData: B453CalculationItem[] = [
  {
    id: 1,
    no: 1,
    materialName: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    usageStation: "MLR Left DFU",
    usagePerSet: 21,
    usageCount: 50000,
    monthlyCapacity: 363000,
    minStock: 228,           // 修正：与管控表同步
    maxStock: 512,           // 修正：与管控表同步
    monthlyDemand: 0,        // 计算得出
    monthlyNetDemand: 0,     // 计算得出
    actualOrder: 500,        // 修正：实际订购数量
    moqRemark: "MOQ: 100",
    // 🆕 新增管控表关联字段
    managementId: 1,
    linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
    unitPrice: 9.82,         // 从管控表同步
    moq: 100                 // 从管控表同步
  },
  {
    id: 2,
    no: 2,
    materialName: "設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)",
    usageStation: "MLR Left FCT",
    usagePerSet: 8,
    usageCount: 50000,
    monthlyCapacity: 363000,
    minStock: 61,            // 修正：与管控表同步
    maxStock: 138,           // 修正：与管控表同步
    monthlyDemand: 0,        // 计算得出
    monthlyNetDemand: 0,     // 计算得出
    actualOrder: 100,        // 修正：实际订购数量
    moqRemark: "MOQ: 100",
    // 🆕 新增管控表关联字段
    managementId: 2,
    linkedMaterial: "設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)",
    unitPrice: 9.05,         // 修正：从管控表同步
    moq: 100                 // 从管控表同步
  },
  {
    id: 3,
    no: 3,
    materialName: "設備耗材類-(B453/AJ FCT設備/探針/GKS-075 291 064 V.2000)",
    usageStation: "AJ FCT",
    usagePerSet: 12,         // 修正：每套机用量
    usageCount: 50000,       // 修正：使用次数
    monthlyCapacity: 363000,
    minStock: 58,            // 修正：与管控表同步
    maxStock: 129,           // 修正：与管控表同步
    monthlyDemand: 0,        // 计算得出
    monthlyNetDemand: 0,     // 计算得出
    actualOrder: 100,        // 修正：实际订购数量
    moqRemark: "MOQ: 100",
    // 🆕 新增管控表关联字段
    managementId: 3,
    linkedMaterial: "設備耗材類-(B453/AJ FCT設備/探針/GKS-075 291 064 V.2000)",
    unitPrice: 1.27,         // 修正：从管控表同步
    moq: 100                 // 从管控表同步
  },
  {
    id: 4,
    no: 4,
    materialName: "生產耗材類-(B453/膠材清潔劑/RK-58D 450ML(金千)",
    usageStation: "清潔工序",
    usagePerSet: 1,
    usageCount: 100000,
    monthlyCapacity: 363000,
    minStock: 3,             // 与管控表同步
    maxStock: 6,             // 与管控表同步
    monthlyDemand: 0,        // 计算得出
    monthlyNetDemand: 0,     // 计算得出
    actualOrder: 5,          // 实际订购数量
    moqRemark: "MOQ: 1",
    // 🆕 新增管控表关联字段
    managementId: 4,
    linkedMaterial: "生產耗材類-(B453/膠材清潔劑/RK-58D 450ML(金千)",
    unitPrice: 159.80,       // 从管控表同步
    moq: 1                   // 从管控表同步
  }
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
  jul25: 363000
};

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState("b482-andor");
  
  // B482相关状态
  const [b482Data, setB482Data] = useState<B482SupplyItem[]>(initialB482Data);
  const [showB482AddModal, setShowB482AddModal] = useState(false);
  const [showB482EditModal, setShowB482EditModal] = useState(false);
  const [editingB482Item, setEditingB482Item] = useState<B482SupplyItem | null>(null);
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
    enableAutoCalculation: false
  });

  // Andor相关状态
  const [andorData, setAndorData] = useState<AndorSupplyItem[]>(initialAndorData);
  const [forecastData, setForecastData] = useState<CapacityForecast>(initialForecastData);
  const [showAndorAddModal, setShowAndorAddModal] = useState(false);
  const [showAndorEditModal, setShowAndorEditModal] = useState(false);
  const [editingAndorItem, setEditingAndorItem] = useState<AndorSupplyItem | null>(null);
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
    remark: ""
  });

  // B453相关状态
  const [b453Data, setB453Data] = useState<B453SupplyItem[]>(initialB453Data);
  const [showB453AddModal, setShowB453AddModal] = useState(false);
  const [showB453EditModal, setShowB453EditModal] = useState(false);
  const [editingB453Item, setEditingB453Item] = useState<B453SupplyItem | null>(null);
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
    remark: ""
  });

  // B453计算表相关状态
  const [b453CalculationData, setB453CalculationData] = useState<B453CalculationItem[]>(initialB453CalculationData);
  const [b453ForecastData, setB453ForecastData] = useState<B453ForecastData>(initialB453ForecastData);
  const [showB453CalcAddModal, setShowB453CalcAddModal] = useState(false);
  const [showB453CalcEditModal, setShowB453CalcEditModal] = useState(false);
  const [editingB453CalcItem, setEditingB453CalcItem] = useState<B453CalculationItem | null>(null);
  const [newB453CalcItem, setNewB453CalcItem] = useState<Partial<B453CalculationItem>>({
    no: 1,
    materialName: "",
    usageStation: "",
    usagePerSet: 0,
    usageCount: 0,
    monthlyCapacity: 363000,
    minStock: 0,
    maxStock: 0,
    monthlyDemand: 0,
    monthlyNetDemand: 0,
    actualOrder: 0,
    moqRemark: ""
  });

  // ================================
  // 🔧 统一计算引擎 - Unified Calculation Engine
  // ================================
  
  // 通用计算参数接口
  interface CalculationParams {
    monthlyCapacity: number;    // 当月产能
    usagePerSet: number;        // 每套机用量
    usageCount: number;         // 使用次数
    maxCapacity?: number;       // 最高产能 (可选)
    minCapacity?: number;       // 最低产能 (可选)
    currentStock?: number;      // 当前库存 (可选)
    unitPrice?: number;         // 单价 (可选)
  }

  // 计算结果接口
  interface CalculationResult {
    monthlyDemand: number;      // 当月需求
    maxInventory?: number;      // 最高库存
    minInventory?: number;      // 最低库存
    netDemand?: number;         // 净需求
    demandValue?: number;       // 需求金额
  }

  // 🧮 核心统一计算函数
  const unifiedCalculateMonthlyDemand = (params: CalculationParams): number => {
    if (params.usageCount === 0) return 0;
    return Math.round(params.monthlyCapacity * params.usagePerSet / params.usageCount);
  };

  const unifiedCalculateMaxInventory = (params: CalculationParams): number => {
    if (!params.maxCapacity || params.usageCount === 0) return 0;
    return Math.round(params.maxCapacity * params.usagePerSet / params.usageCount);
  };

  const unifiedCalculateMinInventory = (params: CalculationParams): number => {
    if (!params.minCapacity || params.usageCount === 0) return 0;
    return Math.round(params.minCapacity * params.usagePerSet / params.usageCount);
  };

  const unifiedCalculateNetDemand = (monthlyDemand: number, currentStock: number): number => {
    return Math.max(0, monthlyDemand - currentStock);
  };

  const unifiedCalculateDemandValue = (monthlyDemand: number, unitPrice: number): number => {
    return monthlyDemand * unitPrice;
  };

  // 🎯 统一计算引擎主函数
  const unifiedCalculationEngine = (params: CalculationParams): CalculationResult => {
    const monthlyDemand = unifiedCalculateMonthlyDemand(params);
    
    const result: CalculationResult = {
      monthlyDemand
    };

    // 可选计算项
    if (params.maxCapacity) {
      result.maxInventory = unifiedCalculateMaxInventory(params);
    }
    
    if (params.minCapacity) {
      result.minInventory = unifiedCalculateMinInventory(params);
    }
    
    if (params.currentStock !== undefined) {
      result.netDemand = unifiedCalculateNetDemand(monthlyDemand, params.currentStock);
    }
    
    if (params.unitPrice) {
      result.demandValue = unifiedCalculateDemandValue(monthlyDemand, params.unitPrice);
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
      usagePerSet: item.usagePerSet,
      usageCount: item.usageCount,
      maxCapacity: forecastData.maxCapacity,
      minCapacity: forecastData.minCapacity
    });

    return {
      ...item,
      monthlyDemand: result.monthlyDemand,
      maxInventory: result.maxInventory || 0,
      minInventory: result.minInventory || 0
    };
  };

  // 🔄 B453系统计算 - 使用统一引擎
    const updateB453Calculations = (item: B453CalculationItem): B453CalculationItem => {
    const result = unifiedCalculationEngine({
      monthlyCapacity: item.monthlyCapacity,
      usagePerSet: item.usagePerSet,
      usageCount: item.usageCount,
      currentStock: item.minStock
    });
    
    return {
      ...item,
      monthlyDemand: result.monthlyDemand,
      monthlyNetDemand: result.netDemand || 0
    };
  };

  // 🆕 B453数据关联和同步功能
  const linkB453Data = (managementItem: B453SupplyItem, calculationItem: B453CalculationItem) => {
    // 更新管控表的关联信息
    const updatedManagement = {
      ...managementItem,
      calculationId: calculationItem.id,
      hasCalculation: true
    };
    
    // 更新计算表的关联信息和同步数据
    const updatedCalculation = {
      ...calculationItem,
      managementId: managementItem.id,
      linkedMaterial: managementItem.materialDescription,
      unitPrice: managementItem.unitPrice,
      moq: managementItem.moq,
      minStock: managementItem.minSafetyStock,
      maxStock: managementItem.maxSafetyStock
    };

    return { updatedManagement, updatedCalculation };
  };

  const syncB453CalculationFromManagement = (managementItem: B453SupplyItem): B453CalculationItem | null => {
    // 查找关联的计算表项目
    const calculationItem = b453CalculationData.find(calc => calc.managementId === managementItem.id);
    if (!calculationItem) return null;

    // 同步管控表数据到计算表
    return {
      ...calculationItem,
      linkedMaterial: managementItem.materialDescription,
      unitPrice: managementItem.unitPrice,
      moq: managementItem.moq,
      minStock: managementItem.minSafetyStock,
      maxStock: managementItem.maxSafetyStock
    };
  };

  const syncB453ManagementFromCalculation = (calculationItem: B453CalculationItem): B453SupplyItem | null => {
    // 查找关联的管控表项目
    const managementItem = b453Data.find(mgmt => mgmt.id === calculationItem.managementId);
    if (!managementItem) return null;

    // 同步计算表的需求数据到管控表
    const updatedCalculation = updateB453Calculations(calculationItem);
    return {
      ...managementItem,
      jul2025Demand: updatedCalculation.monthlyDemand,
      // 可以根据需要同步更多字段
    };
  };

  const createB453CalculationFromManagement = (managementItem: B453SupplyItem): B453CalculationItem => {
    const newId = Math.max(...b453CalculationData.map(item => item.id), 0) + 1;
    return {
      id: newId,
      no: newId,
      materialName: managementItem.materialDescription,
      usageStation: "待設定",
      usagePerSet: 1,
      usageCount: 10000,
      monthlyCapacity: b453ForecastData.jul25,
      minStock: managementItem.minSafetyStock,
      maxStock: managementItem.maxSafetyStock,
      monthlyDemand: 0,
      monthlyNetDemand: 0,
      actualOrder: 0,
      moqRemark: `MOQ: ${managementItem.moq}`,
      managementId: managementItem.id,
      linkedMaterial: managementItem.materialDescription,
      unitPrice: managementItem.unitPrice,
      moq: managementItem.moq
    };
  };

  // 🆕 B482系统自动计算 - 新增功能
  const updateB482Calculations = (item: B482SupplyItem, capacityData?: { monthlyCapacity: number, usagePerSet?: number, usageCount?: number }): B482SupplyItem => {
    if (!capacityData) return item;

    const result = unifiedCalculationEngine({
      monthlyCapacity: capacityData.monthlyCapacity,
      usagePerSet: capacityData.usagePerSet || 1,
      usageCount: capacityData.usageCount || 1000,
      unitPrice: item.unitPrice,
      currentStock: item.minSafetyStock
    });

    return {
      ...item,
      july2025: result.monthlyDemand,
      unpurchasedAmount: result.demandValue || item.unpurchasedAmount
    };
  };

  // B482添加新项目
  const handleAddB482Item = () => {
    if (!newB482Item.materialDescription || !newB482Item.unitPrice) {
      return;
    }

    const nextId = Math.max(...b482Data.map(item => item.id)) + 1;
    const nextSerialNumber = Math.max(...b482Data.map(item => item.serialNumber)) + 1;
    
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
      enableAutoCalculation: newB482Item.enableAutoCalculation || false
    };

    // 🧮 如果启用自动计算，使用统一计算引擎
    if (completeItem.enableAutoCalculation && completeItem.usagePerSet && completeItem.usageCount && completeItem.monthlyCapacity) {
      completeItem = updateB482Calculations(completeItem, {
        monthlyCapacity: completeItem.monthlyCapacity,
        usagePerSet: completeItem.usagePerSet,
        usageCount: completeItem.usageCount
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
      enableAutoCalculation: false
    });
    setShowB482AddModal(false);
  };

  // Andor添加新项目
  const handleAddAndorItem = () => {
    if (!newAndorItem.materialName || !newAndorItem.usageStation) {
      return;
    }

    const nextId = Math.max(...andorData.map(item => item.id)) + 1;
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
      remark: newAndorItem.remark || ""
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
      remark: ""
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

    setB482Data(b482Data.map(item => 
      item.id === editingB482Item.id ? editingB482Item : item
    ));
    setShowB482EditModal(false);
    setEditingB482Item(null);
  };

  // B482删除项目
  const handleDeleteB482Item = (id: number) => {
    setB482Data(b482Data.filter(item => item.id !== id));
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
    setAndorData(andorData.map(item => 
      item.id === editingAndorItem.id ? calculatedItem : item
    ));
    setShowAndorEditModal(false);
    setEditingAndorItem(null);
  };

  // Andor删除项目
  const handleDeleteAndorItem = (id: number) => {
    setAndorData(andorData.filter(item => item.id !== id));
  };

  // B453添加新项目
  const handleAddB453Item = () => {
    if (!newB453Item.materialDescription || !newB453Item.unitPrice) {
      return;
    }

    const nextId = Math.max(...b453Data.map(item => item.id)) + 1;
    const nextSerialNumber = Math.max(...b453Data.map(item => item.serialNumber)) + 1;
    
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
      remark: newB453Item.remark || ""
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
      remark: ""
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

    setB453Data(b453Data.map(item => 
      item.id === editingB453Item.id ? editingB453Item : item
    ));
    setShowB453EditModal(false);
    setEditingB453Item(null);
  };

  // B453删除项目
  const handleDeleteB453Item = (id: number) => {
    setB453Data(b453Data.filter(item => item.id !== id));
  };

  // B453计算表操作函数
  const handleAddB453CalcItem = () => {
    if (!newB453CalcItem.materialName || !newB453CalcItem.usageStation) {
      return;
    }

    const nextId = Math.max(...b453CalculationData.map(item => item.id)) + 1;
    const completeItem: B453CalculationItem = {
      id: nextId,
      no: newB453CalcItem.no || 1,
      materialName: newB453CalcItem.materialName!,
      usageStation: newB453CalcItem.usageStation!,
      usagePerSet: newB453CalcItem.usagePerSet || 0,
      usageCount: newB453CalcItem.usageCount || 0,
      monthlyCapacity: newB453CalcItem.monthlyCapacity || 363000,
      minStock: newB453CalcItem.minStock || 0,
      maxStock: newB453CalcItem.maxStock || 0,
      monthlyDemand: 0,
      monthlyNetDemand: 0,
      actualOrder: newB453CalcItem.actualOrder || 0,
      moqRemark: newB453CalcItem.moqRemark || ""
    };

    const calculatedItem = updateB453Calculations(completeItem);
    setB453CalculationData([...b453CalculationData, calculatedItem]);
    
    // 重置表单
    setNewB453CalcItem({
      no: 1,
      materialName: "",
      usageStation: "",
      usagePerSet: 0,
      usageCount: 0,
      monthlyCapacity: 363000,
      minStock: 0,
      maxStock: 0,
      monthlyDemand: 0,
      monthlyNetDemand: 0,
      actualOrder: 0,
      moqRemark: ""
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
    setB453CalculationData(b453CalculationData.map(item => 
      item.id === editingB453CalcItem.id ? calculatedItem : item
    ));
    setShowB453CalcEditModal(false);
    setEditingB453CalcItem(null);
  };

  const handleDeleteB453CalcItem = (id: number) => {
    setB453CalculationData(b453CalculationData.filter(item => item.id !== id));
  };

  // 导出Excel - 按照B482正确格式
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    
    // 准备数据 - 按照B482的确切格式
    const worksheetData = [
                  // 表头 - 与B482表格完全一致
            [
              '序號',
              '物料描述', 
              '單位',
              '採購員',
              '單價(RMB)',
              '最高安全庫存',
              '最低安全庫存',
              '最小採購量(MOQ)',
              '未採購量(RMB)',
              'L/T(Day)',
              '2025年6月份',
              '2025年7月份',
              '7月M1',
              '7月M2',
              '7月M3',
              '7月M4',
              '備註'
            ],
            // 数据行
            ...b482Data.map(item => [
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
              item.remark
            ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 设置列宽 - 根据内容调整
    ws['!cols'] = [
      { wch: 8 },   // 序號
      { wch: 50 },  // 物料描述
      { wch: 8 },   // 單位
      { wch: 12 },  // 採購員
      { wch: 12 },  // 單價(RMB)
      { wch: 15 },  // 最高安全庫存
      { wch: 15 },  // 最低安全庫存
      { wch: 15 },  // 最小採購量(MOQ)
      { wch: 15 },  // 未採購量(RMB)
      { wch: 10 },  // L/T(Day)
      { wch: 12 },  // 2025年6月份
      { wch: 12 },  // 2025年7月份
      { wch: 10 },  // 7月M1
      { wch: 10 },  // 7月M2
      { wch: 10 },  // 7月M3
      { wch: 10 },  // 7月M4
      { wch: 25 }   // 備註
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'B482耗材管控申請表');

    const fileName = `B482_TE課6512部門7月常用消耗材管控申請表_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Andor导出函数
  const handleAndorExport = () => {
    const wb = XLSX.utils.book_new();
    const worksheetData = [
      ['月份', 'No.', '耗材名稱', '使用站別', '每套機用量', '使用次數', '當月產能', '最低庫存', '最高庫存', '當月需求', '備註(實際訂購數量)'],
      ...andorData.map(item => [
        item.month, item.no, item.materialName, item.usageStation, item.usagePerSet,
        item.usageCount, item.monthlyCapacity, item.minInventory, item.maxInventory,
        item.monthlyDemand, item.remark
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Andor耗材需求計算');
    XLSX.writeFile(wb, `Andor7月常用耗材需求計算_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 🔧 动态生成B453表头的函数
  const generateB453Headers = (targetYear: number, targetMonth: number) => {
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
        month: actualMonth
      });
    }
    
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
    
    return { mainTitle, mainHeaders, subHeaders };
  };

  // B453导出Excel
  const handleB453Export = () => {
    const wb = XLSX.utils.book_new();
    
    // 🔧 使用动态生成的表头（可以根据需要修改年份和月份）
    const targetYear = 2025;
    const targetMonth = 7; // 这里可以根据需要修改，或者从用户选择中获取
    const { mainTitle, mainHeaders, subHeaders } = generateB453Headers(targetYear, targetMonth);
    
    // 🔧 按照真实B453格式重新设计表头（完整23列版本A-W）
    const worksheetData = [
      // 第1行：主标题行 (A1:W1合并)
      [mainTitle, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // 第2行：主表头 (第一级)
      mainHeaders,
      
      // 第3行：子表头 (第二级)
      subHeaders,
      
      // 数据行 (23列完整版本 A-W)
      ...b453Data.map(item => [
        item.serialNumber,                                                        // A: 序號
        item.materialDescription,                                                 // B: 物料描述
        item.unit,                                                               // C: 單位
        item.purchaser,                                                          // D: 採購員
        typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : '0.00', // E: 單價(RMB)
        item.minSafetyStock,                                                     // F: 安全庫存-最低
        item.maxSafetyStock,                                                     // G: 安全庫存-最高
        item.moq,                                                                // H: 最小採購量(MOQ)
        15,                                                                      // I: L/T Wks
        item.apr2025Stock,                                                       // J: 2025/4/2庫存
        item.may2025Demand,                                                      // K: 2025年5月份需求
        item.may2025Stock,                                                       // L: 2025/5/2庫存
        item.jun2025Demand,                                                      // M: 2025年6月份需求
        item.jun2025Stock,                                                       // N: 2025/6/2庫存
        item.jul2025Demand,                                                      // O: 2025年7月份需求
        0,                                                                       // P: 2025/6/19現階段數量
        0,                                                                       // Q: 2024/6/25現階段數量
        0,                                                                       // R: 7月M01
        0,                                                                       // S: 7月M02
        0,                                                                       // T: 7月M03
        0,                                                                       // U: 7月M04
        (item.unitPrice * item.jul2025Demand).toFixed(2),                       // V: 總金額(RMB)
        item.remark                                                              // W: 備註
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
    XLSX.writeFile(wb, `B453_SMT_ATE耗材管控表_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // B453计算表导出Excel
  const handleB453CalcExport = () => {
    const wb = XLSX.utils.book_new();
    
    // 计算表数据
    const calculationData = [
      ['TE課B453 SMT ATE 2025年7月份耗材需求計算', '', '', '', '', '', '', '', '', '', '', ''],
      ['No.', '料材名稱', '使用站別', '每套機用量', '使用次數', '當月產能', '最低庫存數量', '最高庫存數量', '當月需求', '當月網路需求', '實際訂購數量', '備註(MOQ)'],
      ...b453CalculationData.map(item => [
        item.no,
        item.materialName,
        item.usageStation,
        item.usagePerSet,
        item.usageCount,
        item.monthlyCapacity,
        item.minStock,
        item.maxStock,
        item.monthlyDemand,
        item.monthlyNetDemand,
        item.actualOrder,
        item.moqRemark
      ]),
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['當月產能按當月Cum Input Qty為準', '', '', '', '', '', '', '', '', '', '', ''],
      ['當月需求=當月產能*每套機用量/使用次數', '', '', '', '', '', '', '', '', '', '', ''],
      ['最低庫存=六個月中最低產能*每套機用量/使用次數', '', '', '', '', '', '', '', '', '', '', ''],
      ['最高庫存=六個月中最高產能*每套機用量/使用次數', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['產能預測', '', '', '', '', '', '', '', '', '', '', ''],
      ['Item', 'Mar-24', 'Oct-24', 'Dec-24', 'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', ''],
      ['Forecast', b453ForecastData.mar24, b453ForecastData.oct24, b453ForecastData.dec24, 
       b453ForecastData.jan25, b453ForecastData.feb25, b453ForecastData.mar25, 
       b453ForecastData.apr25, b453ForecastData.may25, b453ForecastData.jun25, b453ForecastData.jul25, '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(calculationData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },   // No.
      { wch: 50 },  // 料材名稱
      { wch: 15 },  // 使用站別
      { wch: 12 },  // 每套機用量
      { wch: 12 },  // 使用次數
      { wch: 12 },  // 當月產能
      { wch: 15 },  // 最低庫存數量
      { wch: 15 },  // 最高庫存數量
      { wch: 12 },  // 當月需求
      { wch: 15 },  // 當月網路需求
      { wch: 15 },  // 實際訂購數量
      { wch: 15 }   // 備註(MOQ)
    ];

    XLSX.utils.book_append_sheet(wb, ws, "B453耗材需求計算");
    XLSX.writeFile(wb, `B453_SMT_ATE耗材需求計算_${new Date().toLocaleDateString()}.xlsx`);
  };

  // B482 Tab组件
  const B482Tab = () => (
    <div className="flex flex-col gap-6">
      {/* 🧮 统一计算公式说明 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardBody>
          <h3 className="text-lg font-semibold mb-3 text-blue-800">🧮 統一計算公式 - B482申請表</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-green-600">當月需求</strong><br/>
              = 當月產能 × 每套機用量 ÷ 使用次數
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-orange-600">需求金額</strong><br/>
              = 當月需求 × 單價(RMB)
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-purple-600">自動計算</strong><br/>
              啟用後自動更新7月需求量
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">{b482Data.length}</div>
            <div className="text-sm text-gray-600">總項目數</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">{formatPrice(calculateTotalValue())}</div>
            <div className="text-sm text-gray-600">總未採購金額</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">{calculateTotalMOQ()}</div>
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
            onClick={() => setShowB482AddModal(true)}
          >
            添加耗材項目
          </Button>
          <Button 
            color="success" 
            variant="flat"
            startContent={<DownloadIcon />}
            onClick={handleExport}
          >
            導出Excel申請表
          </Button>
        </div>
        <Badge color="secondary" variant="flat" size="lg">
          B482申請表數據
        </Badge>
      </div>

      {/* B482耗材管控申請表格 - 按照正确的列头顺序 */}
      <Card className="shadow-lg">
        <CardBody>
          <Table aria-label="B482 TE課6512部門7月常用消耗材管控申請表" className="min-w-full">
            <TableHeader>
              <TableColumn className="bg-red-100">序號</TableColumn>
              <TableColumn className="bg-red-100">物料描述</TableColumn>
              <TableColumn className="bg-red-100">單位</TableColumn>
                              <TableColumn className="bg-red-100">採購員</TableColumn>
                <TableColumn className="bg-red-100">單價(RMB)</TableColumn>
                <TableColumn className="bg-purple-100">最高安全庫存</TableColumn>
                <TableColumn className="bg-purple-100">最低安全庫存</TableColumn>
                <TableColumn className="bg-orange-100">最小採購量(MOQ)</TableColumn>
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
              {b482Data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold">{item.serialNumber}</TableCell>
                  <TableCell className="font-semibold text-blue-600">{item.materialDescription}</TableCell>
                  <TableCell>
                    <Chip color="secondary" variant="flat" size="sm">
                      {item.unit}
                    </Chip>
                  </TableCell>
                  <TableCell>{item.purchaser}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatPrice(item.unitPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge color="secondary" variant="flat">
                      {item.maxSafetyStock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge color="default" variant="flat">
                      {item.minSafetyStock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge color="warning" variant="flat">
                      {item.moq}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-red-600 font-medium">
                    {formatPrice(item.unpurchasedAmount)}
                  </TableCell>
                  <TableCell>{item.leadTime} 天</TableCell>
                  <TableCell className="bg-blue-50">{item.june2025}</TableCell>
                  <TableCell className="bg-yellow-50 font-semibold">{item.july2025}</TableCell>
                  <TableCell className="bg-green-50">{item.julyM1}</TableCell>
                  <TableCell className="bg-green-50">{item.julyM2}</TableCell>
                  <TableCell className="bg-green-50">{item.julyM3}</TableCell>
                  <TableCell className="bg-green-50">{item.julyM4}</TableCell>
                  <TableCell className="text-sm text-gray-600">{item.remark}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Tooltip content="編輯">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          color="primary"
                                                      onClick={() => {
                              setEditingB482Item(item);
                              setShowB482EditModal(true);
                            }}
                        >
                          <EditIcon />
                        </Button>
                      </Tooltip>
                      <Tooltip content="刪除">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          color="danger"
                                                      onClick={() => setB482Data(b482Data.filter(i => i.id !== item.id))}
                        >
                          <TrashIcon />
                        </Button>
                      </Tooltip>
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
    const groupedData = andorData.reduce((acc, item) => {
      if (!acc[item.month]) {
        acc[item.month] = [];
      }
      acc[item.month].push(item);
      return acc;
    }, {} as Record<string, AndorSupplyItem[]>);

    return (
      <div className="flex flex-col gap-6">
        {/* 🧮 统一计算公式说明 */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardBody>
            <h3 className="text-lg font-semibold mb-3 text-blue-800">🧮 統一計算公式 - Andor需求計算</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-green-200">
                <strong className="text-green-600">當月需求</strong><br/>
                = 當月產能 × 每套機用量 ÷ 使用次數
              </div>
              <div className="bg-white p-3 rounded border border-orange-200">
                <strong className="text-orange-600">最高庫存</strong><br/>
                = 六個月中最高產能 × 每套機用量 ÷ 使用次數
              </div>
              <div className="bg-white p-3 rounded border border-red-200">
                <strong className="text-red-600">最低庫存</strong><br/>
                = 六個月中最低產能 × 每套機用量 ÷ 使用次數
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
                onValueChange={(value) => setForecastData({...forecastData, maxCapacity: parseInt(value) || 0})}
              />
              <Input
                label="最低產能"
                type="number"
                value={forecastData.minCapacity.toString()}
                onValueChange={(value) => setForecastData({...forecastData, minCapacity: parseInt(value) || 0})}
              />
              <Input
                label="4月-24"
                type="number"
                value={forecastData.apr24.toString()}
                onValueChange={(value) => setForecastData({...forecastData, apr24: parseInt(value) || 0})}
              />
              <Input
                label="5月-25"
                type="number"
                value={forecastData.may25.toString()}
                onValueChange={(value) => setForecastData({...forecastData, may25: parseInt(value) || 0})}
              />
              <Input
                label="6月-25"
                type="number"
                value={forecastData.jun25.toString()}
                onValueChange={(value) => setForecastData({...forecastData, jun25: parseInt(value) || 0})}
              />
              <Input
                label="7月-25"
                type="number"
                value={forecastData.jul25.toString()}
                onValueChange={(value) => setForecastData({...forecastData, jul25: parseInt(value) || 0})}
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
              variant="flat"
              startContent={<DownloadIcon />}
              onClick={handleAndorExport}
            >
              導出Excel計算表
            </Button>
          </div>
          <Badge color="secondary" variant="flat" size="lg">
            總項目: {andorData.length}
          </Badge>
        </div>

        {/* Andor表格 */}
        {Object.entries(groupedData).map(([month, items]) => (
          <Card key={month} className="shadow-lg">
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <Chip color="primary" size="lg">{month}</Chip>
                <span className="text-gray-600">({items.length} 項目)</span>
              </div>
              
              <Table aria-label={`${month} 耗材需求計算表`} className="min-w-full">
                <TableHeader>
                  <TableColumn className="bg-orange-100">No.</TableColumn>
                  <TableColumn className="bg-orange-100">耗材名稱</TableColumn>
                  <TableColumn className="bg-orange-100">使用站別</TableColumn>
                  <TableColumn className="bg-green-100">每套機用量</TableColumn>
                  <TableColumn className="bg-green-100">使用次數</TableColumn>
                  <TableColumn className="bg-blue-100">當月產能</TableColumn>
                  <TableColumn className="bg-red-100">最低庫存</TableColumn>
                  <TableColumn className="bg-yellow-100">最高庫存</TableColumn>
                  <TableColumn className="bg-purple-100">當月需求</TableColumn>
                  <TableColumn className="bg-gray-100">備註</TableColumn>
                  <TableColumn>操作</TableColumn>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold">{item.no}</TableCell>
                      <TableCell className="font-semibold text-blue-600">{item.materialName}</TableCell>
                      <TableCell>
                        <Chip color="secondary" variant="flat" size="sm">{item.usageStation}</Chip>
                      </TableCell>
                      <TableCell>{item.usagePerSet}</TableCell>
                      <TableCell>{item.usageCount.toLocaleString()}</TableCell>
                      <TableCell className="text-blue-600 font-medium">{item.monthlyCapacity.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge color="danger" variant="flat">{item.minInventory}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge color="warning" variant="flat">{item.maxInventory}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge color="success" variant="flat" size="lg">{item.monthlyDemand}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{item.remark}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip content="編輯">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              color="primary"
                              onClick={() => {
                                setEditingAndorItem(item);
                                setShowAndorEditModal(true);
                              }}
                            >
                              <EditIcon />
                            </Button>
                          </Tooltip>
                          <Tooltip content="刪除">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              color="danger"
                              onClick={() => setAndorData(andorData.filter(i => i.id !== item.id))}
                            >
                              <TrashIcon />
                            </Button>
                          </Tooltip>
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
    const linkedManagementCount = b453Data.filter(item => item.hasCalculation).length;
    const linkedCalculationCount = b453CalculationData.filter(item => item.managementId).length;
    const totalManagementCount = b453Data.length;
    const totalCalculationCount = b453CalculationData.length;

    return (
      <div className="flex flex-col gap-6">
        {/* 🔗 关联状态概览 */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 shadow-lg">
          <CardBody>
            <h3 className="text-lg font-bold text-blue-800 mb-3">🔗 數據關聯狀態</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {linkedManagementCount}/{totalManagementCount}
                </div>
                <div className="text-sm text-gray-600">管控表已關聯</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${totalManagementCount > 0 ? (linkedManagementCount / totalManagementCount) * 100 : 0}%` }}
                  ></div>
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
                    style={{ width: `${totalCalculationCount > 0 ? (linkedCalculationCount / totalCalculationCount) * 100 : 0}%` }}
                  ></div>
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
                  variant="flat"
                  size="sm"
                  onClick={() => {
                    // 自动关联功能 - 基于物料名称匹配
                    const updatedManagement = [...b453Data];
                    const updatedCalculation = [...b453CalculationData];
                    
                    b453Data.forEach(mgmt => {
                      if (!mgmt.hasCalculation) {
                        const matchingCalc = b453CalculationData.find(calc => 
                          !calc.managementId && 
                          calc.materialName.includes(mgmt.materialDescription.substring(0, 20))
                        );
                        if (matchingCalc) {
                          const mgmtIndex = updatedManagement.findIndex(m => m.id === mgmt.id);
                          const calcIndex = updatedCalculation.findIndex(c => c.id === matchingCalc.id);
                          
                          updatedManagement[mgmtIndex] = {
                            ...mgmt,
                            calculationId: matchingCalc.id,
                            hasCalculation: true
                          };
                          
                          updatedCalculation[calcIndex] = {
                            ...matchingCalc,
                            managementId: mgmt.id,
                            linkedMaterial: mgmt.materialDescription,
                            unitPrice: mgmt.unitPrice,
                            moq: mgmt.moq
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
          selectedKey={activeB453Tab} 
          onSelectionChange={(key) => setActiveB453Tab(key as string)}
          size="md"
          color="secondary"
          variant="underlined"
        >
          <Tab key="management" title="📋 管控表">
            <div className="flex flex-col gap-6">
              {/* 统计信息 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-primary">{b453Data.length}</div>
                    <div className="text-sm text-gray-600">總項目數</div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {formatPrice(b453Data.reduce((total, item) => total + (item.unitPrice * item.jul2025Demand), 0))}
                    </div>
                    <div className="text-sm text-gray-600">7月總需求金額</div>
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
                      {b453Data.reduce((total, item) => total + item.jul2025Demand, 0)}
                    </div>
                    <div className="text-sm text-gray-600">7月總需求量</div>
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
                    variant="flat"
                    startContent={<DownloadIcon />}
                    onClick={handleB453Export}
                  >
                    導出Excel管控表
                  </Button>
                </div>
                <Badge color="secondary" variant="flat" size="lg">
                  B453 SMT ATE管控表
                </Badge>
              </div>

              {/* B453 SMT ATE耗材管控表格 */}
              <Card className="shadow-lg">
                <CardBody>
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">📋 TE課B453 SMT ATE 2025年7月份耗材管控表</h3>
                    <p className="text-sm text-gray-600">專業設備耗材管控 - 支持多級表頭與月度庫存需求分析</p>
                  </div>
                  
                  <Table aria-label="B453 SMT ATE耗材管控表" className="min-w-full">
                    <TableHeader>
                      <TableColumn className="bg-red-100">序號</TableColumn>
                      <TableColumn className="bg-red-100">物料描述</TableColumn>
                      <TableColumn className="bg-red-100">單位</TableColumn>
                      <TableColumn className="bg-red-100">採購員</TableColumn>
                      <TableColumn className="bg-red-100">單價(RMB)</TableColumn>
                      <TableColumn className="bg-purple-100">安全庫存-最低</TableColumn>
                      <TableColumn className="bg-purple-100">安全庫存-最高</TableColumn>
                      <TableColumn className="bg-orange-100">最小采购量(MOQ)</TableColumn>
                      <TableColumn className="bg-orange-100">L/T(Wks)</TableColumn>
                      <TableColumn className="bg-blue-100">2025/4/1庫存</TableColumn>
                      <TableColumn className="bg-green-100">5月需求</TableColumn>
                      <TableColumn className="bg-blue-100">2025/5/22庫存</TableColumn>
                      <TableColumn className="bg-green-100">6月需求</TableColumn>
                      <TableColumn className="bg-blue-100">2025/6/23庫存</TableColumn>
                      <TableColumn className="bg-yellow-100">7月需求</TableColumn>
                      <TableColumn className="bg-blue-100">2025/7/20庫存</TableColumn>
                      <TableColumn className="bg-green-100">8月需求</TableColumn>
                      <TableColumn className="bg-gray-100">備註</TableColumn>
                      <TableColumn className="bg-yellow-100">關聯狀態</TableColumn>
                      <TableColumn>操作</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {b453Data.map((item) => (
                        <TableRow key={item.id} id={`mgmt-row-${item.id}`}>
                          <TableCell className="font-semibold">{item.serialNumber}</TableCell>
                          <TableCell className="font-semibold text-blue-600 max-w-xs truncate" title={item.materialDescription}>
                            {item.materialDescription}
                          </TableCell>
                          <TableCell>
                            <Chip color="secondary" variant="flat" size="sm">
                              {item.unit}
                            </Chip>
                          </TableCell>
                          <TableCell>{item.purchaser}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatPrice(item.unitPrice)}
                          </TableCell>
                          <TableCell>
                            <Badge color="default" variant="flat">
                              {item.minSafetyStock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge color="secondary" variant="flat">
                              {item.maxSafetyStock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge color="warning" variant="flat">
                              {item.moq}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.leadTimeWeeks} 週</TableCell>
                          <TableCell className="bg-blue-50">{item.apr2025Stock}</TableCell>
                          <TableCell className="bg-green-50 font-semibold">{item.may2025Demand}</TableCell>
                          <TableCell className="bg-blue-50">{item.may2025Stock}</TableCell>
                          <TableCell className="bg-green-50 font-semibold">{item.jun2025Demand}</TableCell>
                          <TableCell className="bg-blue-50">{item.jun2025Stock}</TableCell>
                          <TableCell className="bg-yellow-50 font-bold text-yellow-800">{item.jul2025Demand}</TableCell>
                          <TableCell className="bg-blue-50">{item.jul2025Stock}</TableCell>
                          <TableCell className="bg-green-50">{item.aug2025Demand}</TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-xs truncate" title={item.remark}>
                            {item.remark}
                          </TableCell>
                          <TableCell>
                            {item.hasCalculation ? (
                              <Chip color="success" variant="flat" size="sm">
                                <div className="flex items-center gap-1">
                                  🔗 已關聯
                                </div>
                              </Chip>
                            ) : (
                              <Chip color="warning" variant="flat" size="sm">
                                <div className="flex items-center gap-1">
                                  ⚠️ 未關聯
                                </div>
                              </Chip>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Tooltip content="編輯">
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  color="primary"
                                  onClick={() => handleEditB453Item(item)}
                                >
                                  <EditIcon />
                                </Button>
                              </Tooltip>
                              {item.hasCalculation ? (
                                <Tooltip content="已關聯計算表">
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    color="success"
                                    onClick={() => {
                                      // 跳转到计算表并高亮关联项目
                                      setActiveB453Tab("calculation");
                                      setTimeout(() => {
                                        const element = document.getElementById(`calc-row-${item.calculationId}`);
                                        if (element) {
                                          element.scrollIntoView({ behavior: 'smooth' });
                                          element.style.backgroundColor = '#fef3c7';
                                          setTimeout(() => {
                                            element.style.backgroundColor = '';
                                          }, 2000);
                                        }
                                      }, 100);
                                    }}
                                  >
                                    🔗
                                  </Button>
                                </Tooltip>
                              ) : (
                                <Tooltip content="創建關聯計算">
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    color="warning"
                                    onClick={() => {
                                      const newCalcItem = createB453CalculationFromManagement(item);
                                      setB453CalculationData([...b453CalculationData, newCalcItem]);
                                      setB453Data(b453Data.map(mgmt => 
                                        mgmt.id === item.id 
                                          ? { ...mgmt, calculationId: newCalcItem.id, hasCalculation: true }
                                          : mgmt
                                      ));
                                      setActiveB453Tab("calculation");
                                    }}
                                  >
                                    ➕
                                  </Button>
                                </Tooltip>
                              )}
                              <Tooltip content="刪除">
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  color="danger"
                                  onClick={() => handleDeleteB453Item(item.id)}
                                >
                                  <TrashIcon />
                                </Button>
                              </Tooltip>
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
                    <div className="text-2xl font-bold text-primary">{b453CalculationData.length}</div>
                    <div className="text-sm text-gray-600">計算項目數</div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {b453CalculationData.reduce((total, item) => total + item.monthlyDemand, 0)}
                    </div>
                    <div className="text-sm text-gray-600">總當月需求</div>
                  </CardBody>
                </Card>
                <Card className="shadow-lg">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {b453CalculationData.reduce((total, item) => total + item.actualOrder, 0)}
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
                    variant="flat"
                    startContent={<DownloadIcon />}
                    onClick={handleB453CalcExport}
                  >
                    導出Excel計算表
                  </Button>
                </div>
                <Badge color="secondary" variant="flat" size="lg">
                  B453 需求計算表
                </Badge>
              </div>

              {/* 🧮 统一计算公式说明 */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardBody>
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">🧮 統一計算公式 - B453需求計算</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-green-200">
                      <strong className="text-green-600">當月需求</strong><br/>
                      = 當月產能 × 每套機用量 ÷ 使用次數
                    </div>
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <strong className="text-orange-600">當月網路需求</strong><br/>
                      = 當月需求 - 最低庫存數量
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* 🔗 关联功能说明 */}
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardBody>
                  <h3 className="text-lg font-semibold mb-3 text-orange-800">🔗 關聯功能說明</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <strong className="text-blue-600">🔗 關聯按鈕</strong><br/>
                      點擊可跳轉到關聯的表格並高亮顯示
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <strong className="text-green-600">➕ 創建關聯</strong><br/>
                      為未關聯項目創建對應的表格記錄
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-200">
                      <strong className="text-purple-600">🔄 同步數據</strong><br/>
                      將管控表的基本信息同步到計算表
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* B453耗材需求计算表格 */}
              <Card className="shadow-lg">
                <CardBody>
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                    <h3 className="text-lg font-bold text-green-800 mb-2">🧮 TE課B453 SMT ATE 2025年7月份耗材需求計算</h3>
                    <p className="text-sm text-gray-600">自動計算耗材需求量 - 基於產能與使用參數</p>
                  </div>
                  
                  <Table aria-label="B453耗材需求計算表" className="min-w-full">
                    <TableHeader>
                      <TableColumn className="bg-orange-100">No.</TableColumn>
                      <TableColumn className="bg-orange-100">料材名稱</TableColumn>
                      <TableColumn className="bg-orange-100">使用站別</TableColumn>
                      <TableColumn className="bg-green-100">每套機用量</TableColumn>
                      <TableColumn className="bg-green-100">使用次數</TableColumn>
                      <TableColumn className="bg-blue-100">當月產能</TableColumn>
                      <TableColumn className="bg-purple-100">最低庫存數量</TableColumn>
                      <TableColumn className="bg-purple-100">最高庫存數量</TableColumn>
                      <TableColumn className="bg-yellow-100">當月需求</TableColumn>
                      <TableColumn className="bg-red-100">當月網路需求</TableColumn>
                      <TableColumn className="bg-gray-100">實際訂購數量</TableColumn>
                      <TableColumn className="bg-gray-100">備註(MOQ)</TableColumn>
                      <TableColumn>操作</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {b453CalculationData.map((item) => {
                        const calculatedItem = updateB453Calculations(item);
                        const isLinked = item.managementId !== undefined;
                        return (
                          <TableRow key={item.id} id={`calc-row-${item.id}`}>
                            <TableCell className="font-semibold">
                              <div className="flex items-center gap-2">
                                {calculatedItem.no}
                                {isLinked && (
                                  <Chip color="success" variant="flat" size="sm">
                                    🔗
                                  </Chip>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-blue-600 max-w-xs truncate" title={calculatedItem.materialName}>
                              <div className="flex flex-col">
                                <span>{calculatedItem.materialName}</span>
                                {isLinked && calculatedItem.linkedMaterial && (
                                  <span className="text-xs text-gray-500 truncate" title={calculatedItem.linkedMaterial}>
                                    關聯: {calculatedItem.linkedMaterial}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip color="secondary" variant="flat" size="sm">
                                {calculatedItem.usageStation}
                              </Chip>
                            </TableCell>
                            <TableCell>{calculatedItem.usagePerSet}</TableCell>
                            <TableCell>{calculatedItem.usageCount.toLocaleString()}</TableCell>
                            <TableCell className="text-blue-600 font-medium">{calculatedItem.monthlyCapacity.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge color="default" variant="flat">{calculatedItem.minStock}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge color="secondary" variant="flat">{calculatedItem.maxStock}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge color="success" variant="flat" size="lg">{calculatedItem.monthlyDemand}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge color="danger" variant="flat" size="lg">{calculatedItem.monthlyNetDemand}</Badge>
                            </TableCell>
                            <TableCell className="font-bold text-green-600">{calculatedItem.actualOrder}</TableCell>
                            <TableCell className="text-sm text-gray-600">{calculatedItem.moqRemark}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Tooltip content="編輯">
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    color="primary"
                                    onClick={() => handleEditB453CalcItem(calculatedItem)}
                                  >
                                    <EditIcon />
                                  </Button>
                                </Tooltip>
                                {isLinked ? (
                                  <Tooltip content="查看關聯管控表">
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      size="sm"
                                      color="success"
                                      onClick={() => {
                                        // 跳转到管控表并高亮关联项目
                                        setActiveB453Tab("management");
                                        setTimeout(() => {
                                          const element = document.getElementById(`mgmt-row-${calculatedItem.managementId}`);
                                          if (element) {
                                            element.scrollIntoView({ behavior: 'smooth' });
                                            element.style.backgroundColor = '#dcfce7';
                                            setTimeout(() => {
                                              element.style.backgroundColor = '';
                                            }, 2000);
                                          }
                                        }, 100);
                                      }}
                                    >
                                      🔗
                                    </Button>
                                  </Tooltip>
                                ) : (
                                  <Tooltip content="創建關聯管控">
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      size="sm"
                                      color="warning"
                                      onClick={() => {
                                        // 创建新的管控表项目
                                        const newMgmtId = Math.max(...b453Data.map(item => item.id), 0) + 1;
                                        const newMgmtItem: B453SupplyItem = {
                                          id: newMgmtId,
                                          serialNumber: newMgmtId,
                                          materialDescription: calculatedItem.materialName,
                                          unit: "pcs",
                                          purchaser: "待設定",
                                          unitPrice: calculatedItem.unitPrice || 0,
                                          minSafetyStock: calculatedItem.minStock,
                                          maxSafetyStock: calculatedItem.maxStock,
                                          moq: calculatedItem.moq || 100,
                                          leadTimeWeeks: 15,
                                          apr2025Stock: 0,
                                          may2025Demand: 0,
                                          may2025Stock: 0,
                                          jun2025Demand: 0,
                                          jun2025Stock: 0,
                                          jul2025Demand: calculatedItem.monthlyDemand,
                                          jul2025Stock: 0,
                                          aug2025Demand: 0,
                                          remark: "由計算表創建",
                                          calculationId: calculatedItem.id,
                                          hasCalculation: true
                                        };
                                        setB453Data([...b453Data, newMgmtItem]);
                                        setB453CalculationData(b453CalculationData.map(calc => 
                                          calc.id === calculatedItem.id 
                                            ? { ...calc, managementId: newMgmtId, linkedMaterial: calculatedItem.materialName }
                                            : calc
                                        ));
                                        setActiveB453Tab("management");
                                      }}
                                    >
                                      ➕
                                    </Button>
                                  </Tooltip>
                                )}
                                <Tooltip content="同步數據">
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    color="secondary"
                                    onClick={() => {
                                      if (isLinked) {
                                        // 同步管控表数据到计算表
                                        const syncedItem = syncB453CalculationFromManagement(
                                          b453Data.find(mgmt => mgmt.id === calculatedItem.managementId)!
                                        );
                                        if (syncedItem) {
                                          setB453CalculationData(b453CalculationData.map(calc => 
                                            calc.id === calculatedItem.id ? syncedItem : calc
                                          ));
                                        }
                                      }
                                    }}
                                    isDisabled={!isLinked}
                                  >
                                    🔄
                                  </Button>
                                </Tooltip>
                                <Tooltip content="刪除">
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    color="danger"
                                    onClick={() => handleDeleteB453CalcItem(calculatedItem.id)}
                                  >
                                    <TrashIcon />
                                  </Button>
                                </Tooltip>
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
                  <h3 className="text-lg font-bold text-purple-800 mb-4">📈 產能預測數據</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Input
                      label="Mar-24"
                      type="number"
                      value={b453ForecastData.mar24.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, mar24: parseInt(value) || 0})}
                    />
                    <Input
                      label="Oct-24"
                      type="number"
                      value={b453ForecastData.oct24.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, oct24: parseInt(value) || 0})}
                    />
                    <Input
                      label="Dec-24"
                      type="number"
                      value={b453ForecastData.dec24.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, dec24: parseInt(value) || 0})}
                    />
                    <Input
                      label="Jan-25"
                      type="number"
                      value={b453ForecastData.jan25.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, jan25: parseInt(value) || 0})}
                    />
                    <Input
                      label="Feb-25"
                      type="number"
                      value={b453ForecastData.feb25.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, feb25: parseInt(value) || 0})}
                    />
                    <Input
                      label="Mar-25"
                      type="number"
                      value={b453ForecastData.mar25.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, mar25: parseInt(value) || 0})}
                    />
                    <Input
                      label="Apr-25"
                      type="number"
                      value={b453ForecastData.apr25.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, apr25: parseInt(value) || 0})}
                    />
                    <Input
                      label="May-25"
                      type="number"
                      value={b453ForecastData.may25.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, may25: parseInt(value) || 0})}
                    />
                    <Input
                      label="Jun-25"
                      type="number"
                      value={b453ForecastData.jun25.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, jun25: parseInt(value) || 0})}
                    />
                    <Input
                      label="Jul-25"
                      type="number"
                      value={b453ForecastData.jul25.toString()}
                      onValueChange={(value) => setB453ForecastData({...b453ForecastData, jul25: parseInt(value) || 0})}
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
          selectedKey={activeB482AndorTab} 
          onSelectionChange={(key) => setActiveB482AndorTab(key as string)}
          size="md"
          color="primary"
          variant="underlined"
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

  return (
    <div className="flex flex-col gap-6 py-8 px-4 md:px-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className={title()}>耗材管理系統</h1>
        <p className="text-gray-600 mt-2">B482申請表 & Andor需求計算 & B453 SMT ATE管控表</p>
      </div>

      {/* Tab切换 */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        size="lg"
        color="primary"
        variant="bordered"
      >
        <Tab key="b482-andor" title="B482 & Andor 申請系統">
          <B482AndorTab />
        </Tab>
        <Tab key="b453" title="B453 SMT ATE">
          <B453Tab />
        </Tab>
      </Tabs>

      {/* B482添加模态框 */}
      <Modal isOpen={showB482AddModal} onClose={() => setShowB482AddModal(false)} size="5xl">
        <ModalContent>
          <ModalHeader>添加B482項目</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="序號"
                type="number"
                value={newB482Item.serialNumber?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, serialNumber: parseInt(value) || 0})}
              />
              <Select
                label="單位"
                selectedKeys={[newB482Item.unit || "pcs"]}
                onSelectionChange={(keys) => {
                  const unit = Array.from(keys)[0] as string;
                  setNewB482Item({...newB482Item, unit});
                }}
              >
                <SelectItem key="pcs">pcs</SelectItem>
                <SelectItem key="支">支</SelectItem>
                <SelectItem key="個">個</SelectItem>
                <SelectItem key="條">條</SelectItem>
              </Select>
              <Input
                label="物料描述"
                value={newB482Item.materialDescription || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, materialDescription: value})}
                className="md:col-span-2"
              />
              <Input
                label="採購員"
                value={newB482Item.purchaser || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, purchaser: value})}
              />
              <Input
                label="單價(RMB)"
                type="number"
                value={newB482Item.unitPrice?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, unitPrice: parseFloat(value) || 0})}
              />
              <Input
                label="最高安全庫存"
                type="number"
                value={newB482Item.maxSafetyStock?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, maxSafetyStock: parseInt(value) || 0})}
              />
              <Input
                label="最低安全庫存"
                type="number"
                value={newB482Item.minSafetyStock?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, minSafetyStock: parseInt(value) || 0})}
              />
              <Input
                label="最小採購量(MOQ)"
                type="number"
                value={newB482Item.moq?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, moq: parseInt(value) || 0})}
              />
              <Input
                label="未採購量(RMB)"
                type="number"
                value={newB482Item.unpurchasedAmount?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, unpurchasedAmount: parseFloat(value) || 0})}
              />
              <Input
                label="L/T(Day)"
                type="number"
                value={newB482Item.leadTime?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, leadTime: parseInt(value) || 0})}
              />
              <Input
                label="2025年6月份"
                type="number"
                value={newB482Item.june2025?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, june2025: parseInt(value) || 0})}
              />
              <Input
                label="2025年7月份"
                type="number"
                value={newB482Item.july2025?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, july2025: parseInt(value) || 0})}
              />
              <Input
                label="7月M1"
                type="number"
                value={newB482Item.julyM1?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, julyM1: parseInt(value) || 0})}
              />
              <Input
                label="7月M2"
                type="number"
                value={newB482Item.julyM2?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, julyM2: parseInt(value) || 0})}
              />
              <Input
                label="7月M3"
                type="number"
                value={newB482Item.julyM3?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, julyM3: parseInt(value) || 0})}
              />
              <Input
                label="7月M4"
                type="number"
                value={newB482Item.julyM4?.toString() || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, julyM4: parseInt(value) || 0})}
              />
              <Textarea
                label="備註"
                value={newB482Item.remark || ""}
                onValueChange={(value) => setNewB482Item({...newB482Item, remark: value})}
                className="md:col-span-2"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onClick={() => setShowB482AddModal(false)}>取消</Button>
            <Button color="primary" onClick={handleAddB482Item}>添加</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* B482编辑模态框 */}
      <Modal isOpen={showB482EditModal} onClose={() => setShowB482EditModal(false)} size="5xl">
        <ModalContent>
          <ModalHeader>編輯B482項目</ModalHeader>
          <ModalBody>
            {editingB482Item && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="序號"
                  type="number"
                  value={editingB482Item.serialNumber.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, serialNumber: parseInt(value) || 0})}
                />
                <Select
                  label="單位"
                  selectedKeys={[editingB482Item.unit]}
                  onSelectionChange={(keys) => {
                    const unit = Array.from(keys)[0] as string;
                    setEditingB482Item({...editingB482Item, unit});
                  }}
                >
                  <SelectItem key="pcs">pcs</SelectItem>
                  <SelectItem key="支">支</SelectItem>
                  <SelectItem key="個">個</SelectItem>
                  <SelectItem key="條">條</SelectItem>
                </Select>
                <Input
                  label="物料描述"
                  value={editingB482Item.materialDescription}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, materialDescription: value})}
                  className="md:col-span-2"
                />
                <Input
                  label="採購員"
                  value={editingB482Item.purchaser}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, purchaser: value})}
                />
                <Input
                  label="單價(RMB)"
                  type="number"
                  value={editingB482Item.unitPrice.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, unitPrice: parseFloat(value) || 0})}
                />
                <Input
                  label="最高安全庫存"
                  type="number"
                  value={editingB482Item.maxSafetyStock.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, maxSafetyStock: parseInt(value) || 0})}
                />
                <Input
                  label="最低安全庫存"
                  type="number"
                  value={editingB482Item.minSafetyStock.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, minSafetyStock: parseInt(value) || 0})}
                />
                <Input
                  label="最小採購量(MOQ)"
                  type="number"
                  value={editingB482Item.moq.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, moq: parseInt(value) || 0})}
                />
                <Input
                  label="未採購量(RMB)"
                  type="number"
                  value={editingB482Item.unpurchasedAmount.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, unpurchasedAmount: parseFloat(value) || 0})}
                />
                <Input
                  label="L/T(Day)"
                  type="number"
                  value={editingB482Item.leadTime.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, leadTime: parseInt(value) || 0})}
                />
                <Input
                  label="2025年6月份"
                  type="number"
                  value={editingB482Item.june2025.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, june2025: parseInt(value) || 0})}
                />
                <Input
                  label="2025年7月份"
                  type="number"
                  value={editingB482Item.july2025.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, july2025: parseInt(value) || 0})}
                />
                <Input
                  label="7月M1"
                  type="number"
                  value={editingB482Item.julyM1.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, julyM1: parseInt(value) || 0})}
                />
                <Input
                  label="7月M2"
                  type="number"
                  value={editingB482Item.julyM2.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, julyM2: parseInt(value) || 0})}
                />
                <Input
                  label="7月M3"
                  type="number"
                  value={editingB482Item.julyM3.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, julyM3: parseInt(value) || 0})}
                />
                <Input
                  label="7月M4"
                  type="number"
                  value={editingB482Item.julyM4.toString()}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, julyM4: parseInt(value) || 0})}
                />
                <Textarea
                  label="備註"
                  value={editingB482Item.remark}
                  onValueChange={(value) => setEditingB482Item({...editingB482Item, remark: value})}
                  className="md:col-span-2"
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onClick={() => setShowB482EditModal(false)}>取消</Button>
            <Button color="primary" onClick={handleSaveB482Edit}>保存</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Andor添加模态框 */}
      <Modal isOpen={showAndorAddModal} onClose={() => setShowAndorAddModal(false)} size="4xl">
        <ModalContent>
          <ModalHeader>添加Andor項目</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="月份"
                selectedKeys={[newAndorItem.month || "2025.7"]}
                onSelectionChange={(keys) => {
                  const month = Array.from(keys)[0] as string;
                  setNewAndorItem({...newAndorItem, month});
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
                onValueChange={(value) => setNewAndorItem({...newAndorItem, no: parseInt(value) || 0})}
              />
              <Input
                label="耗材名稱"
                value={newAndorItem.materialName || ""}
                onValueChange={(value) => setNewAndorItem({...newAndorItem, materialName: value})}
                className="md:col-span-2"
              />
              <Input
                label="使用站別"
                value={newAndorItem.usageStation || ""}
                onValueChange={(value) => setNewAndorItem({...newAndorItem, usageStation: value})}
              />
              <Input
                label="每套機用量"
                type="number"
                value={newAndorItem.usagePerSet?.toString() || ""}
                onValueChange={(value) => setNewAndorItem({...newAndorItem, usagePerSet: parseInt(value) || 0})}
              />
              <Input
                label="使用次數"
                type="number"
                value={newAndorItem.usageCount?.toString() || ""}
                onValueChange={(value) => setNewAndorItem({...newAndorItem, usageCount: parseInt(value) || 0})}
              />
              <Input
                label="當月產能"
                type="number"
                value={newAndorItem.monthlyCapacity?.toString() || ""}
                onValueChange={(value) => setNewAndorItem({...newAndorItem, monthlyCapacity: parseInt(value) || 0})}
              />
              <Textarea
                label="備註"
                value={newAndorItem.remark || ""}
                onValueChange={(value) => setNewAndorItem({...newAndorItem, remark: value})}
                className="md:col-span-2"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onClick={() => setShowAndorAddModal(false)}>取消</Button>
            <Button color="primary" onClick={handleAddAndorItem}>添加</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Andor编辑模态框 */}
      <Modal isOpen={showAndorEditModal} onClose={() => setShowAndorEditModal(false)} size="4xl">
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
                    setEditingAndorItem({...editingAndorItem, month});
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
                  onValueChange={(value) => setEditingAndorItem({...editingAndorItem, no: parseInt(value) || 0})}
                />
                <Input
                  label="耗材名稱"
                  value={editingAndorItem.materialName}
                  onValueChange={(value) => setEditingAndorItem({...editingAndorItem, materialName: value})}
                  className="md:col-span-2"
                />
                <Input
                  label="使用站別"
                  value={editingAndorItem.usageStation}
                  onValueChange={(value) => setEditingAndorItem({...editingAndorItem, usageStation: value})}
                />
                <Input
                  label="每套機用量"
                  type="number"
                  value={editingAndorItem.usagePerSet.toString()}
                  onValueChange={(value) => setEditingAndorItem({...editingAndorItem, usagePerSet: parseInt(value) || 0})}
                />
                <Input
                  label="使用次數"
                  type="number"
                  value={editingAndorItem.usageCount.toString()}
                  onValueChange={(value) => setEditingAndorItem({...editingAndorItem, usageCount: parseInt(value) || 0})}
                />
                <Input
                  label="當月產能"
                  type="number"
                  value={editingAndorItem.monthlyCapacity.toString()}
                  onValueChange={(value) => setEditingAndorItem({...editingAndorItem, monthlyCapacity: parseInt(value) || 0})}
                />
                <div className="md:col-span-2 grid grid-cols-3 gap-4">
                  <Input
                    label="最低庫存"
                    type="number"
                    value={editingAndorItem.minInventory.toString()}
                    isReadOnly
                    description="自動計算"
                  />
                  <Input
                    label="最高庫存"
                    type="number"
                    value={editingAndorItem.maxInventory.toString()}
                    isReadOnly
                    description="自動計算"
                  />
                  <Input
                    label="當月需求"
                    type="number"
                    value={editingAndorItem.monthlyDemand.toString()}
                    isReadOnly
                    description="自動計算"
                  />
                </div>
                <Textarea
                  label="備註"
                  value={editingAndorItem.remark}
                  onValueChange={(value) => setEditingAndorItem({...editingAndorItem, remark: value})}
                  className="md:col-span-2"
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onClick={() => setShowAndorEditModal(false)}>取消</Button>
            <Button color="primary" onClick={handleSaveAndorEdit}>保存</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* B453添加模态框 */}
      <Modal isOpen={showB453AddModal} onClose={() => setShowB453AddModal(false)} size="5xl">
        <ModalContent>
          <ModalHeader>添加B453項目</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="序號"
                type="number"
                value={newB453Item.serialNumber?.toString() || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, serialNumber: parseInt(value) || 0})}
              />
              <Select
                label="單位"
                selectedKeys={[newB453Item.unit || "pcs"]}
                onSelectionChange={(keys) => {
                  const unit = Array.from(keys)[0] as string;
                  setNewB453Item({...newB453Item, unit});
                }}
              >
                <SelectItem key="pcs">pcs</SelectItem>
                <SelectItem key="支">支</SelectItem>
                <SelectItem key="個">個</SelectItem>
                <SelectItem key="條">條</SelectItem>
              </Select>
              <Input
                label="物料描述"
                value={newB453Item.materialDescription || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, materialDescription: value})}
                className="md:col-span-2"
              />
              <Input
                label="採購員"
                value={newB453Item.purchaser || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, purchaser: value})}
              />
              <Input
                label="單價(RMB)"
                type="number"
                value={newB453Item.unitPrice?.toString() || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, unitPrice: parseFloat(value) || 0})}
              />
              <Input
                label="安全庫存-最低"
                type="number"
                value={newB453Item.minSafetyStock?.toString() || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, minSafetyStock: parseInt(value) || 0})}
              />
              <Input
                label="安全庫存-最高"
                type="number"
                value={newB453Item.maxSafetyStock?.toString() || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, maxSafetyStock: parseInt(value) || 0})}
              />
              <Input
                label="最小采购量(MOQ)"
                type="number"
                value={newB453Item.moq?.toString() || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, moq: parseInt(value) || 0})}
              />
              <Input
                label="L/T(Wks)"
                type="number"
                value={newB453Item.leadTimeWeeks?.toString() || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, leadTimeWeeks: parseInt(value) || 0})}
              />
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-blue-600">月度明細數據</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    label="2025/4/1庫存"
                    type="number"
                    value={newB453Item.apr2025Stock?.toString() || ""}
                    onValueChange={(value) => setNewB453Item({...newB453Item, apr2025Stock: parseInt(value) || 0})}
                  />
                  <Input
                    label="5月需求"
                    type="number"
                    value={newB453Item.may2025Demand?.toString() || ""}
                    onValueChange={(value) => setNewB453Item({...newB453Item, may2025Demand: parseInt(value) || 0})}
                  />
                  <Input
                    label="2025/5/22庫存"
                    type="number"
                    value={newB453Item.may2025Stock?.toString() || ""}
                    onValueChange={(value) => setNewB453Item({...newB453Item, may2025Stock: parseInt(value) || 0})}
                  />
                  <Input
                    label="6月需求"
                    type="number"
                    value={newB453Item.jun2025Demand?.toString() || ""}
                    onValueChange={(value) => setNewB453Item({...newB453Item, jun2025Demand: parseInt(value) || 0})}
                  />
                  <Input
                    label="2025/6/23庫存"
                    type="number"
                    value={newB453Item.jun2025Stock?.toString() || ""}
                    onValueChange={(value) => setNewB453Item({...newB453Item, jun2025Stock: parseInt(value) || 0})}
                  />
                  <Input
                    label="7月需求"
                    type="number"
                    value={newB453Item.jul2025Demand?.toString() || ""}
                    onValueChange={(value) => setNewB453Item({...newB453Item, jul2025Demand: parseInt(value) || 0})}
                  />
                  <Input
                    label="2025/7/20庫存"
                    type="number"
                    value={newB453Item.jul2025Stock?.toString() || ""}
                    onValueChange={(value) => setNewB453Item({...newB453Item, jul2025Stock: parseInt(value) || 0})}
                  />
                  <Input
                    label="8月需求"
                    type="number"
                    value={newB453Item.aug2025Demand?.toString() || ""}
                    onValueChange={(value) => setNewB453Item({...newB453Item, aug2025Demand: parseInt(value) || 0})}
                  />
                </div>
              </div>
              <Textarea
                label="備註"
                value={newB453Item.remark || ""}
                onValueChange={(value) => setNewB453Item({...newB453Item, remark: value})}
                className="md:col-span-2"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onClick={() => setShowB453AddModal(false)}>取消</Button>
            <Button color="primary" onClick={handleAddB453Item}>添加</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* B453编辑模态框 */}
      <Modal isOpen={showB453EditModal} onClose={() => setShowB453EditModal(false)} size="5xl">
        <ModalContent>
          <ModalHeader>編輯B453項目</ModalHeader>
          <ModalBody>
            {editingB453Item && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="序號"
                  type="number"
                  value={editingB453Item.serialNumber.toString()}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, serialNumber: parseInt(value) || 0})}
                />
                <Select
                  label="單位"
                  selectedKeys={[editingB453Item.unit]}
                  onSelectionChange={(keys) => {
                    const unit = Array.from(keys)[0] as string;
                    setEditingB453Item({...editingB453Item, unit});
                  }}
                >
                  <SelectItem key="pcs">pcs</SelectItem>
                  <SelectItem key="支">支</SelectItem>
                  <SelectItem key="個">個</SelectItem>
                  <SelectItem key="條">條</SelectItem>
                </Select>
                <Input
                  label="物料描述"
                  value={editingB453Item.materialDescription}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, materialDescription: value})}
                  className="md:col-span-2"
                />
                <Input
                  label="採購員"
                  value={editingB453Item.purchaser}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, purchaser: value})}
                />
                <Input
                  label="單價(RMB)"
                  type="number"
                  value={editingB453Item.unitPrice.toString()}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, unitPrice: parseFloat(value) || 0})}
                />
                <Input
                  label="安全庫存-最低"
                  type="number"
                  value={editingB453Item.minSafetyStock.toString()}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, minSafetyStock: parseInt(value) || 0})}
                />
                <Input
                  label="安全庫存-最高"
                  type="number"
                  value={editingB453Item.maxSafetyStock.toString()}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, maxSafetyStock: parseInt(value) || 0})}
                />
                <Input
                  label="最小采购量(MOQ)"
                  type="number"
                  value={editingB453Item.moq.toString()}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, moq: parseInt(value) || 0})}
                />
                <Input
                  label="L/T(Wks)"
                  type="number"
                  value={editingB453Item.leadTimeWeeks.toString()}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, leadTimeWeeks: parseInt(value) || 0})}
                />
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">月度明細數據</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Input
                      label="2025/4/1庫存"
                      type="number"
                      value={editingB453Item.apr2025Stock.toString()}
                      onValueChange={(value) => setEditingB453Item({...editingB453Item, apr2025Stock: parseInt(value) || 0})}
                    />
                    <Input
                      label="5月需求"
                      type="number"
                      value={editingB453Item.may2025Demand.toString()}
                      onValueChange={(value) => setEditingB453Item({...editingB453Item, may2025Demand: parseInt(value) || 0})}
                    />
                    <Input
                      label="2025/5/22庫存"
                      type="number"
                      value={editingB453Item.may2025Stock.toString()}
                      onValueChange={(value) => setEditingB453Item({...editingB453Item, may2025Stock: parseInt(value) || 0})}
                    />
                    <Input
                      label="6月需求"
                      type="number"
                      value={editingB453Item.jun2025Demand.toString()}
                      onValueChange={(value) => setEditingB453Item({...editingB453Item, jun2025Demand: parseInt(value) || 0})}
                    />
                    <Input
                      label="2025/6/23庫存"
                      type="number"
                      value={editingB453Item.jun2025Stock.toString()}
                      onValueChange={(value) => setEditingB453Item({...editingB453Item, jun2025Stock: parseInt(value) || 0})}
                    />
                    <Input
                      label="7月需求"
                      type="number"
                      value={editingB453Item.jul2025Demand.toString()}
                      onValueChange={(value) => setEditingB453Item({...editingB453Item, jul2025Demand: parseInt(value) || 0})}
                    />
                    <Input
                      label="2025/7/20庫存"
                      type="number"
                      value={editingB453Item.jul2025Stock.toString()}
                      onValueChange={(value) => setEditingB453Item({...editingB453Item, jul2025Stock: parseInt(value) || 0})}
                    />
                    <Input
                      label="8月需求"
                      type="number"
                      value={editingB453Item.aug2025Demand.toString()}
                      onValueChange={(value) => setEditingB453Item({...editingB453Item, aug2025Demand: parseInt(value) || 0})}
                    />
                  </div>
                </div>
                <Textarea
                  label="備註"
                  value={editingB453Item.remark}
                  onValueChange={(value) => setEditingB453Item({...editingB453Item, remark: value})}
                  className="md:col-span-2"
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onClick={() => setShowB453EditModal(false)}>取消</Button>
            <Button color="primary" onClick={handleSaveB453Edit}>保存</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
