import { FC, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Badge,
  Input,
  Select,
  SelectItem,
  DateRangePicker,
  DateValue,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  EditIcon,
  PlusIcon,
  MinusIcon,
  DownloadIcon,
  ClockIcon,
  UserIcon,
  DepartmentIcon,
  RemarkIcon,
} from "@/components/icons";
import { useSupplies, SupplyItem, InventoryRecord } from "@/hooks/useSupplies";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { formatTimestamp, getCurrentDateForFilename } from "@/utils/dateUtils";

const SupplyDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supplies, records, adjustStock, fetchRecords, isLoading, error } = useSupplies();
  
  const [supply, setSupply] = useState<SupplyItem | null>(null);
  const [supplyRecords, setSupplyRecords] = useState<InventoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InventoryRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 筛选状态
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null);
  
  // 库存调整模态框
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out" | "adjust">("in");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentUnitPrice, setAdjustmentUnitPrice] = useState("");
  const [adjustmentRemark, setAdjustmentRemark] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    if (id) {
      const supplyId = parseInt(id);
      const foundSupply = supplies.find(s => s.id === supplyId);
      setSupply(foundSupply || null);
      
      if (foundSupply) {
        // 获取该耗材的记录
        fetchRecords({ supply_id: supplyId });
      }
    }
  }, [id, supplies]);

  // 当records更新时，筛选出当前耗材的记录
  useEffect(() => {
    if (supply) {
      const supplyRecords = records.filter(r => r.supply === supply.id);
      setSupplyRecords(supplyRecords);
      setFilteredRecords(supplyRecords);
    }
  }, [supply, records]);

  // 筛选记录
  useEffect(() => {
    let filtered = supplyRecords;

    // 按操作类型筛选
    if (selectedType !== "all") {
      filtered = filtered.filter(r => r.type === selectedType);
    }

    // 按日期范围筛选
    if (dateRange) {
      const startDate = new Date(dateRange.start.toString());
      const endDate = new Date(dateRange.end.toString());
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.timestamp);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [supplyRecords, selectedType, dateRange]);

  // 分页数据
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 生成图表数据
  const generateChartData = () => {
    const sortedRecords = [...supplyRecords].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let runningStock = 0;
    return sortedRecords.map(record => {
      switch (record.type) {
        case "in":
          runningStock += record.quantity;
          break;
        case "out":
          runningStock -= record.quantity;
          break;
        case "adjust":
          runningStock = record.quantity;
          break;
      }
      
      return {
        date: record.timestamp,
        stock: runningStock,
        type: record.type,
        quantity: record.quantity,
      };
    });
  };

  // 生成操作类型统计
  const generateOperationStats = () => {
    const stats = {
      in: 0,
      out: 0,
      adjust: 0,
    };
    
    supplyRecords.forEach(record => {
      stats[record.type]++;
    });
    
    return [
      { name: "入库", value: stats.in, color: "#10B981" },
      { name: "出库", value: stats.out, color: "#EF4444" },
      { name: "调整", value: stats.adjust, color: "#F59E0B" },
    ];
  };

  // 处理库存调整
  const handleStockAdjustment = async () => {
    if (!supply || !adjustmentQuantity) return;

    const quantity = Number(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert("请输入有效的数量");
      return;
    }

    if (adjustmentType === "out" && quantity > supply.current_stock) {
      alert("出库数量不能超过当前库存");
      return;
    }

    // 验证单价（如果输入了的话）
    let unitPrice: number | undefined = undefined;
    if (adjustmentUnitPrice) {
      const price = Number(adjustmentUnitPrice);
      if (isNaN(price) || price < 0) {
        alert("请输入有效的单价");
        return;
      }
      unitPrice = price;
    }

    setIsAdjusting(true);
    try {
      // 使用adjustStock API进行库存调整
      await adjustStock({
        supply_id: supply.id,
        type: adjustmentType,
        quantity: adjustmentType === "adjust" ? quantity : quantity,
        unit_price: unitPrice,
        remark: adjustmentRemark,
      });

      setShowAdjustModal(false);
      setAdjustmentQuantity("");
      setAdjustmentUnitPrice("");
      setAdjustmentRemark("");
      setAdjustmentType("in");
    } catch (error) {
      console.error("库存调整失败:", error);
      alert("库存调整失败，请重试");
    } finally {
      setIsAdjusting(false);
    }
  };

  // 导出记录
  const handleExportRecords = () => {
    const headers = ["日期/时间", "操作类型", "数量", "单位", "操作人", "部门", "备注"];
    const csvData = filteredRecords.map(record => [
      record.timestamp,
      record.type === "in" ? "入库" : record.type === "out" ? "出库" : "调整",
      record.quantity,
      record.supply_unit || supply?.unit || "",
      record.operator,
      record.department,
      record.remark
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${supply?.name}_变动记录_${getCurrentDateForFilename()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">加载中...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-4">错误: {error}</h2>
          <Button
            color="primary"
            variant="flat"
            startContent={<ArrowLeftIcon />}
            onClick={() => navigate("/supplies/inventory-overview")}
          >
            返回库存总览
          </Button>
        </div>
      </div>
    );
  }

  if (!supply) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">耗材不存在</h2>
          <Button
            color="primary"
            variant="flat"
            startContent={<ArrowLeftIcon />}
            onClick={() => navigate("/supplies/inventory-overview")}
          >
            返回库存总览
          </Button>
        </div>
      </div>
    );
  }

  const chartData = generateChartData();
  const operationStats = generateOperationStats();

  return (
    <div className="p-6 space-y-8">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            color="default"
            variant="flat"
            startContent={<ArrowLeftIcon />}
            onClick={() => navigate("/supplies/inventory-overview")}
          >
            返回
          </Button>
          <h1 className="text-2xl font-bold">{supply.name}</h1>
          <Chip color="primary" variant="flat">
            {supply.category}
          </Chip>
        </div>
        <div className="flex gap-2">
          <Button
            color="success"
            variant="flat"
            startContent={<PlusIcon />}
            onClick={() => {
              setAdjustmentType("in");
              setShowAdjustModal(true);
            }}
          >
            入库
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<MinusIcon />}
            onClick={() => {
              setAdjustmentType("out");
              setShowAdjustModal(true);
            }}
          >
            出库
          </Button>
          <Button
            color="warning"
            variant="flat"
            startContent={<EditIcon />}
            onClick={() => {
              setAdjustmentType("adjust");
              setShowAdjustModal(true);
            }}
          >
            调整
          </Button>
        </div>
      </div>

      {/* 耗材基本信息 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">耗材名称</label>
                <p className="text-lg font-semibold">{supply.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">分类</label>
                <Chip color="primary" variant="flat">{supply.category}</Chip>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">当前库存</label>
                <div className="flex items-center gap-2">
                  <Badge
                    color={supply.current_stock <= supply.safety_stock ? "danger" : "success"}
                    variant="flat"
                    size="lg"
                  >
                    {supply.current_stock} {supply.unit}
                  </Badge>
                  <Chip
                    color={supply.current_stock <= supply.safety_stock ? "danger" : "success"}
                    variant="flat"
                    size="sm"
                  >
                    {supply.current_stock <= supply.safety_stock ? "库存不足" : "库存充足"}
                  </Chip>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">安全库存</label>
                <p className="text-lg">{supply.safety_stock} {supply.unit}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">单价</label>
                <p className="text-lg font-semibold text-green-600">¥{parseFloat(supply.unit_price).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">库存总价值</label>
                <p className="text-lg font-semibold text-blue-600">¥{(supply.current_stock * parseFloat(supply.unit_price)).toFixed(2)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">单位</label>
                <p className="text-lg">{supply.unit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">变动记录数</label>
                <p className="text-lg font-semibold text-primary">{supplyRecords.length}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 统计图表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 库存变化趋势 */}
        <Card className="shadow-lg">
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">库存变化趋势</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="stock" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* 操作类型统计 */}
        <Card className="shadow-lg">
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">操作类型统计</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operationStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 筛选和搜索 */}
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
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
              <Select
                selectedKeys={new Set([selectedType])}
                onSelectionChange={(keys) => setSelectedType(Array.from(keys)[0] as string)}
                className="w-full"
              >
                <SelectItem key="all">全部</SelectItem>
                <SelectItem key="in">入库</SelectItem>
                <SelectItem key="out">出库</SelectItem>
                <SelectItem key="adjust">调整</SelectItem>
              </Select>
            </div>
            <Button
              color="primary"
              variant="flat"
              startContent={<DownloadIcon />}
              onClick={handleExportRecords}
            >
              导出记录
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 变动记录表格 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">变动记录 ({filteredRecords.length})</h3>
          </div>
          
          <Table
            aria-label="变动记录表格"
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
              <TableColumn>操作类型</TableColumn>
              <TableColumn>数量（变化值）</TableColumn>
              <TableColumn>操作人</TableColumn>
              <TableColumn>部门</TableColumn>
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
                    <Chip
                      color={
                        record.type === "in"
                          ? "success"
                          : record.type === "out"
                          ? "danger"
                          : "warning"
                      }
                      variant="flat"
                    >
                      {record.type === "in" ? "入库" : record.type === "out" ? "出库" : "调整"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Badge
                      color={
                        record.type === "in"
                          ? "success"
                          : record.type === "out"
                          ? "danger"
                          : "warning"
                      }
                      variant="flat"
                    >
                      {record.type === "in" ? "+" : record.type === "out" ? "-" : ""}
                      {record.quantity} {record.supply_unit || supply.unit}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserIcon className="text-default-400" />
                      <span>{record.operator}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DepartmentIcon className="text-default-400" />
                      <span>{record.department}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.remark && (
                      <div className="flex items-center gap-2">
                        <RemarkIcon className="text-default-400" />
                        <span className="text-sm">{record.remark}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 库存调整模态框 */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Chip
                color={
                  adjustmentType === "in" ? "success" : 
                  adjustmentType === "out" ? "danger" : "warning"
                }
                variant="flat"
              >
                {adjustmentType === "in" ? "入库" : 
                 adjustmentType === "out" ? "出库" : "库存调整"}
              </Chip>
              <span>{supply.name}</span>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前库存
              </label>
              <div className="flex items-center gap-2">
                <Badge
                  color={supply.current_stock <= supply.safety_stock ? "danger" : "success"}
                  variant="flat"
                  size="lg"
                >
                  {supply.current_stock} {supply.unit}
                </Badge>
                <Chip
                  color={supply.current_stock <= supply.safety_stock ? "danger" : "success"}
                  variant="flat"
                  size="sm"
                >
                  {supply.current_stock <= supply.safety_stock ? "库存不足" : "库存充足"}
                </Chip>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {adjustmentType === "in" ? "入库数量" : 
                 adjustmentType === "out" ? "出库数量" : "调整后库存"}
                <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                placeholder={`请输入${adjustmentType === "in" ? "入库" : 
                               adjustmentType === "out" ? "出库" : "调整"}数量`}
                value={adjustmentQuantity}
                onValueChange={setAdjustmentQuantity}
                startContent={<span className="text-default-400">{supply.unit}</span>}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                单价调整（可选）
              </label>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  当前单价：¥{parseFloat(supply.unit_price).toFixed(2)}
                </div>
                <Input
                  type="number"
                  placeholder="输入新单价（留空则不修改）"
                  value={adjustmentUnitPrice}
                  onValueChange={setAdjustmentUnitPrice}
                  startContent={<span className="text-default-400">¥</span>}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注说明
              </label>
              <Textarea
                placeholder="请输入备注信息（用途、原因等）"
                value={adjustmentRemark}
                onValueChange={setAdjustmentRemark}
                minRows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="flat"
              onClick={() => setShowAdjustModal(false)}
            >
              取消
            </Button>
            <Button
              color={
                adjustmentType === "in" ? "success" : 
                adjustmentType === "out" ? "danger" : "warning"
              }
              onClick={handleStockAdjustment}
              isLoading={isAdjusting}
            >
              {isAdjusting ? "处理中..." : "确认"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SupplyDetailsPage; 