import type { SupplyItem, InventoryRecord } from '@/services/supplies';

export interface ConsistencyResult {
  isValid: boolean;
  issues: string[];
}

export interface InventorySummary {
  totalSupplies: number;
  totalRecords: number;
  lowStockItems: number;
  recentActivity: number;
  totalStock: number;
  categories: number;
  byCategory: Record<string, {
    count: number;
    totalStock: number;
    lowStockCount: number;
  }>;
}

/**
 * 验证库存总览和变动台账的数据一致性
 */
export function validateDataConsistency(supplies: SupplyItem[], records: InventoryRecord[]): ConsistencyResult {
  const issues: string[] = [];

  // 检查每个耗材的库存一致性
  supplies.forEach(supply => {
    const supplyRecords = records.filter(record => record.supply === supply.id);
    let calculatedStock = 0;

    supplyRecords.forEach(record => {
      if (record.type === 'in') {
        calculatedStock += record.quantity;
      } else if (record.type === 'out') {
        calculatedStock -= record.quantity;
      } else if (record.type === 'adjust') {
        calculatedStock = record.new_stock;
      }
    });

    // 如果耗材有库存但计算出的库存为0，可能是数据问题
    if (supply.current_stock > 0) {
      if (calculatedStock < 0) {
        issues.push(`耗材 "${supply.name}" 计算库存为负数: ${calculatedStock}${supply.unit}`);
      }
    }

    // 检查库存是否与实际记录一致
    if (Math.abs(calculatedStock - supply.current_stock) > 0.01) {
      issues.push(
        `耗材 "${supply.name}" 库存不一致: 实际库存 ${supply.current_stock}${supply.unit}, ` +
        `计算库存 ${calculatedStock}${supply.unit}`
      );
    }
  });

  // 检查记录中的耗材ID是否都存在
  const supplyIds = new Set(supplies.map(s => s.id));
  records.forEach(record => {
    if (!supplyIds.has(record.supply)) {
      issues.push(`记录中的耗材ID ${record.supply} 不存在于库存中`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * 生成库存变动摘要
 */
export function generateInventorySummary(supplies: SupplyItem[], records: InventoryRecord[]): InventorySummary {
  // 安全检查：确保参数是数组
  const safeSupplies = Array.isArray(supplies) ? supplies : [];
  const safeRecords = Array.isArray(records) ? records : [];
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const summary: InventorySummary = {
    totalSupplies: safeSupplies.length,
    totalRecords: safeRecords.length,
    lowStockItems: safeSupplies.filter(s => s.current_stock <= s.safety_stock).length,
    recentActivity: safeRecords.filter(r => new Date(r.timestamp) >= weekAgo).length,
    totalStock: safeSupplies.reduce((sum, item) => sum + item.current_stock, 0),
    categories: Array.from(new Set(safeSupplies.map(item => item.category))).length,
    byCategory: {}
  };

  // 按分类统计
  safeSupplies.forEach(supply => {
    if (!summary.byCategory[supply.category]) {
      summary.byCategory[supply.category] = {
        count: 0,
        totalStock: 0,
        lowStockCount: 0
      };
    }
    summary.byCategory[supply.category].count++;
    summary.byCategory[supply.category].totalStock += supply.current_stock;
    if (supply.current_stock <= supply.safety_stock) {
      summary.byCategory[supply.category].lowStockCount++;
    }
  });

  return summary;
}

/**
 * 修复数据不一致问题
 */
export function fixDataInconsistencies(supplies: SupplyItem[], records: InventoryRecord[]): {
  fixedSupplies: SupplyItem[];
  issues: string[];
} {
  const issues: string[] = [];
  const fixedSupplies = supplies.map(supply => {
    const supplyRecords = records.filter(record => record.supply === supply.id);
    let calculatedStock = 0;

    supplyRecords.forEach(record => {
      if (record.type === 'in') {
        calculatedStock += record.quantity;
      } else if (record.type === 'out') {
        calculatedStock -= record.quantity;
      } else if (record.type === 'adjust') {
        calculatedStock = record.new_stock;
      }
    });

    // 如果库存不一致，修复为计算出的库存
    if (Math.abs(calculatedStock - supply.current_stock) > 0.01) {
      issues.push(
        `已修复耗材 "${supply.name}" 的库存: ${supply.current_stock}${supply.unit} → ${calculatedStock}${supply.unit}`
      );
      return {
        ...supply,
        current_stock: calculatedStock
      };
    }

    return supply;
  });

  return { fixedSupplies, issues };
} 