import { FC, useState, Fragment, useEffect } from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Chip,
  DateRangePicker,
  DateValue,
  Badge,
  Spinner,
} from "@heroui/react";
import { SearchIcon, RefreshIcon, FilterIcon, WarningIcon } from "@/components/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useSupplies, SupplyItem, InventoryRecord } from "@/hooks/useSupplies";
import { generateInventorySummary } from "@/utils/dataConsistencyTest";
import { formatDate } from "@/utils/dateUtils";

const COLORS = {
  primary: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  secondary: "#8B5CF6",
  info: "#6366F1",
  gray: "#9CA3AF",
  lightGray: "#E5E7EB",
};

// 图表通用样式
const chartStyles = {
  tooltip: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    border: "none",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    padding: "12px 16px",
  },
  grid: {
    stroke: "#E5E7EB",
    strokeDasharray: "3 3",
  },
  axis: {
    stroke: "#E5E7EB",
    tick: {
      fill: "#6B7280",
      fontSize: 12,
    },
  },
};

// 根据类别返回对应的单位
const getUnitByCategory = (category: string): string => {
  const unitMap: Record<string, string> = {
    "探针": "支",
    "清洁剂": "瓶",
    "继电器": "个",
    "连接器": "个",
    "轴承": "个",
    "手动工具": "套",
    "安全防护用品": "套",
    "包装材料": "包",
    "办公用品": "个",
    "其他": "个"
  };
  return unitMap[category] || "个";
};

