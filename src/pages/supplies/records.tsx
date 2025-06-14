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
} from "@heroui/react";
import { SearchIcon, DownloadIcon, FilterIcon, ChartIcon, ClockIcon, RefreshIcon } from "@/components/icons";
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
  timestamp: string;
  supplyName: string;
  operationType: "in" | "out" | "adjust";
  quantity: number;
  unit: string;
  operator: string;
  reason: string;
  beforeQuantity: number;
  afterQuantity: number;
}

const mockRecords: InventoryRecord[] = [
  {
    id: 1,
    timestamp: "2024-03-20 14:30:00",
    supplyName: "A4打印纸",
    operationType: "in",
    quantity: 50,
    unit: "包",
    operator: "张三",
    reason: "采购入库",
    beforeQuantity: 100,
    afterQuantity: 150,
  },
  {
    id: 2,
    timestamp: "2024-03-20 15:45:00",
    supplyName: "一次性手套",
    operationType: "out",
    quantity: 20,
    unit: "双",
    operator: "李四",
    reason: "部门领用",
    beforeQuantity: 200,
    afterQuantity: 180,
  },
  // 更多模拟数据...
];

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const SuppliesRecordsPage: FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null);
  const [page, setPage] = useState(1);
  const [showStatistics, setShowStatistics] = useState(false);
  const rowsPerPage = 10;

  // 重置所有筛选条件
  const handleReset = () => {
    setSearchTerm("");
    setSelectedOperator("");
    setSelectedOperationTypes(new Set());
    setDateRange(null);
    setPage(1);
  };

  const filteredRecords = mockRecords.filter((record) => {
    const matchesSearch = record.supplyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOperator = !selectedOperator || record.operator === selectedOperator;
    const matchesOperationType = selectedOperationTypes.size === 0 || 
                               selectedOperationTypes.has(record.operationType);
    const recordDate = new Date(record.timestamp);
    const startDate = dateRange?.start ? new Date(dateRange.start.toString()) : null;
    const endDate = dateRange?.end ? new Date(dateRange.end.toString()) : null;
    const matchesDateRange = (!startDate || recordDate >= startDate) &&
                           (!endDate || recordDate <= endDate);
    return matchesSearch && matchesOperator && matchesOperationType && matchesDateRange;
  });

  const paginatedRecords = filteredRecords.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // 准备统计数据
  const operationTypeData = [
    { name: "入库", value: filteredRecords.filter(r => r.operationType === "in").length },
    { name: "出库", value: filteredRecords.filter(r => r.operationType === "out").length },
    { name: "调整", value: filteredRecords.filter(r => r.operationType === "adjust").length },
  ];

  const supplyRankingData = filteredRecords.reduce((acc, record) => {
    const existing = acc.find(item => item.name === record.supplyName);
    if (existing) {
      existing.value += Math.abs(record.quantity);
    } else {
      acc.push({ name: record.supplyName, value: Math.abs(record.quantity) });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                className="w-80"
                placeholder="选择耗材名称"
                selectedKeys={searchTerm ? new Set([searchTerm]) : new Set()}
                onSelectionChange={(keys) => setSearchTerm(Array.from(keys)[0] as string)}
                renderValue={(items) => {
                  return items.map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span>{String(item.key)}</span>
                    </div>
                  ));
                }}
              >
                {mockRecords.map((record) => (
                  <SelectItem key={record.supplyName} textValue={record.supplyName}>
                    {record.supplyName}
                  </SelectItem>
                ))}
              </Select>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-500">操作类型</label>
                <div className="flex gap-4">
                  <Checkbox
                    isSelected={selectedOperationTypes.has("in")}
                    onValueChange={(checked) => {
                      const newTypes = new Set(selectedOperationTypes);
                      if (checked) {
                        newTypes.add("in");
                      } else {
                        newTypes.delete("in");
                      }
                      setSelectedOperationTypes(newTypes);
                    }}
                  >
                    入库
                  </Checkbox>
                  <Checkbox
                    isSelected={selectedOperationTypes.has("out")}
                    onValueChange={(checked) => {
                      const newTypes = new Set(selectedOperationTypes);
                      if (checked) {
                        newTypes.add("out");
                      } else {
                        newTypes.delete("out");
                      }
                      setSelectedOperationTypes(newTypes);
                    }}
                  >
                    出库
                  </Checkbox>
                  <Checkbox
                    isSelected={selectedOperationTypes.has("adjust")}
                    onValueChange={(checked) => {
                      const newTypes = new Set(selectedOperationTypes);
                      if (checked) {
                        newTypes.add("adjust");
                      } else {
                        newTypes.delete("adjust");
                      }
                      setSelectedOperationTypes(newTypes);
                    }}
                  >
                    修正
                  </Checkbox>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-500">操作人</label>
                <Select
                  className="w-80"
                  placeholder="选择操作人"
                  selectedKeys={selectedOperator ? new Set([selectedOperator]) : new Set()}
                  onSelectionChange={(keys) => setSelectedOperator(Array.from(keys)[0] as string)}
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
                    ...Array.from(new Set(mockRecords.map(r => r.operator))).map(operator => (
                      <SelectItem key={operator} textValue={operator}>
                        {operator}
                      </SelectItem>
                    ))
                  ]}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-500">日期范围</label>
                <DateRangePicker
                  className="w-2/3"
                  label="选择日期范围"
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                color="primary"
                variant="flat"
                startContent={<SearchIcon />}
                onClick={() => setPage(1)}
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
                  page={page}
                  total={Math.ceil(filteredRecords.length / rowsPerPage)}
                  onChange={setPage}
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
                      onClick={() => handleSupplyClick(record.supplyName)}
                    >
                      {record.supplyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={
                        record.operationType === "in"
                          ? "success"
                          : record.operationType === "out"
                          ? "danger"
                          : "default"
                      }
                      variant="flat"
                    >
                      {record.operationType === "in"
                        ? "入库"
                        : record.operationType === "out"
                        ? "出库"
                        : "调整"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        record.operationType === "in"
                          ? "text-success"
                          : record.operationType === "out"
                          ? "text-danger"
                          : "text-default"
                      }
                    >
                      {record.operationType === "in"
                        ? "+"
                        : record.operationType === "out"
                        ? "-"
                        : "±"}
                      {Math.abs(record.quantity)}
                    </span>
                  </TableCell>
                  <TableCell>{record.unit}</TableCell>
                  <TableCell>{record.operator}</TableCell>
                  <TableCell>
                    <Tooltip content={record.reason}>
                      <span className="line-clamp-2">{record.reason}</span>
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