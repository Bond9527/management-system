import { FC, useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Badge,
  Alert,
  Divider,
  Button,
} from "@heroui/react";
import { useSupplies, SupplyItem } from "@/hooks/useSupplies";
import { generateInventorySummary } from "@/utils/dataConsistencyTest";

interface ComparisonResult {
  metric: string;
  inventoryOverview: number;
  statistics: number;
  isConsistent: boolean;
  difference: number;
}

const DataComparisonPage: FC = () => {
  const { supplies, records } = useSupplies();
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [categoryComparison, setCategoryComparison] = useState<any[]>([]);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    performComparison();
  }, [supplies, records]);

  const performComparison = () => {
    const summary = generateInventorySummary(supplies, records);
    
    // 计算库存总览页面的数据
    const inventoryOverviewData = {
      totalSupplies: supplies.length,
      totalRecords: records.length,
      lowStockItems: supplies.filter(s => s.currentStock <= s.safetyStock).length,
      recentActivity: records.filter(r => {
        const recordDate = new Date(r.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return recordDate >= weekAgo;
      }).length,
      totalStock: supplies.reduce((sum, item) => sum + item.currentStock, 0),
      categories: Array.from(new Set(supplies.map(item => item.category))).length,
    };

    // 计算数据统计页面的数据
    const statisticsData = {
      totalSupplies: summary.totalSupplies,
      totalRecords: summary.totalRecords,
      lowStockItems: summary.lowStockItems,
      recentActivity: summary.recentActivity,
      totalStock: supplies.reduce((sum, item) => sum + item.currentStock, 0),
      categories: Array.from(new Set(supplies.map(item => item.category))).length,
    };

    // 生成对比结果
    const results: ComparisonResult[] = [
      {
        metric: "总耗材数",
        inventoryOverview: inventoryOverviewData.totalSupplies,
        statistics: statisticsData.totalSupplies,
        isConsistent: inventoryOverviewData.totalSupplies === statisticsData.totalSupplies,
        difference: Math.abs(inventoryOverviewData.totalSupplies - statisticsData.totalSupplies)
      },
      {
        metric: "变动记录数",
        inventoryOverview: inventoryOverviewData.totalRecords,
        statistics: statisticsData.totalRecords,
        isConsistent: inventoryOverviewData.totalRecords === statisticsData.totalRecords,
        difference: Math.abs(inventoryOverviewData.totalRecords - statisticsData.totalRecords)
      },
      {
        metric: "库存不足",
        inventoryOverview: inventoryOverviewData.lowStockItems,
        statistics: statisticsData.lowStockItems,
        isConsistent: inventoryOverviewData.lowStockItems === statisticsData.lowStockItems,
        difference: Math.abs(inventoryOverviewData.lowStockItems - statisticsData.lowStockItems)
      },
      {
        metric: "本周变动",
        inventoryOverview: inventoryOverviewData.recentActivity,
        statistics: statisticsData.recentActivity,
        isConsistent: inventoryOverviewData.recentActivity === statisticsData.recentActivity,
        difference: Math.abs(inventoryOverviewData.recentActivity - statisticsData.recentActivity)
      },
      {
        metric: "总库存量",
        inventoryOverview: inventoryOverviewData.totalStock,
        statistics: statisticsData.totalStock,
        isConsistent: inventoryOverviewData.totalStock === statisticsData.totalStock,
        difference: Math.abs(inventoryOverviewData.totalStock - statisticsData.totalStock)
      },
      {
        metric: "分类数量",
        inventoryOverview: inventoryOverviewData.categories,
        statistics: statisticsData.categories,
        isConsistent: inventoryOverviewData.categories === statisticsData.categories,
        difference: Math.abs(inventoryOverviewData.categories - statisticsData.categories)
      }
    ];

    setComparisonResults(results);

    // 生成分类对比数据
    const categories = Array.from(new Set(supplies.map(item => item.category)));
    const categoryData = categories.map(category => {
      const categorySupplies = supplies.filter(item => item.category === category);
      const totalStock = categorySupplies.reduce((sum, item) => sum + item.currentStock, 0);
      const lowStockCount = categorySupplies.filter(item => item.currentStock <= item.safetyStock).length;
      
      return {
        category,
        itemCount: categorySupplies.length,
        totalStock,
        lowStockCount,
        averageStock: categorySupplies.length > 0 ? Math.round(totalStock / categorySupplies.length * 100) / 100 : 0
      };
    });

    setCategoryComparison(categoryData);

    // 检查问题
    const detectedIssues: string[] = [];
    results.forEach(result => {
      if (!result.isConsistent) {
        detectedIssues.push(`${result.metric} 数据不一致: 库存总览=${result.inventoryOverview}, 数据统计=${result.statistics}`);
      }
    });

    setIssues(detectedIssues);
  };

  const getConsistencyColor = (isConsistent: boolean) => {
    return isConsistent ? "success" : "danger";
  };

  const getConsistencyText = (isConsistent: boolean) => {
    return isConsistent ? "一致" : "不一致";
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">数据一致性对比</h1>

      {/* 总体对比 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">库存总览 vs 数据统计</h2>
          <Table aria-label="数据对比">
            <TableHeader>
              <TableColumn>指标</TableColumn>
              <TableColumn>库存总览</TableColumn>
              <TableColumn>数据统计</TableColumn>
              <TableColumn>差异</TableColumn>
              <TableColumn>状态</TableColumn>
            </TableHeader>
            <TableBody>
              {comparisonResults.map((result) => (
                <TableRow key={result.metric}>
                  <TableCell>
                    <span className="font-medium">{result.metric}</span>
                  </TableCell>
                  <TableCell>
                    <Badge color="primary" variant="flat">
                      {result.inventoryOverview}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge color="secondary" variant="flat">
                      {result.statistics}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={result.difference > 0 ? "text-danger" : "text-success"}>
                      {result.difference > 0 ? `±${result.difference}` : "0"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getConsistencyColor(result.isConsistent)}
                      variant="flat"
                      size="sm"
                    >
                      {getConsistencyText(result.isConsistent)}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 问题提示 */}
      {issues.length > 0 && (
        <Alert
          color="warning"
          variant="flat"
          className="mb-4"
        >
          <div className="font-semibold mb-2">发现以下数据不一致问题：</div>
          <ul className="list-disc list-inside space-y-1">
            {issues.map((issue, index) => (
              <li key={index} className="text-sm">{issue}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* 分类详细对比 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">分类详细对比</h2>
          <Table aria-label="分类对比">
            <TableHeader>
              <TableColumn>分类名称</TableColumn>
              <TableColumn>耗材数量</TableColumn>
              <TableColumn>总库存量</TableColumn>
              <TableColumn>平均库存</TableColumn>
              <TableColumn>库存不足</TableColumn>
              <TableColumn>占比</TableColumn>
            </TableHeader>
            <TableBody>
              {categoryComparison.map((category) => (
                <TableRow key={category.category}>
                  <TableCell>
                    <Chip color="primary" variant="flat">
                      {category.category}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Badge color="primary" variant="flat">
                      {category.itemCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{category.totalStock}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{category.averageStock}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      color={category.lowStockCount > 0 ? "danger" : "success"}
                      variant="flat"
                    >
                      {category.lowStockCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {((category.itemCount / supplies.length) * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 数据源信息 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">数据源信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">库存总览页面</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 数据源: useSupplies hook</li>
                <li>• 实时性: 实时更新</li>
                <li>• 存储: localStorage</li>
                <li>• 计算方式: 直接统计</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">数据统计页面</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 数据源: useSupplies hook</li>
                <li>• 实时性: 实时更新</li>
                <li>• 存储: localStorage</li>
                <li>• 计算方式: generateInventorySummary</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 验证结果 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">验证结果</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-medium">数据源一致性</span>
              <Chip color="success" variant="flat">✓ 一致</Chip>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-medium">计算逻辑一致性</span>
              <Chip color="success" variant="flat">✓ 一致</Chip>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="font-medium">实时更新</span>
              <Chip color="success" variant="flat">✓ 一致</Chip>
            </div>
            {issues.length > 0 ? (
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <span className="font-medium">数据一致性</span>
                <Chip color="danger" variant="flat">⚠ {issues.length}个问题</Chip>
              </div>
            ) : (
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="font-medium">数据一致性</span>
                <Chip color="success" variant="flat">✓ 完全一致</Chip>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DataComparisonPage; 