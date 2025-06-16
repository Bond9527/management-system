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
    name: "P1000探针",
    category: "探针",
    quantity: 25,
    unit: "支",
    location: "A区-01-01",
    lastUpdated: "2024-03-20 14:30:00",
    safetyStock: 20,
    lastModified: "2024-03-20 14:30:00",
  },
  {
    id: 2,
    name: "P500探针",
    category: "探针",
    quantity: 30,
    unit: "支",
    location: "A区-01-02",
    lastUpdated: "2024-03-20 15:45:00",
    safetyStock: 25,
    lastModified: "2024-03-20 15:45:00",
  },
  {
    id: 3,
    name: "P2000探针",
    category: "探针",
    quantity: 15,
    unit: "支",
    location: "A区-01-03",
    lastUpdated: "2024-03-20 16:20:00",
    safetyStock: 15,
    lastModified: "2024-03-20 16:20:00",
  },
  {
    id: 4,
    name: "P3000探针",
    category: "探针",
    quantity: 20,
    unit: "支",
    location: "A区-01-04",
    lastUpdated: "2024-03-20 10:15:00",
    safetyStock: 15,
    lastModified: "2024-03-20 10:15:00",
  },
  {
    id: 5,
    name: "探针清洁剂",
    category: "清洁剂",
    quantity: 18,
    unit: "瓶",
    location: "B区-02-01",
    lastUpdated: "2024-03-20 11:30:00",
    safetyStock: 15,
    lastModified: "2024-03-20 11:30:00",
  },
  {
    id: 6,
    name: "探针专用清洁布",
    category: "清洁剂",
    quantity: 25,
    unit: "包",
    location: "B区-02-02",
    lastUpdated: "2024-03-20 13:45:00",
    safetyStock: 20,
    lastModified: "2024-03-20 13:45:00",
  },
  {
    id: 7,
    name: "继电器模块",
    category: "继电器",
    quantity: 20,
    unit: "个",
    location: "B区-02-03",
    lastUpdated: "2024-03-20 09:20:00",
    safetyStock: 12,
    lastModified: "2024-03-20 09:20:00",
  },
  {
    id: 8,
    name: "继电器底座",
    category: "继电器",
    quantity: 15,
    unit: "个",
    location: "B区-02-04",
    lastUpdated: "2024-03-20 14:10:00",
    safetyStock: 10,
    lastModified: "2024-03-20 14:10:00",
  },
  {
    id: 9,
    name: "探针连接器",
    category: "连接器",
    quantity: 25,
    unit: "个",
    location: "C区-03-01",
    lastUpdated: "2024-03-20 16:30:00",
    safetyStock: 18,
    lastModified: "2024-03-20 16:30:00",
  },
  {
    id: 10,
    name: "探针转接头",
    category: "连接器",
    quantity: 20,
    unit: "个",
    location: "C区-03-02",
    lastUpdated: "2024-03-20 11:15:00",
    safetyStock: 15,
    lastModified: "2024-03-20 11:15:00",
  },
  {
    id: 11,
    name: "探针支架",
    category: "其他配件",
    quantity: 15,
    unit: "个",
    location: "C区-03-03",
    lastUpdated: "2024-03-20 13:20:00",
    safetyStock: 10,
    lastModified: "2024-03-20 13:20:00",
  },
  {
    id: 12,
    name: "探针校准工具",
    category: "其他配件",
    quantity: 8,
    unit: "套",
    location: "C区-03-04",
    lastUpdated: "2024-03-20 15:30:00",
    safetyStock: 5,
    lastModified: "2024-03-20 15:30:00",
  },
  {
    id: 13,
    name: "探针测试板",
    category: "其他配件",
    quantity: 12,
    unit: "块",
    location: "D区-04-01",
    lastUpdated: "2024-03-20 10:45:00",
    safetyStock: 8,
    lastModified: "2024-03-20 10:45:00",
  },
  {
    id: 14,
    name: "探针保护套",
    category: "其他配件",
    quantity: 30,
    unit: "个",
    location: "D区-04-02",
    lastUpdated: "2024-03-20 14:20:00",
    safetyStock: 20,
    lastModified: "2024-03-20 14:20:00",
  },
  {
    id: 15,
    name: "探针收纳盒",
    category: "其他配件",
    quantity: 10,
    unit: "个",
    location: "D区-04-03",
    lastUpdated: "2024-03-20 16:15:00",
    safetyStock: 5,
    lastModified: "2024-03-20 16:15:00",
  },
  {
    id: 16,
    name: "探针维修工具",
    category: "其他配件",
    quantity: 5,
    unit: "套",
    location: "D区-04-04",
    lastUpdated: "2024-03-20 09:30:00",
    safetyStock: 3,
    lastModified: "2024-03-20 09:30:00",
  },
  {
    id: 17,
    name: "探针说明书",
    category: "其他配件",
    quantity: 50,
    unit: "本",
    location: "E区-05-01",
    lastUpdated: "2024-03-20 11:40:00",
    safetyStock: 30,
    lastModified: "2024-03-20 11:40:00",
  },
  {
    id: 18,
    name: "探针标签",
    category: "其他配件",
    quantity: 100,
    unit: "张",
    location: "E区-05-02",
    lastUpdated: "2024-03-20 13:50:00",
    safetyStock: 50,
    lastModified: "2024-03-20 13:50:00",
  },
  {
    id: 19,
    name: "探针防静电袋",
    category: "其他配件",
    quantity: 200,
    unit: "个",
    location: "E区-05-03",
    lastUpdated: "2024-03-20 15:25:00",
    safetyStock: 100,
    lastModified: "2024-03-20 15:25:00",
  },
  {
    id: 20,
    name: "探针包装盒",
    category: "其他配件",
    quantity: 40,
    unit: "个",
    location: "E区-05-04",
    lastUpdated: "2024-03-20 16:40:00",
    safetyStock: 20,
    lastModified: "2024-03-20 16:40:00",
  },
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
  const pieChartData = [
    { name: "探针", value: 90 },
    { name: "清洁剂", value: 43 },
    { name: "继电器", value: 35 },
    { name: "连接器", value: 45 },
    { name: "其他配件", value: 462 },
  ];

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
              selectedKeys={new Set([selectedCategory])}
              onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              className="w-1/2"
            >
              <SelectItem key="all" textValue="全部">全部</SelectItem>
              <SelectItem key="probe" textValue="探针">探针</SelectItem>
              <SelectItem key="cleaner" textValue="清洁剂">清洁剂</SelectItem>
              <SelectItem key="relay" textValue="继电器">继电器</SelectItem>
              <SelectItem key="connector" textValue="连接器">连接器</SelectItem>
              <SelectItem key="other" textValue="其他配件">其他配件</SelectItem>
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