export default function SuppliesStatisticsPage() {
  const { supplies, records } = useSupplies();
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOperationType, setSelectedOperationType] = useState<string>("all");
  const [isResetting, setIsResetting] = useState(false);

  // 获取所有类别
  const categories = Array.from(new Set(supplies.map(item => item.category)));

  // 生成真实的趋势数据
  const generateTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayRecords = records.filter(record => {
        const recordDate = formatDate(record.timestamp);
        return recordDate === date;
      });

      const inCount = dayRecords.filter(r => r.type === 'in').reduce((sum, r) => sum + r.quantity, 0);
      const outCount = dayRecords.filter(r => r.type === 'out').reduce((sum, r) => sum + r.quantity, 0);

      return {
        date,
        in: inCount,
        out: outCount
      };
    });
  };

  // 生成真实的分类数据
  const generateCategoryData = () => {
    return categories.map(category => {
      const categorySupplies = supplies.filter(item => item.category === category);
      const totalStock = categorySupplies.reduce((sum, item) => sum + item.current_stock, 0);
      return {
        name: category,
        value: totalStock
      };
    });
  };

  // 生成真实的排名数据
  const generateRankingData = () => {
    return supplies
      .map(item => ({
        name: item.name,
        value: item.current_stock,
        unit: item.unit,
        category: item.category
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // 取前10名
  };

  // 生成真实的低库存数据
  const generateLowStockData = () => {
    return supplies
      .filter(item => item.current_stock <= item.safety_stock)
      .map(item => ({
        name: item.name,
        current: item.current_stock,
        threshold: item.safety_stock,
        unit: item.unit,
        category: item.category
      }))
      .sort((a, b) => a.current - b.current);
  };

  // 生成操作员数据
  const generateOperatorData = () => {
    const operatorStats: Record<string, { name: string; value: number; department: string }> = {};
    
    records.forEach(record => {
      if (!operatorStats[record.operator]) {
        operatorStats[record.operator] = {
          name: record.operator,
          value: 0,
          department: record.department
        };
      }
      operatorStats[record.operator].value += record.quantity;
    });

    return Object.values(operatorStats)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // 取前5名
  };

  // 重置所有筛选条件和统计数据
  const handleReset = () => {
    setIsResetting(true);
    
    // 重置筛选条件
    setDateRange(null);
    setSelectedCategory("all");
    setSelectedOperationType("all");

    // 使用setTimeout确保重置动画效果
    setTimeout(() => {
      setIsResetting(false);
    }, 300);
  };

  // 根据筛选条件过滤数据
  const getFilteredData = () => {
    if (isResetting) {
      return {
        trendData: [],
        categoryData: [],
        rankingData: [],
        operatorData: [],
        lowStockData: [],
        monthlyComparisonData: []
      };
    }

    // 根据选择的类别过滤数据
    const filterByCategory = (data: any[]) => {
      if (selectedCategory === "all") return data;
      return data.filter(item => item.category === selectedCategory);
    };

    // 根据选择的操作类型过滤数据
    const filterByOperationType = (data: any[]) => {
      if (selectedOperationType === "all") return data;
      return data.filter(item => item.type === selectedOperationType);
    };

    // 根据日期范围过滤数据
    const filterByDateRange = (data: any[]) => {
      if (!dateRange) return data;
      const startDate = new Date(dateRange.start.toString());
      const endDate = new Date(dateRange.end.toString());
      return data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    };

    return {
      trendData: filterByDateRange(generateTrendData()),
      categoryData: selectedCategory === "all" 
        ? generateCategoryData() 
        : generateCategoryData().filter(item => item.name === selectedCategory),
      rankingData: filterByCategory(generateRankingData()),
      operatorData: generateOperatorData(),
      lowStockData: filterByCategory(generateLowStockData()),
      monthlyComparisonData: filterByDateRange(generateTrendData()) // 使用趋势数据作为月度对比
    };
  };

  const filteredData = getFilteredData();
  const summary = generateInventorySummary(supplies, records);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">{summary.totalSupplies}</div>
            <div className="text-sm text-gray-600">总耗材数</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">{summary.totalRecords}</div>
            <div className="text-sm text-gray-600">变动记录数</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-danger">{summary.lowStockItems}</div>
            <div className="text-sm text-gray-600">库存不足</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">{summary.recentActivity}</div>
            <div className="text-sm text-gray-600">本周变动</div>
          </CardBody>
        </Card>
      </div>

      {/* 筛选区 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">时间范围</label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">耗材分类</label>
              <Select
                selectedKeys={new Set([selectedCategory])}
                onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
                className="w-full"
              >
                <SelectItem key="all" textValue="全部">全部</SelectItem>
                <Fragment>
                  {categories.map((category) => (
                    <SelectItem key={category} textValue={category}>
                      {category}
                    </SelectItem>
                  ))}
                </Fragment>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
              <Select
                selectedKeys={new Set([selectedOperationType])}
                onSelectionChange={(keys) => setSelectedOperationType(Array.from(keys)[0] as string)}
                className="w-full"
              >
                <SelectItem key="all" textValue="全部">全部</SelectItem>
                <SelectItem key="in" textValue="入库">入库</SelectItem>
                <SelectItem key="out" textValue="出库">出库</SelectItem>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                color="primary"
                variant="flat"
                startContent={<SearchIcon />}
              >
                查询
              </Button>
              <Button
                color="default"
                variant="flat"
                startContent={<RefreshIcon />}
                onClick={handleReset}
                isLoading={isResetting}
              >
                重置
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 图表区1：出入库趋势 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">出入库趋势</h3>
              <p className="text-sm text-gray-500 mt-1">近7天出入库数量变化</p>
            </div>
            <div className="flex gap-2">
              <Chip color="primary" variant="flat">入库</Chip>
              <Chip color="danger" variant="flat">出库</Chip>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid.stroke} />
                <XAxis 
                  dataKey="date" 
                  stroke={chartStyles.axis.stroke}
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                />
                <YAxis 
                  stroke={chartStyles.axis.stroke}
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                  tickFormatter={(value) => `${value} 件`}
                />
                <Tooltip 
                  contentStyle={chartStyles.tooltip}
                  formatter={(value: number) => [`${value} 件`, "数量"]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    paddingBottom: "20px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="in" 
                  name="入库" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="out" 
                  name="出库" 
                  stroke={COLORS.danger} 
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* 图表区2：耗材分类使用占比 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">耗材分类使用占比</h3>
              <p className="text-sm text-gray-500 mt-1">各类耗材使用数量分布</p>
            </div>
            <Chip color="primary" variant="flat">数量统计</Chip>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  innerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  paddingAngle={2}
                >
                  {filteredData.categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={Object.values(COLORS)[index % Object.keys(COLORS).length]} 
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={chartStyles.tooltip}
                  formatter={(value: number) => [`${value} 件`, "使用数量"]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{
                    paddingLeft: "20px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* 图表区3：耗材使用排行榜 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">热门耗材排行榜</h3>
              <p className="text-sm text-gray-500 mt-1">使用频率最高的耗材排名</p>
            </div>
            <Chip color="primary" variant="flat">数量统计</Chip>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={filteredData.rankingData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 100,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid.stroke} />
                <XAxis 
                  dataKey="name" 
                  height={100}
                  interval={0}
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                  tickFormatter={(value) => {
                    return value.length > 8 ? `${value.slice(0, 8)}...` : value;
                  }}
                />
                <YAxis 
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                  tickFormatter={(value) => `${value} 件`}
                />
                <Tooltip 
                  contentStyle={chartStyles.tooltip}
                  formatter={(value: number, name: string, props: any) => [`${value} ${props.payload.unit}`, name]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    paddingBottom: "20px",
                  }}
                />
                <Bar 
                  dataKey="value" 
                  name="使用数量" 
                  fill={COLORS.primary}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* 图表区4：操作人使用排行 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">操作人使用排行</h3>
              <p className="text-sm text-gray-500 mt-1">操作频率最高的用户排名</p>
            </div>
            <Chip color="success" variant="flat">操作统计</Chip>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={filteredData.operatorData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 100,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid.stroke} />
                <XAxis 
                  dataKey="name" 
                  height={100}
                  interval={0}
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                />
                <YAxis 
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                  tickFormatter={(value) => `${value} 次`}
                />
                <Tooltip 
                  contentStyle={chartStyles.tooltip}
                  formatter={(value: number, name: string, props: any) => [`${value} 次`, `${name} (${props.payload.department})`]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    paddingBottom: "20px",
                  }}
                />
                <Bar 
                  dataKey="value" 
                  name="操作次数" 
                  fill={COLORS.success}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* 图表区5：库存告警分析 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">库存告警分析</h3>
              <p className="text-sm text-gray-500 mt-1">库存低于安全库存的耗材</p>
            </div>
            <Chip color="danger" variant="flat" startContent={<WarningIcon />}>
              库存不足
            </Chip>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={filteredData.lowStockData} 
                layout="vertical"
                margin={{
                  top: 20,
                  right: 30,
                  left: 120,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid.stroke} />
                <XAxis 
                  type="number" 
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                  tickFormatter={(value) => `${value} 件`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                />
                <Tooltip 
                  contentStyle={chartStyles.tooltip}
                  formatter={(value: number, name: string, props: any) => [`${value} ${props.payload.unit}`, name]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    paddingBottom: "20px",
                  }}
                />
                <Bar 
                  dataKey="current" 
                  name="当前库存" 
                  fill={COLORS.danger}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                />
                <Bar 
                  dataKey="threshold" 
                  name="安全库存" 
                  fill={COLORS.warning}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* 图表区6：月度统计对比 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">月度统计对比</h3>
              <p className="text-sm text-gray-500 mt-1">本月与上月使用量对比</p>
            </div>
            <div className="flex gap-2">
              <Chip color="primary" variant="flat">本月</Chip>
              <Chip color="default" variant="flat">上月</Chip>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData.monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid.stroke} />
                <XAxis 
                  dataKey="date" 
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                />
                <YAxis 
                  tick={chartStyles.axis.tick}
                  tickLine={{ stroke: chartStyles.axis.stroke }}
                  axisLine={{ stroke: chartStyles.axis.stroke }}
                  tickFormatter={(value) => `${value} 件`}
                />
                <Tooltip 
                  contentStyle={chartStyles.tooltip}
                  formatter={(value: number) => [`${value} 件`, "数量"]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    paddingBottom: "20px",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  name="本月" 
                  fill={COLORS.primary} 
                  stroke={COLORS.primary}
                  fillOpacity={0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="last" 
                  name="上月" 
                  fill={COLORS.gray} 
                  stroke={COLORS.gray}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 