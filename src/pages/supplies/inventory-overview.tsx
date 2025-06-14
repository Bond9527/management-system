import { FC, useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Pagination,
  Select,
  SelectItem,
  Chip,
  Tooltip,
  Badge,
  Spinner,
  Divider,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { SearchIcon, DownloadIcon, PlusIcon, MinusIcon, EyeIcon, ClockIcon } from "@/components/icons";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  lastUpdated: string;
  safetyStock: number;
  lastModified: string;
}

interface PieChartData {
  name: string;
  value: number;
}

interface BarChartData {
  name: string;
  quantity: number;
  safetyStock: number;
}

const mockData: InventoryItem[] = [
  {
    id: 1,
    name: "A4打印纸",
    category: "办公用品",
    quantity: 85,
    unit: "包",
    location: "A区-01",
    lastUpdated: "2024-03-20",
    safetyStock: 20,
    lastModified: "2024-06-12 14:33",
  },
  {
    id: 2,
    name: "一次性手套",
    category: "防护用品",
    quantity: 500,
    unit: "双",
    location: "A区-02",
    lastUpdated: "2024-03-19",
    safetyStock: 50,
    lastModified: "2024-06-11 09:15",
  },
  // 更多模拟数据...
];

const COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#14B8A6", // teal-500
  "#F97316", // orange-500
];

const SuppliesInventoryOverviewPage: FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minQuantity, setMinQuantity] = useState<string>("");
  const [maxQuantity, setMaxQuantity] = useState<string>("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filteredData = mockData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesQuantity = (!minQuantity || item.quantity >= Number(minQuantity)) &&
                          (!maxQuantity || item.quantity <= Number(maxQuantity));
    return matchesSearch && matchesCategory && matchesQuantity;
  });

  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const categories = Array.from(new Set(mockData.map((item) => item.category)));

  // 准备饼图数据
  const pieChartData = categories.map((category) => {
    const total = mockData
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.quantity, 0);
    return {
      name: category,
      value: total,
    };
  });

  // 准备柱状图数据
  const barChartData = mockData.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    safetyStock: item.safetyStock,
  }));

  const handleExportExcel = () => {
    // TODO: 实现导出Excel功能
    console.log("Exporting to Excel...");
  };

  const handleExportCSV = () => {
    // 准备CSV数据
    const headers = ["耗材名称", "分类", "单位", "当前库存", "安全库存", "上次变动时间"];
    const csvData = filteredData.map(item => [
      item.name,
      item.category,
      item.unit,
      item.quantity,
      item.safetyStock,
      item.lastModified
    ]);

    // 转换为CSV格式
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    // 创建Blob对象
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 创建下载链接并触发下载
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `库存总览_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/supplies/details/${id}`);
  };

  const handleAdjustStock = (id: number, adjustment: number) => {
    // TODO: 实现库存调整功能
    console.log(`Adjusting stock for item ${id} by ${adjustment}`);
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">库存总览</h1>

      {/* 搜索与筛选栏 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              isClearable
              className="w-64"
              placeholder="搜索耗材名称..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<SearchIcon className="text-default-400" />}
            />
            <Select
              className="w-48"
              placeholder="选择分类"
              selectedKeys={selectedCategory ? new Set([selectedCategory]) : new Set()}
              onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              renderValue={(items) => {
                return items.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <span>{String(item.key)}</span>
                  </div>
                ));
              }}
            >
              {[
                <SelectItem key="" textValue="全部">全部</SelectItem>,
                ...categories.map((category) => (
                  <SelectItem key={category} textValue={category}>
                    {category}
                  </SelectItem>
                ))
              ]}
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-24"
                placeholder="最小"
                value={minQuantity}
                onValueChange={setMinQuantity}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">≥</span>
                  </div>
                }
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                className="w-24"
                placeholder="最大"
                value={maxQuantity}
                onValueChange={setMaxQuantity}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">≤</span>
                  </div>
                }
              />
            </div>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<DownloadIcon />}
                >
                  导出
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="导出选项">
                <DropdownItem
                  key="excel"
                  description="导出为Excel格式"
                  startContent={<DownloadIcon />}
                  onClick={handleExportExcel}
                >
                  导出Excel
                </DropdownItem>
                <DropdownItem
                  key="csv"
                  description="导出为CSV格式"
                  startContent={<DownloadIcon />}
                  onClick={handleExportCSV}
                >
                  导出CSV
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>

      {/* 库存列表表格 */}
      <Card className="shadow-lg">
        <CardBody>
          <Table aria-label="库存列表">
            <TableHeader>
              <TableColumn>耗材名称</TableColumn>
              <TableColumn>分类</TableColumn>
              <TableColumn>单位</TableColumn>
              <TableColumn>当前库存</TableColumn>
              <TableColumn>安全库存</TableColumn>
              <TableColumn>上次变动时间</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Button
                      variant="light"
                      className="p-0"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      {item.name}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Chip color="primary" variant="flat">
                      {item.category}
                    </Chip>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <Badge
                      color={item.quantity <= item.safetyStock ? "danger" : "success"}
                      variant="flat"
                    >
                      {item.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Chip color="default" variant="flat">
                      {item.safetyStock}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      variant="flat"
                      color="default"
                      startContent={<ClockIcon className="text-default-500" />}
                    >
                      {item.lastModified}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="查看记录">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onClick={() => handleViewDetails(item.id)}
                        >
                          <EyeIcon className="text-default-500" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="增加库存">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onClick={() => handleAdjustStock(item.id, 1)}
                        >
                          <PlusIcon className="text-success" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="减少库存">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onClick={() => handleAdjustStock(item.id, -1)}
                        >
                          <MinusIcon className="text-danger" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-center mt-4">
            <Pagination
              total={Math.ceil(filteredData.length / rowsPerPage)}
              page={page}
              onChange={setPage}
              color="primary"
            />
          </div>
        </CardBody>
      </Card>

      {/* 统计区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-700">分类汇总</h3>
              <Chip color="primary" variant="flat">
                库存分布
              </Chip>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent: number }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      padding: "8px 12px",
                    }}
                    formatter={(value: number) => [`${value} 件`, "库存数量"]}
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
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-700">库存预警</h3>
              <Chip color="danger" variant="flat">
                库存不足
              </Chip>
            </div>
            <div className="space-y-3">
              {mockData
                .filter((item) => item.quantity <= item.safetyStock)
                .map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-danger-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <Chip size="sm" color="primary" variant="flat">
                        {item.category}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color="danger" variant="flat">
                        {item.quantity} {item.unit}
                      </Badge>
                      <Chip color="danger" variant="flat" size="sm">
                        安全库存: {item.safetyStock}
                      </Chip>
                    </div>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 库存柱状图 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">库存数量一览</h3>
            <div className="flex gap-2">
              <Chip color="primary" variant="flat" className="font-medium">
                当前库存
              </Chip>
              <Chip color="success" variant="flat" className="font-medium">
                安全库存
              </Chip>
            </div>
          </div>
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 100,
                }}
                barGap={0}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="name"
                  height={100}
                  interval={0}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={{ stroke: "#E5E7EB" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickFormatter={(value) => {
                    return value.length > 8 ? `${value.slice(0, 8)}...` : value;
                  }}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={{ stroke: "#E5E7EB" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickFormatter={(value) => `${value} 件`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    padding: "8px 12px",
                  }}
                  formatter={(value: number, name: string) => [`${value} 件`, name]}
                />
                <Bar
                  dataKey="quantity"
                  name="当前库存"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="safetyStock"
                  name="安全库存"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SuppliesInventoryOverviewPage; 