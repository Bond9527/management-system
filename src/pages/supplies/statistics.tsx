import { FC, useState, Fragment } from "react";
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
import { supplyCategories } from "@/config/supplies";

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

// 模拟数据
const mockTrendData = [
  { date: "2024-03-01", in: 50, out: 30 },
  { date: "2024-03-02", in: 45, out: 35 },
  { date: "2024-03-03", in: 60, out: 40 },
  { date: "2024-03-04", in: 55, out: 45 },
  { date: "2024-03-05", in: 70, out: 50 },
  { date: "2024-03-06", in: 65, out: 55 },
  { date: "2024-03-07", in: 80, out: 60 },
];

// 根据共享类别生成模拟数据
const mockCategoryData = supplyCategories.map((category) => ({
  name: category,
  value: Math.floor(Math.random() * 50) + 10, // 生成10-60之间的随机数
}));

interface SupplyItem {
  name: string;
  value: number;
  unit: string;
  category: string;
}

interface LowStockItem {
  name: string;
  current: number;
  threshold: number;
  unit: string;
  category: string;
}

// 为每个类别生成一些示例耗材
const generateMockSupplies = (): SupplyItem[] => {
  const supplies: SupplyItem[] = [];
  supplyCategories.forEach(category => {
    // 为每个类别生成2-4个耗材
    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i++) {
      supplies.push({
        name: `${category}${i + 1}`,
        value: Math.floor(Math.random() * 100) + 20,
        unit: getUnitByCategory(category),
        category: category
      });
    }
  });
  return supplies;
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

const mockRankingData = generateMockSupplies();

const mockOperatorData = [
  { name: "张三", value: 120, department: "测试部" },
  { name: "李四", value: 100, department: "维修部" },
  { name: "王五", value: 80, department: "研发部" },
  { name: "赵六", value: 60, department: "质检部" },
  { name: "钱七", value: 40, department: "生产部" },
];

// 生成低库存数据
const mockLowStockData = supplyCategories.map(category => {
  const current = Math.floor(Math.random() * 10) + 1;
  const threshold = Math.floor(Math.random() * 20) + 10;
  return {
    name: `${category}${Math.floor(Math.random() * 5) + 1}`,
    current,
    threshold,
    unit: getUnitByCategory(category),
    category
  };
});

const mockMonthlyComparisonData = [
  { date: "3/1", current: 50, last: 45 },
  { date: "3/2", current: 55, last: 50 },
  { date: "3/3", current: 60, last: 55 },
  { date: "3/4", current: 65, last: 60 },
  { date: "3/5", current: 70, last: 65 },
  { date: "3/6", current: 75, last: 70 },
  { date: "3/7", current: 80, last: 75 },
];

export default function SuppliesStatisticsPage() {
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOperationType, setSelectedOperationType] = useState<string>("all");
  const [isResetting, setIsResetting] = useState(false);

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
      trendData: filterByDateRange(mockTrendData),
      categoryData: selectedCategory === "all" 
        ? mockCategoryData 
        : mockCategoryData.filter(item => item.name === selectedCategory),
      rankingData: filterByCategory(mockRankingData),
      operatorData: mockOperatorData,
      lowStockData: filterByCategory(mockLowStockData),
      monthlyComparisonData: filterByDateRange(mockMonthlyComparisonData)
    };
  };

  const filteredData = getFilteredData();

  return (
    <div className="flex flex-col gap-6 p-6">
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
                  {supplyCategories.map((category) => (
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