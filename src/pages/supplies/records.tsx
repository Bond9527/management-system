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
  Link,
  Checkbox,
  DateRangePicker,
  DateValue,
  RangeValue,
} from "@heroui/react";
import { SearchIcon, DownloadIcon, FilterIcon, ChartIcon, ClockIcon, RefreshIcon } from "@/components/icons";
import { supplyCategories } from "@/config/supplies";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";

interface InventoryRecord {
  id: number;
  type: "in" | "out" | "adjust";
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  operator: string;
  department: string;
  timestamp: string;
  remark: string;
}

const mockData: InventoryRecord[] = [
  {
    id: 1,
    type: "in",
    itemName: "P1000探针",
    category: "探针",
    quantity: 50,
    unit: "支",
    operator: "张三",
    department: "测试部",
    timestamp: "2024-03-20 14:30:00",
    remark: "常规补货",
  },
  {
    id: 2,
    type: "out",
    itemName: "P500探针",
    category: "探针",
    quantity: 20,
    unit: "支",
    operator: "李四",
    department: "维修部",
    timestamp: "2024-03-20 15:45:00",
    remark: "设备维修使用",
  },
  {
    id: 3,
    type: "in",
    itemName: "P2000探针",
    category: "探针",
    quantity: 30,
    unit: "支",
    operator: "王五",
    department: "研发部",
    timestamp: "2024-03-20 16:20:00",
    remark: "新项目采购",
  },
  {
    id: 4,
    type: "in",
    itemName: "P3000探针",
    category: "探针",
    quantity: 25,
    unit: "支",
    operator: "赵六",
    department: "质检部",
    timestamp: "2024-03-20 10:15:00",
    remark: "常规补货",
  },
  {
    id: 5,
    type: "out",
    itemName: "探针清洁剂",
    category: "清洁剂",
    quantity: 10,
    unit: "瓶",
    operator: "张三",
    department: "测试部",
    timestamp: "2024-03-20 11:30:00",
    remark: "日常维护使用",
  },
  {
    id: 6,
    type: "in",
    itemName: "探针专用清洁布",
    category: "清洁剂",
    quantity: 30,
    unit: "包",
    operator: "李四",
    department: "维修部",
    timestamp: "2024-03-20 13:45:00",
    remark: "批量采购",
  },
  {
    id: 7,
    type: "out",
    itemName: "继电器模块",
    category: "继电器",
    quantity: 15,
    unit: "个",
    operator: "王五",
    department: "研发部",
    timestamp: "2024-03-20 09:20:00",
    remark: "设备升级使用",
  },
  {
    id: 8,
    type: "in",
    itemName: "继电器底座",
    category: "继电器",
    quantity: 20,
    unit: "个",
    operator: "赵六",
    department: "质检部",
    timestamp: "2024-03-20 14:10:00",
    remark: "常规补货",
  },
  {
    id: 9,
    type: "out",
    itemName: "探针连接器",
    category: "连接器",
    quantity: 15,
    unit: "个",
    operator: "张三",
    department: "测试部",
    timestamp: "2024-03-20 16:30:00",
    remark: "设备维修使用",
  },
  {
    id: 10,
    type: "in",
    itemName: "探针转接头",
    category: "连接器",
    quantity: 25,
    unit: "个",
    operator: "李四",
    department: "维修部",
    timestamp: "2024-03-20 11:15:00",
    remark: "批量采购",
  },
  {
    id: 11,
    type: "out",
    itemName: "探针支架",
    category: "其他配件",
    quantity: 10,
    unit: "个",
    operator: "王五",
    department: "研发部",
    timestamp: "2024-03-20 13:20:00",
    remark: "新设备安装",
  },
  {
    id: 12,
    type: "in",
    itemName: "探针校准工具",
    category: "其他配件",
    quantity: 10,
    unit: "套",
    operator: "赵六",
    department: "质检部",
    timestamp: "2024-03-20 15:30:00",
    remark: "设备校准使用",
  },
  {
    id: 13,
    type: "out",
    itemName: "探针测试板",
    category: "其他配件",
    quantity: 5,
    unit: "块",
    operator: "张三",
    department: "测试部",
    timestamp: "2024-03-20 10:45:00",
    remark: "测试设备使用",
  },
  {
    id: 14,
    type: "in",
    itemName: "探针保护套",
    category: "其他配件",
    quantity: 40,
    unit: "个",
    operator: "李四",
    department: "维修部",
    timestamp: "2024-03-20 14:20:00",
    remark: "批量采购",
  },
  {
    id: 15,
    type: "out",
    itemName: "探针收纳盒",
    category: "其他配件",
    quantity: 8,
    unit: "个",
    operator: "王五",
    department: "研发部",
    timestamp: "2024-03-20 16:15:00",
    remark: "设备整理使用",
  },
  {
    id: 16,
    type: "in",
    itemName: "探针维修工具",
    category: "其他配件",
    quantity: 8,
    unit: "套",
    operator: "赵六",
    department: "质检部",
    timestamp: "2024-03-20 09:30:00",
    remark: "维修工具更新",
  },
  {
    id: 17,
    type: "out",
    itemName: "探针说明书",
    category: "其他配件",
    quantity: 20,
    unit: "本",
    operator: "张三",
    department: "测试部",
    timestamp: "2024-03-20 11:40:00",
    remark: "新员工培训使用",
  },
  {
    id: 18,
    type: "in",
    itemName: "探针标签",
    category: "其他配件",
    quantity: 150,
    unit: "张",
    operator: "李四",
    department: "维修部",
    timestamp: "2024-03-20 13:50:00",
    remark: "批量采购",
  },
  {
    id: 19,
    type: "out",
    itemName: "探针防静电袋",
    category: "其他配件",
    quantity: 100,
    unit: "个",
    operator: "王五",
    department: "研发部",
    timestamp: "2024-03-20 15:25:00",
    remark: "设备包装使用",
  },
  {
    id: 20,
    type: "in",
    itemName: "探针包装盒",
    category: "其他配件",
    quantity: 50,
    unit: "个",
    operator: "赵六",
    department: "质检部",
    timestamp: "2024-03-20 16:40:00",
    remark: "常规补货",
  },
];

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const SuppliesRecordsPage: FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);

  // 重置所有筛选条件
  const handleReset = () => {
    setSearchQuery("");
    setSelectedType("");
    setSelectedCategory("");
    setSelectedDepartment("");
    setDateRange(null);
    setCurrentPage(1);
  };

  const filteredRecords = mockData.filter((record) => {
    const matchesSearch = record.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || record.type === selectedType;
    const matchesCategory = !selectedCategory || record.category === selectedCategory;
    const matchesDepartment = !selectedDepartment || record.department === selectedDepartment;
    const recordDate = new Date(record.timestamp);
    const startDate = dateRange?.start ? new Date(dateRange.start.toString()) : null;
    const endDate = dateRange?.end ? new Date(dateRange.end.toString()) : null;
    const matchesDateRange = (!startDate || recordDate >= startDate) &&
                          (!endDate || recordDate <= endDate);
    return matchesSearch && matchesType && matchesCategory && matchesDepartment && matchesDateRange;
  });

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 准备统计数据
  const operationTypeData = [
    { name: "入库", value: filteredRecords.filter(r => r.type === "in").length },
    { name: "出库", value: filteredRecords.filter(r => r.type === "out").length },
    { name: "调整", value: filteredRecords.filter(r => r.type === "adjust").length },
  ];

  const supplyRankingData = filteredRecords.reduce((acc, record) => {
    const existing = acc.find(item => item.name === record.itemName);
    if (existing) {
      existing.value += Math.abs(record.quantity);
    } else {
      acc.push({ name: record.itemName, value: Math.abs(record.quantity) });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value).slice(0, 5);

  // 导出功能
  const handleExportExcel = () => {
    // TODO: 实现Excel导出
    console.log("Export to Excel");
  };

  const handleExportCSV = () => {
    // TODO: 实现CSV导出
    console.log("Export to CSV");
  };

  const handleSupplyClick = (supplyName: string) => {
    // TODO: 跳转到耗材详情页面
    console.log("Navigate to supply details:", supplyName);
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">库存变动记录</h1>

      {/* 搜索与筛选栏 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索
                </label>
                <Input
                  placeholder="搜索耗材名称"
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<SearchIcon />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作类型
                </label>
                <Select
                  placeholder="全部"
                  selectedKeys={selectedType ? new Set([selectedType]) : new Set()}
                  onSelectionChange={(keys) => {
                    const type = Array.from(keys)[0] as string;
                    setSelectedType(type);
                  }}
                >
                  <SelectItem key="in">入库</SelectItem>
                  <SelectItem key="out">出库</SelectItem>
                  <SelectItem key="adjust">调整</SelectItem>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  类别
                </label>
                <Select
                  placeholder="全部"
                  selectedKeys={selectedCategory ? new Set([selectedCategory]) : new Set()}
                  onSelectionChange={(keys) => {
                    const category = Array.from(keys)[0] as string;
                    setSelectedCategory(category);
                  }}
                >
                  {supplyCategories.map((category) => (
                    <SelectItem key={category}>{category}</SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  部门
                </label>
                <Select
                  placeholder="全部"
                  selectedKeys={selectedDepartment ? new Set([selectedDepartment]) : new Set()}
                  onSelectionChange={(keys) => {
                    const department = Array.from(keys)[0] as string;
                    setSelectedDepartment(department);
                  }}
                >
                  {[
                    <SelectItem key="" textValue="全部">全部</SelectItem>,
                    ...Array.from(new Set(mockData.map(r => r.department))).map(department => (
                      <SelectItem key={department} textValue={department}>
                        {department}
                      </SelectItem>
                    ))
                  ]}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">时间范围</label>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                color="primary"
                variant="flat"
                startContent={<SearchIcon />}
                onClick={() => setCurrentPage(1)}
              >
                查询
              </Button>
              <Button
                color="default"
                variant="flat"
                startContent={<RefreshIcon />}
                onClick={handleReset}
              >
                重置
              </Button>
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
              <Button
                color="primary"
                variant="flat"
                startContent={<ChartIcon />}
                onClick={() => setShowStatistics(!showStatistics)}
              >
                {showStatistics ? "隐藏统计" : "显示统计"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 统计区域 */}
      {showStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardBody>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-700">操作类型分布</h3>
                <Chip color="primary" variant="flat">
                  数量统计
                </Chip>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={operationTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {operationTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg">
            <CardBody>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-700">耗材变动排名</h3>
                <Chip color="primary" variant="flat">
                  数量统计
                </Chip>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={supplyRankingData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" name="变动数量" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* 记录表格 */}
      <Card className="shadow-lg">
        <CardBody>
          <Table
            aria-label="库存变动记录表格"
            bottomContent={
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={currentPage}
                  total={Math.ceil(filteredRecords.length / pageSize)}
                  onChange={setCurrentPage}
                />
              </div>
            }
          >
            <TableHeader>
              <TableColumn>日期/时间</TableColumn>
              <TableColumn>耗材名称</TableColumn>
              <TableColumn>操作类型</TableColumn>
              <TableColumn>数量（变化值）</TableColumn>
              <TableColumn>单位</TableColumn>
              <TableColumn>操作人</TableColumn>
              <TableColumn>备注说明</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Chip
                      variant="flat"
                      color="default"
                      startContent={<ClockIcon className="text-default-500" />}
                    >
                      {record.timestamp}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Link
                      color="primary"
                      className="cursor-pointer"
                      onClick={() => handleSupplyClick(record.itemName)}
                    >
                      {record.itemName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={
                        record.type === "in"
                          ? "success"
                          : record.type === "out"
                          ? "danger"
                          : "default"
                      }
                      variant="flat"
                    >
                      {record.type === "in"
                        ? "入库"
                        : record.type === "out"
                        ? "出库"
                        : "调整"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        record.type === "in"
                          ? "text-success"
                          : record.type === "out"
                          ? "text-danger"
                          : "text-default"
                      }
                    >
                      {record.type === "in"
                        ? "+"
                        : record.type === "out"
                        ? "-"
                        : "±"}
                      {Math.abs(record.quantity)}
                    </span>
                  </TableCell>
                  <TableCell>{record.unit}</TableCell>
                  <TableCell>{record.operator}</TableCell>
                  <TableCell>
                    <Tooltip content={record.remark}>
                      <span className="line-clamp-2">{record.remark}</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};

export default SuppliesRecordsPage; 