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
  useDisclosure,
} from "@heroui/react";
import {
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
import { addToast } from "@heroui/toast";

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
  TrashIcon,
} from "@/components/icons";
import { useSupplies, SupplyItem, InventoryRecord } from "@/hooks/useSupplies";
import { formatTimestamp, getCurrentDateForFilename } from "@/utils/dateUtils";
import { materialManagementApi } from "@/services/materialManagement";

const SupplyDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    supplies,
    records,
    adjustStock,
    fetchRecords,
    deleteSupply,
    isLoading,
    error,
  } = useSupplies();

  const [supply, setSupply] = useState<SupplyItem | null>(null);
  const [supplyRecords, setSupplyRecords] = useState<InventoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InventoryRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 筛选状态
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    start: DateValue;
    end: DateValue;
  } | null>(null);

  // 库存调整模态框
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out" | "adjust">(
    "in",
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentUnitPrice, setAdjustmentUnitPrice] = useState("");
  const [adjustmentRemark, setAdjustmentRemark] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // 删除相关状态
  const {
    isOpen: isDeleteModalOpen,
    onOpen: openDeleteModal,
    onClose: closeDeleteModal,
  } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      const supplyId = parseInt(id);
      const foundSupply = supplies.find((s) => s.id === supplyId);

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
      const supplyRecords = records.filter((r) => r.supply === supply.id);

      setSupplyRecords(supplyRecords);
      setFilteredRecords(supplyRecords);
    }
  }, [supply, records]);

  // 筛选记录
  useEffect(() => {
    let filtered = supplyRecords;

    // 按操作类型筛选
    if (selectedType !== "all") {
      filtered = filtered.filter((r) => r.type === selectedType);
    }

    // 按日期范围筛选
    if (dateRange) {
      const startDate = new Date(dateRange.start.toString());
      const endDate = new Date(dateRange.end.toString());

      filtered = filtered.filter((r) => {
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
    currentPage * pageSize,
  );

  // 生成图表数据
  const generateChartData = () => {
    const sortedRecords = [...supplyRecords].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    let runningStock = 0;

    return sortedRecords.map((record) => {
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

    supplyRecords.forEach((record) => {
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
      addToast({
        title: "输入错误",
        description: "请输入有效的数量",
        color: "warning",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });

      return;
    }

    if (adjustmentType === "out" && quantity > supply.current_stock) {
      addToast({
        title: "库存不足",
        description: "出库数量不能超过当前库存",
        color: "warning",
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });

      return;
    }

    // 验证单价（如果输入了的话）
    let unitPrice: number | undefined = undefined;

    if (adjustmentUnitPrice) {
      const price = Number(adjustmentUnitPrice);

      if (isNaN(price) || price < 0) {
        addToast({
          title: "单价错误",
          description: "请输入有效的单价",
          color: "warning",
          timeout: 3000,
          shouldShowTimeoutProgress: true,
        });

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

      addToast({
        title: "操作成功",
        description: "库存调整成功",
        color: "success",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("库存调整失败:", error);
      addToast({
        title: "调整失败",
        description: "库存调整失败，请重试",
        color: "danger",
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  // 导出记录
  const handleExportRecords = () => {
    const headers = [
      "日期/时间",
      "操作类型",
      "数量",
      "单位",
      "操作人",
      "部门",
      "备注",
    ];
    const csvData = filteredRecords.map((record) => [
      record.timestamp,
      record.type === "in" ? "入库" : record.type === "out" ? "出库" : "调整",
      record.quantity,
      record.supply_unit || supply?.unit || "",
      record.operator,
      record.department,
      record.remark,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `${supply?.name}_变动记录_${getCurrentDateForFilename()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 处理删除耗材
  const handleDelete = async () => {
    if (!supply) return;

    try {
      setIsDeleting(true);
      await deleteSupply(supply.id);
      addToast({
        title: "删除成功",
        description: "耗材已成功删除",
        color: "success",
        timeout: 3000,
      });
      navigate("/supplies/inventory-overview");
    } catch (error) {
      addToast({
        title: "删除失败",
        description:
          error instanceof Error ? error.message : "删除耗材时发生错误",
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const importB453Data = async () => {
    try {
      // 创建2025年7月的计算项目数据
      const items = [
        {
          no: 1,
          material_name: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
          usage_station: "MLB Left DFU",
          usage_per_set: 21,
          usage_count: 50000,
          monthly_capacity: 363000,
          min_stock: 228,
          max_stock: 512,
          monthly_demand: 152,
          monthly_net_demand: 432,
          actual_stock: 0, // 添加缺失的字段
          moq_remark: "MOQ: 100",
          purchaser: "",
          linked_material: "",
          unit_price: 500,
        },
        {
          no: 1,
          material_name: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
          usage_station: "MLB Right FCT",
          usage_per_set: 8,
          usage_count: 50000,
          monthly_capacity: 363000,
          min_stock: 228,
          max_stock: 512,
          monthly_demand: 54,
          monthly_net_demand: 432,
          actual_stock: 0,
          moq_remark: "MOQ: 100",
          purchaser: "",
          linked_material: "",
          unit_price: 500,
        },
        {
          no: 1,
          material_name: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
          usage_station: "MLB Right R2 FCT",
          usage_per_set: 8,
          usage_count: 50000,
          monthly_capacity: 363000,
          min_stock: 228,
          max_stock: 512,
          monthly_demand: 54,
          monthly_net_demand: 432,
          actual_stock: 0,
          moq_remark: "MOQ: 100",
          purchaser: "",
          linked_material: "",
          unit_price: 500,
        },
        {
          no: 1,
          material_name: "設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)",
          usage_station: "MLB Left FCT",
          usage_per_set: 24,
          usage_count: 50000,
          monthly_capacity: 363000,
          min_stock: 228,
          max_stock: 512,
          monthly_demand: 171,
          monthly_net_demand: 432,
          actual_stock: 0,
          moq_remark: "MOQ: 100",
          purchaser: "",
          linked_material: "",
          unit_price: 500,
        },
        {
          no: 2,
          material_name:
            "設備耗材類-(B453/L&R FCT設備/探針/TB1-058B270T70-BB-A38)",
          usage_station: "MLB Left FCT",
          usage_per_set: 8,
          usage_count: 50000,
          monthly_capacity: 363000,
          min_stock: 61,
          max_stock: 138,
          monthly_demand: 58,
          monthly_net_demand: 116,
          actual_stock: 0,
          moq_remark: "MOQ: 100",
          purchaser: "",
          linked_material: "",
          unit_price: 100,
        },
        {
          no: 2,
          material_name:
            "設備耗材類-(B453/L&R FCT設備/探針/TB1-058B270T70-BB-A38)",
          usage_station: "MLB Right FCT",
          usage_per_set: 8,
          usage_count: 50000,
          monthly_capacity: 363000,
          min_stock: 61,
          max_stock: 138,
          monthly_demand: 58,
          monthly_net_demand: 116,
          actual_stock: 0,
          moq_remark: "MOQ: 100",
          purchaser: "",
          linked_material: "",
          unit_price: 100,
        },
        {
          no: 3,
          material_name:
            "設備耗材類-(B453/AJ FCT設備探針/GKS-075 291 064 A 2000)",
          usage_station: "AJ FCT",
          usage_per_set: 18,
          usage_count: 60000,
          monthly_capacity: 363000,
          min_stock: 58,
          max_stock: 129,
          monthly_demand: 109,
          monthly_net_demand: 109,
          actual_stock: 0,
          moq_remark: "MOQ: 100",
          purchaser: "",
          linked_material: "",
          unit_price: 100,
        },
        {
          no: 4,
          material_name: "生產耗材類-(B453/探針消潔劑 / RK-58D 450ML(金手指))",
          usage_station: "所有測試站",
          usage_per_set: 1.5,
          usage_count: 100000,
          monthly_capacity: 363000,
          min_stock: 3,
          max_stock: 6,
          monthly_demand: 5,
          monthly_net_demand: 5,
          actual_stock: 0,
          moq_remark: "MOQ: 100",
          purchaser: "",
          linked_material: "",
          unit_price: 5,
        },
      ];

      // 批量创建计算项目
      const result =
        await materialManagementApi.b453Calculation.bulkCreate(items);

      console.log("导入B453计算表数据成功:", result);

      // 更新UI显示
      addToast({
        title: "导入成功",
        description: "成功导入B453计算表数据",
        color: "success",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("导入B453计算表数据失败:", error);
      addToast({
        title: "导入失败",
        description: "导入B453计算表数据失败",
        color: "danger",
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  const importB453ForecastData = async () => {
    try {
      const forecastData = {
        name: "2025年7月产能预测",
        mar_24: 191800,
        oct_24: 340100,
        dec_24: 430000,
        jan_25: 410000,
        feb_25: 270000,
        mar_25: 312000,
        apr_25: 317400,
        may_25: 375000,
        jun_25: 400000,
        jul_25: 363000,
      };

      // 创建产能预测数据
      const result =
        await materialManagementApi.b453Forecast.create(forecastData);

      console.log("导入B453产能预测数据成功:", result);

      // 更新UI显示
      addToast({
        title: "导入成功",
        description: "成功导入B453产能预测数据",
        color: "success",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("导入B453产能预测数据失败:", error);
      addToast({
        title: "导入失败",
        description: "导入B453产能预测数据失败",
        color: "danger",
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">
            加载中...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            错误: {error}
          </h2>
          <Button
            color="primary"
            startContent={<ArrowLeftIcon />}
            variant="flat"
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
          <h2 className="text-xl font-semibold text-gray-600 mb-4">
            耗材不存在
          </h2>
          <Button
            color="primary"
            startContent={<ArrowLeftIcon />}
            variant="flat"
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
            startContent={<ArrowLeftIcon />}
            variant="flat"
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
            startContent={<PlusIcon />}
            variant="flat"
            onClick={() => {
              setAdjustmentType("in");
              setShowAdjustModal(true);
            }}
          >
            入库
          </Button>
          <Button
            color="danger"
            startContent={<MinusIcon />}
            variant="flat"
            onClick={() => {
              setAdjustmentType("out");
              setShowAdjustModal(true);
            }}
          >
            出库
          </Button>
          <Button
            color="warning"
            startContent={<EditIcon />}
            variant="flat"
            onClick={() => {
              setAdjustmentType("adjust");
              setShowAdjustModal(true);
            }}
          >
            调整
          </Button>
          <Button
            color="danger"
            startContent={<TrashIcon />}
            variant="flat"
            onClick={openDeleteModal}
          >
            删除
          </Button>
          <Button
            color="primary"
            startContent={<DownloadIcon />}
            variant="flat"
            onClick={handleExportRecords}
          >
            导出记录
          </Button>
          <Button
            color="primary"
            startContent={<DownloadIcon />}
            variant="flat"
            onClick={importB453Data}
          >
            导入B453计算表数据
          </Button>
          <Button
            color="primary"
            startContent={<DownloadIcon />}
            variant="flat"
            onClick={importB453ForecastData}
          >
            导入B453产能预测数据
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
                <label className="text-sm font-medium text-gray-600">
                  耗材名称
                </label>
                <p className="text-lg font-semibold">{supply.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  分类
                </label>
                <Chip color="primary" variant="flat">
                  {supply.category}
                </Chip>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  当前库存
                </label>
                <div className="flex items-center gap-2">
                  <Badge
                    color={
                      supply.current_stock <= supply.safety_stock
                        ? "danger"
                        : "success"
                    }
                    size="lg"
                    variant="flat"
                  >
                    {supply.current_stock} {supply.unit}
                  </Badge>
                  <Chip
                    color={
                      supply.current_stock <= supply.safety_stock
                        ? "danger"
                        : "success"
                    }
                    size="sm"
                    variant="flat"
                  >
                    {supply.current_stock <= supply.safety_stock
                      ? "库存不足"
                      : "库存充足"}
                  </Chip>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  安全库存
                </label>
                <p className="text-lg">
                  {supply.safety_stock} {supply.unit}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  单价
                </label>
                <p className="text-lg font-semibold text-green-600">
                  ¥{parseFloat(supply.unit_price).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  库存总价值
                </label>
                <p className="text-lg font-semibold text-blue-600">
                  ¥
                  {(
                    supply.current_stock * parseFloat(supply.unit_price)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  单位
                </label>
                <p className="text-lg">{supply.unit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  变动记录数
                </label>
                <p className="text-lg font-semibold text-primary">
                  {supplyRecords.length}
                </p>
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
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    angle={-45}
                    dataKey="date"
                    fontSize={12}
                    height={80}
                    interval={0}
                    textAnchor="end"
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    dataKey="stock"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    stroke="#3B82F6"
                    type="monotone"
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
              <ResponsiveContainer height="100%" width="100%">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                时间范围
              </label>
              <DateRangePicker
                className="w-full"
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                操作类型
              </label>
              <Select
                className="w-full"
                selectedKeys={new Set([selectedType])}
                onSelectionChange={(keys) =>
                  setSelectedType(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all">全部</SelectItem>
                <SelectItem key="in">入库</SelectItem>
                <SelectItem key="out">出库</SelectItem>
                <SelectItem key="adjust">调整</SelectItem>
              </Select>
            </div>
            <Button
              color="primary"
              startContent={<DownloadIcon />}
              variant="flat"
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
            <h3 className="text-lg font-semibold">
              变动记录 ({filteredRecords.length})
            </h3>
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
                      color="default"
                      startContent={<ClockIcon className="text-default-500" />}
                      variant="flat"
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
                            : "warning"
                      }
                      variant="flat"
                    >
                      {record.type === "in"
                        ? "+"
                        : record.type === "out"
                          ? "-"
                          : ""}
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
        className="mx-4"
        isOpen={showAdjustModal}
        placement="center"
        scrollBehavior="inside"
        size="lg"
        onClose={() => setShowAdjustModal(false)}
      >
        <ModalContent className="max-h-[90vh]">
          <ModalHeader className="flex flex-col gap-1 pb-2">
            <div className="flex items-center gap-2">
              <Chip
                color={
                  adjustmentType === "in"
                    ? "success"
                    : adjustmentType === "out"
                      ? "danger"
                      : "warning"
                }
                variant="flat"
              >
                {adjustmentType === "in"
                  ? "入库"
                  : adjustmentType === "out"
                    ? "出库"
                    : "库存调整"}
              </Chip>
              <span className="truncate">{supply.name}</span>
            </div>
          </ModalHeader>
          <ModalBody className="py-4 max-h-[60vh] overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前库存
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  color={
                    supply.current_stock <= supply.safety_stock
                      ? "danger"
                      : "success"
                  }
                  size="lg"
                  variant="flat"
                >
                  {supply.current_stock} {supply.unit}
                </Badge>
                <Chip
                  color={
                    supply.current_stock <= supply.safety_stock
                      ? "danger"
                      : "success"
                  }
                  size="sm"
                  variant="flat"
                >
                  {supply.current_stock <= supply.safety_stock
                    ? "库存不足"
                    : "库存充足"}
                </Chip>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {adjustmentType === "in"
                  ? "入库数量"
                  : adjustmentType === "out"
                    ? "出库数量"
                    : "调整后库存"}
                <span className="text-danger">*</span>
              </label>
              <Input
                placeholder={`请输入${
                  adjustmentType === "in"
                    ? "入库"
                    : adjustmentType === "out"
                      ? "出库"
                      : "调整"
                }数量`}
                startContent={
                  <span className="text-default-400">{supply.unit}</span>
                }
                type="number"
                value={adjustmentQuantity}
                onValueChange={setAdjustmentQuantity}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                单价调整（可选）
              </label>
              <div className="space-y-2">
                <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                  当前单价：¥{parseFloat(supply.unit_price).toFixed(2)}
                </div>
                <Input
                  min="0"
                  placeholder="输入新单价（留空则不修改）"
                  startContent={<span className="text-default-400">¥</span>}
                  step="0.01"
                  type="number"
                  value={adjustmentUnitPrice}
                  onValueChange={setAdjustmentUnitPrice}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注说明
              </label>
              <Textarea
                className="resize-none"
                maxRows={5}
                minRows={3}
                placeholder="请输入备注信息（用途、原因等）"
                value={adjustmentRemark}
                onValueChange={setAdjustmentRemark}
              />
            </div>
          </ModalBody>
          <ModalFooter className="pt-2">
            <Button
              color="default"
              variant="flat"
              onClick={() => setShowAdjustModal(false)}
            >
              取消
            </Button>
            <Button
              color={
                adjustmentType === "in"
                  ? "success"
                  : adjustmentType === "out"
                    ? "danger"
                    : "warning"
              }
              isLoading={isAdjusting}
              onClick={handleStockAdjustment}
            >
              {isAdjusting ? "处理中..." : "确认"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认对话框 */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <ModalContent>
          <ModalHeader>确认删除</ModalHeader>
          <ModalBody>
            <p>确定要删除耗材 "{supply.name}" 吗？此操作不可撤销。</p>
            <p className="text-danger mt-2">
              删除后，所有相关的库存记录也将被删除。
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              disabled={isDeleting}
              variant="flat"
              onClick={closeDeleteModal}
            >
              取消
            </Button>
            <Button
              color="danger"
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SupplyDetailsPage;
