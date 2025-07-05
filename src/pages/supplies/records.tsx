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
import { useSupplies, SupplyItem, InventoryRecord } from "@/hooks/useSupplies";
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
import { formatTimestamp, getCurrentDateForFilename } from "@/utils/dateUtils";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const SuppliesRecordsPage: FC = () => {
  const navigate = useNavigate();
  const { supplies, records } = useSupplies();
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

  const filteredRecords = records.filter((record) => {
    const matchesSearch = (record.supply_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || record.type === selectedType;
    const matchesCategory = !selectedCategory || record.supply_category === selectedCategory;
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
    const existing = acc.find(item => item.name === record.supply_name);
    if (existing) {
      existing.value += Math.abs(record.quantity);
    } else {
      acc.push({ name: record.supply_name || '未知耗材', value: Math.abs(record.quantity) });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value).slice(0, 5);

  // 导出功能
  const handleExportExcel = () => {
    // TODO: 实现Excel导出
    console.log("Export to Excel");
  };

  const handleExportCSV = () => {
    // 准备CSV数据
    const headers = ["日期/时间", "耗材名称", "操作类型", "数量", "单位", "操作人", "部门", "备注"];
    const csvData = filteredRecords.map(record => [
      record.timestamp,
      record.supply_name || '未知耗材',
      record.type === "in" ? "入库" : record.type === "out" ? "出库" : "调整",
      record.quantity,
      record.supply_unit || '个',
      record.operator,
      record.department,
      record.remark
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
    link.setAttribute("download", `库存变动记录_${getCurrentDateForFilename()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                  耗材类别
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
                  <SelectItem key="测试部">测试部</SelectItem>
                  <SelectItem key="维修部">维修部</SelectItem>
                  <SelectItem key="研发部">研发部</SelectItem>
                  <SelectItem key="质检部">质检部</SelectItem>
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
                color="secondary"
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

      {/* 统计图表 */}
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
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 80, bottom: 80, left: 80 }}>
                    <Pie
                      data={operationTypeData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      minAngle={5}
                    >
                      {operationTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        `${value} 次`,
                        name
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={60}
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                      formatter={(value, entry) => {
                        const item = operationTypeData.find(d => d.name === value);
                        const percent = item ? ((item.value / operationTypeData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0) : '0';
                        return `${value} ${percent}%`;
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
                      {formatTimestamp(record.timestamp)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Link
                      color="primary"
                      className="cursor-pointer"
                      onClick={() => handleSupplyClick(record.supply_name || '')}
                    >
                      {record.supply_name || '未知耗材'}
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
                    <Badge
                      color={
                        record.type === "in"
                          ? "success"
                          : record.type === "out"
                          ? "danger"
                          : "default"
                      }
                      variant="flat"
                    >
                      {record.type === "in" ? "+" : record.type === "out" ? "-" : ""}
                      {record.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.supply_unit || '个'}</TableCell>
                  <TableCell>
                    <Chip variant="flat" color="primary">
                      {record.operator}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{record.remark}</span>
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