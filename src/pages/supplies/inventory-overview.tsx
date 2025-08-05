import { FC, useState, Fragment, useCallback } from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Table as BaseTable,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Select,
  SelectItem,
  Chip,
  Tooltip,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  getKeyValue,
  Selection,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
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
import { addToast } from "@heroui/toast";

import {
  SearchIcon,
  WarningIcon,
  InfoIcon,
  PlusIcon,
  MinusIcon,
  EditIcon,
} from "@/components/icons";
import { useSupplies, SupplyItem } from "@/hooks/useSupplies";
import {
  validateDataConsistency,
  generateInventorySummary,
  fixDataInconsistencies,
} from "@/utils/dataConsistencyTest";
import { getCurrentDateForFilename } from "@/utils/dateUtils";

// Create a custom Table component that includes loading state
const Table = BaseTable as unknown as typeof BaseTable & {
  loadingState?: string;
};

// 根据类别返回对应的单位
const getUnitByCategory = (category: string): string => {
  const unitMap: Record<string, string> = {
    探针: "支",
    清洁剂: "瓶",
    继电器: "个",
    连接器: "个",
    轴承: "个",
    手动工具: "套",
    安全防护用品: "套",
    包装材料: "包",
    办公用品: "个",
    其他: "个",
  };

  return unitMap[category] || "个";
};

// 计算总价值
const calculateTotalValue = (supplies: SupplyItem[]): number => {
  return supplies.reduce((total, supply) => {
    return total + supply.current_stock * parseFloat(supply.unit_price);
  }, 0);
};

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

const columns = [
  {
    key: "name",
    label: "耗材名称",
  },
  {
    key: "category",
    label: "分类",
  },
  {
    key: "unit",
    label: "单位",
  },
  {
    key: "unit_price",
    label: "单价",
  },
  {
    key: "current_stock",
    label: "当前库存",
  },
  {
    key: "safety_stock",
    label: "安全库存",
  },
  {
    key: "status",
    label: "状态",
  },
  {
    key: "actions",
    label: "操作",
  },
];

// 格式化价格显示
const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`;
};

const SuppliesInventoryOverviewPage: FC = () => {
  const navigate = useNavigate();
  const {
    supplies,
    isLoading,
    error,
    adjustStock,
    fetchSupplies,
    records,
    updateSupply,
    deleteSupply,
  } = useSupplies();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [minQuantity, setMinQuantity] = useState<string>("");
  const [maxQuantity, setMaxQuantity] = useState<string>("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showConsistencyModal, setShowConsistencyModal] = useState(false);
  const [consistencyIssues, setConsistencyIssues] = useState<string[]>([]);
  const [isConsistencyValid, setIsConsistencyValid] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // 删除相关状态
  const [supplyToDelete, setSupplyToDelete] = useState<number | null>(null);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: openDeleteModal,
    onClose: closeDeleteModal,
  } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  // 多选相关状态
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(columns.map((c) => c.key)),
  );
  const [statusFilter, setStatusFilter] = useState<Selection>("all");

  // 批量操作相关状态
  const [isBatchOperating, setIsBatchOperating] = useState(false);
  const [batchQuantity, setBatchQuantity] = useState<string>("");
  const [batchRemark, setBatchRemark] = useState<string>("");
  const {
    isOpen: isBatchModalOpen,
    onOpen: openBatchModal,
    onClose: closeBatchModal,
  } = useDisclosure();
  const [currentOperation, setCurrentOperation] = useState<
    "in" | "out" | "adjust"
  >("in");

  // 添加新的状态用于存储每个耗材的调整数量
  const [batchAdjustments, setBatchAdjustments] = useState<
    Record<string, string>
  >({});

  // 添加新的状态用于存储每个耗材的备注
  const [batchRemarks, setBatchRemarks] = useState<Record<string, string>>({});

  const filteredData = supplies.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesQuantity =
      (!minQuantity || item.current_stock >= Number(minQuantity)) &&
      (!maxQuantity || item.current_stock <= Number(maxQuantity));

    return matchesSearch && matchesCategory && matchesQuantity;
  });

  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const categories = Array.from(new Set(supplies.map((item) => item.category)));

  // 准备饼图数据 - 按类别汇总
  const pieChartData = categories.map((category) => {
    const categorySupplies = supplies.filter(
      (item) => item.category === category,
    );
    const totalQuantity = categorySupplies.reduce(
      (sum, item) => sum + item.current_stock,
      0,
    );

    return {
      name: category,
      value: totalQuantity,
    };
  });

  // 准备柱状图数据
  const barChartData = supplies.map((item) => ({
    name: item.name,
    quantity: item.current_stock,
    safetyStock: item.safety_stock,
  }));

  const handleExportExcel = () => {
    // TODO: 实现导出Excel功能
    console.log("Exporting to Excel...");
  };

  const handleExportCSV = () => {
    // 准备CSV数据
    const headers = [
      "耗材名称",
      "分类",
      "单位",
      "单价",
      "当前库存",
      "总价值",
      "安全库存",
      "库存状态",
    ];
    const csvData = filteredData.map((item) => [
      item.name,
      item.category,
      item.unit,
      formatPrice(parseFloat(item.unit_price)),
      item.current_stock,
      formatPrice(item.current_stock * parseFloat(item.unit_price)),
      item.safety_stock,
      item.current_stock <= item.safety_stock ? "库存不足" : "库存充足",
    ]);

    // 转换为CSV格式
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // 创建Blob对象
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 创建下载链接并触发下载
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `库存总览_${getCurrentDateForFilename()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/supplies/details/${id}`);
  };

  const handleCheckConsistency = () => {
    setIsChecking(true);
    const result = validateDataConsistency(supplies, records);

    setConsistencyIssues(result.issues);
    setIsConsistencyValid(result.isValid);
    setShowConsistencyModal(true);
    setIsChecking(false);
  };

  const handleFixInconsistencies = async () => {
    const { fixedSupplies, issues } = fixDataInconsistencies(supplies, records);

    // 批量更新耗材库存
    for (const updatedSupply of fixedSupplies) {
      const originalSupply = supplies.find((s) => s.id === updatedSupply.id);

      if (
        originalSupply &&
        originalSupply.current_stock !== updatedSupply.current_stock
      ) {
        // 只调整库存，不通过updateSupply API
        try {
          await adjustStock({
            supply_id: updatedSupply.id,
            type: "adjust",
            quantity:
              updatedSupply.current_stock - originalSupply.current_stock,
            remark: "数据一致性修复",
          });
        } catch (error) {
          console.error(`Failed to fix supply ${updatedSupply.id}:`, error);
        }
      }
    }

    setConsistencyIssues(issues);
    setIsConsistencyValid(true);
  };

  const summary = generateInventorySummary(supplies, records);

  // 处理删除耗材
  const handleDelete = async () => {
    if (!supplyToDelete) return;

    try {
      setIsDeleting(true);
      await deleteSupply(supplyToDelete);
      addToast({
        title: "删除成功",
        description: "耗材已成功删除",
        color: "success",
        timeout: 3000,
      });
      closeDeleteModal();
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
      setSupplyToDelete(null);
    }
  };

  // 检查选择状态
  const hasSelectedItems = useCallback((selection: Selection) => {
    if (selection === "all") return true;

    return (selection as Set<string>).size > 1;
  }, []);

  // 处理批量操作
  const handleBatchOperation = useCallback(
    async (operation: "in" | "out" | "adjust") => {
      // 防止重复操作
      if (isBatchOperating) return;

      // 将Selection类型转换为Set
      const selectedSet =
        selectedKeys === "all"
          ? new Set(supplies.map((s) => s.id.toString()))
          : (selectedKeys as Set<string>);

      const selectedItems = Array.from(selectedSet)
        .map((key) => supplies.find((supply) => supply.id.toString() === key))
        .filter(
          (supply): supply is NonNullable<typeof supply> =>
            supply !== undefined,
        );

      if (selectedItems.length === 0) {
        addToast({
          title: "请选择耗材",
          description: "请先选择要操作的耗材",
          color: "warning",
          timeout: 3000,
        });

        return;
      }

      setCurrentOperation(operation);
      setBatchQuantity("");
      setBatchRemark("");
      openBatchModal();
    },
    [selectedKeys, supplies, isBatchOperating],
  );

  // 执行批量操作
  const executeBatchOperation = async () => {
    // 1. 输入验证
    if (Object.keys(batchAdjustments).length === 0) {
      addToast({
        title: "输入错误",
        description: "请至少设置一个耗材的数量",
        color: "danger",
        timeout: 3000,
      });

      return;
    }

    // 2. 选择验证
    const selectedSet =
      selectedKeys === "all"
        ? new Set(supplies.map((s) => s.id.toString()))
        : (selectedKeys as Set<string>);

    if (selectedSet.size === 0) {
      addToast({
        title: "选择错误",
        description: "请至少选择一个耗材",
        color: "danger",
        timeout: 3000,
      });

      return;
    }

    const selectedItems = Array.from(selectedSet)
      .map((key) => supplies.find((supply) => supply.id.toString() === key))
      .filter(
        (supply): supply is NonNullable<typeof supply> => supply !== undefined,
      );

    // 3. 预检查
    const errorItems: string[] = [];
    const warningItems: string[] = [];

    for (const supply of selectedItems) {
      const quantity = Number(batchAdjustments[supply.id.toString()]);

      if (isNaN(quantity) || quantity <= 0) {
        errorItems.push(`${supply.name}(无效的数量)`);
        continue;
      }

      if (currentOperation === "adjust") {
        if (quantity < supply.safety_stock) {
          warningItems.push(
            `${supply.name}(低于安全库存${supply.safety_stock} ${supply.unit})`,
          );
        } else if (quantity > supply.max_stock) {
          warningItems.push(
            `${supply.name}(超过最大库存${supply.max_stock} ${supply.unit})`,
          );
        }
      } else if (currentOperation === "out") {
        if (quantity > supply.current_stock) {
          errorItems.push(
            `${supply.name}(库存不足: ${supply.current_stock} ${supply.unit})`,
          );
        } else if (supply.current_stock - quantity < supply.safety_stock) {
          warningItems.push(
            `${supply.name}(将低于安全库存${supply.safety_stock} ${supply.unit})`,
          );
        }
      } else if (currentOperation === "in") {
        if (supply.current_stock + quantity > supply.max_stock) {
          warningItems.push(
            `${supply.name}(将超过最大库存${supply.max_stock} ${supply.unit})`,
          );
        }
      }
    }

    // 4. 显示警告和错误
    if (errorItems.length > 0) {
      addToast({
        title: "操作错误",
        description: `以下耗材无法${currentOperation === "out" ? "出库" : "操作"}：\n${errorItems.join("\n")}`,
        color: "danger",
        timeout: 5000,
      });

      return;
    }

    if (warningItems.length > 0) {
      addToast({
        title: "库存预警",
        description: `以下耗材需要注意：\n${warningItems.join("\n")}`,
        color: "warning",
        timeout: 5000,
      });
    }

    // 5. 执行操作
    try {
      setIsBatchOperating(true);
      let successCount = 0;
      let failCount = 0;

      for (const supply of selectedItems) {
        try {
          const quantity = Number(batchAdjustments[supply.id.toString()]);

          if (isNaN(quantity) || quantity <= 0) continue;

          if (currentOperation === "adjust") {
            const adjustQuantity = quantity - supply.current_stock;

            await adjustStock({
              supply_id: supply.id,
              type: "adjust",
              quantity: adjustQuantity,
              remark:
                batchRemarks[supply.id.toString()] ||
                `批量调整 - ${supply.name} (${supply.current_stock} → ${quantity})`,
            });
          } else {
            await adjustStock({
              supply_id: supply.id,
              type: currentOperation,
              quantity: currentOperation === "out" ? -quantity : quantity,
              remark:
                batchRemarks[supply.id.toString()] ||
                `批量${currentOperation === "in" ? "入库" : "出库"} - ${supply.name}`,
            });
          }
          successCount++;
        } catch (error) {
          console.error(`操作失败 - ${supply.name}:`, error);
          failCount++;
        }
      }

      // 6. 显示操作结果
      if (successCount > 0) {
        addToast({
          title: "操作完成",
          description: `成功处理 ${successCount} 个耗材${failCount > 0 ? `，失败 ${failCount} 个` : ""}`,
          color: failCount > 0 ? "warning" : "success",
          timeout: 3000,
        });
      } else {
        addToast({
          title: "操作失败",
          description: "所有操作均未成功",
          color: "danger",
          timeout: 3000,
        });
      }

      // 7. 清理状态
      if (successCount > 0) {
        setSelectedKeys(new Set([]));
        setBatchQuantity("");
        setBatchAdjustments({});
        setBatchRemarks({});
        closeBatchModal();
        // 刷新数据
        await fetchSupplies();
      }
    } catch (error) {
      console.error(`批量${currentOperation}操作失败:`, error);
      addToast({
        title: "操作失败",
        description:
          error instanceof Error
            ? error.message
            : `批量${currentOperation}操作失败`,
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setIsBatchOperating(false);
    }
  };

  // 渲染单元格
  const renderCell = useCallback(
    (item: SupplyItem, columnKey: React.Key) => {
      const value = getKeyValue(item, columnKey as keyof SupplyItem);

      if (columnKey === "category") {
        return (
          <TableCell>
            <Chip color="primary" variant="flat">
              {value}
            </Chip>
          </TableCell>
        );
      }

      if (columnKey === "unit_price") {
        return <TableCell>{formatPrice(Number(value))}</TableCell>;
      }

      if (columnKey === "current_stock") {
        return (
          <TableCell>
            <Badge
              color={
                item.current_stock <= item.safety_stock ? "danger" : "success"
              }
              variant="flat"
            >
              {value}
            </Badge>
          </TableCell>
        );
      }

      if (columnKey === "status") {
        return (
          <TableCell>
            <Chip
              color={
                item.current_stock <= item.safety_stock ? "danger" : "success"
              }
              variant="flat"
            >
              {item.current_stock <= item.safety_stock
                ? "库存不足"
                : "库存充足"}
            </Chip>
          </TableCell>
        );
      }

      if (columnKey === "actions") {
        return (
          <TableCell>
            <div className="flex gap-2">
              <Tooltip content="查看详情">
                <Button
                  isIconOnly
                  color="primary"
                  size="sm"
                  variant="flat"
                  onClick={() => navigate(`/supplies/details/${item.id}`)}
                >
                  <InfoIcon />
                </Button>
              </Tooltip>
            </div>
          </TableCell>
        );
      }

      return <TableCell>{value}</TableCell>;
    },
    [navigate],
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">库存总览</h1>
        <div className="flex items-center gap-2">
          <Button
            color="warning"
            isLoading={isChecking}
            startContent={<WarningIcon />}
            variant="flat"
            onClick={handleCheckConsistency}
          >
            数据一致性检查
          </Button>
        </div>
      </div>

      {/* 统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">
              {summary.totalSupplies}
            </div>
            <div className="text-sm text-gray-600">总耗材数</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">
              {summary.totalRecords}
            </div>
            <div className="text-sm text-gray-600">变动记录数</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-danger">
              {summary.lowStockItems}
            </div>
            <div className="text-sm text-gray-600">库存不足</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">
              {summary.recentActivity}
            </div>
            <div className="text-sm text-gray-600">本周变动</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(calculateTotalValue(supplies))}
            </div>
            <div className="text-sm text-gray-600">库存总价值</div>
          </CardBody>
        </Card>
      </div>

      {/* 搜索与筛选栏 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <Input
                isClearable
                className="w-64"
                placeholder="搜索耗材名称..."
                startContent={<SearchIcon className="text-default-400" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <Select
                className="w-48"
                selectedKeys={new Set([selectedCategory])}
                onSelectionChange={(keys) =>
                  setSelectedCategory(Array.from(keys)[0] as string)
                }
              >
                <Fragment>
                  <SelectItem key="all" textValue="全部">
                    全部
                  </SelectItem>
                  {Array.from(
                    new Set(supplies.map((item) => item.category)),
                  ).map((category) => (
                    <SelectItem key={category} textValue={category}>
                      {category}
                    </SelectItem>
                  ))}
                </Fragment>
              </Select>
              <Input
                className="w-32"
                placeholder="最小数量"
                type="number"
                value={minQuantity}
                onValueChange={setMinQuantity}
              />
              <Input
                className="w-32"
                placeholder="最大数量"
                type="number"
                value={maxQuantity}
                onValueChange={setMaxQuantity}
              />
            </div>
            <div className="flex gap-2">
              <Button
                color="success"
                isDisabled={!hasSelectedItems(selectedKeys) || isBatchOperating}
                isLoading={isBatchOperating}
                startContent={<PlusIcon />}
                variant="flat"
                onClick={() => handleBatchOperation("in")}
              >
                批量入库
              </Button>
              <Button
                color="danger"
                isDisabled={!hasSelectedItems(selectedKeys) || isBatchOperating}
                isLoading={isBatchOperating}
                startContent={<MinusIcon />}
                variant="flat"
                onClick={() => handleBatchOperation("out")}
              >
                批量出库
              </Button>
              <Button
                color="warning"
                isDisabled={!hasSelectedItems(selectedKeys) || isBatchOperating}
                isLoading={isBatchOperating}
                startContent={<EditIcon />}
                variant="flat"
                onClick={() => handleBatchOperation("adjust")}
              >
                批量调整
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 耗材列表 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <Table
                aria-label="耗材列表"
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                style={{ opacity: isLoading ? 0.5 : 1 }}
                onSelectionChange={setSelectedKeys}
              >
                <TableHeader>
                  {columns.map((column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                  ))}
                </TableHeader>
                <TableBody items={paginatedData}>
                  {(item) => (
                    <TableRow key={item.id}>
                      {(columnKey) => renderCell(item, columnKey)}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-between items-center">
              <span className="text-default-400 text-small">
                {selectedKeys === "all"
                  ? "已选择所有项目"
                  : `已选择 ${(selectedKeys as Set<string>).size} / ${filteredData.length} 项`}
              </span>

              <Pagination
                page={page}
                total={Math.ceil(filteredData.length / rowsPerPage)}
                onChange={setPage}
              />
            </div>
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
            <div className="h-[400px]">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart margin={{ top: 20, right: 80, bottom: 80, left: 80 }}>
                  <Pie
                    cx="50%"
                    cy="45%"
                    data={pieChartData}
                    dataKey="value"
                    fill="#8884d8"
                    label={false}
                    labelLine={false}
                    minAngle={5}
                    outerRadius={70}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name) => [`${value} 项`, name]}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const item = pieChartData.find((d) => d.name === value);
                      const percent = item
                        ? (
                            (item.value /
                              pieChartData.reduce(
                                (sum, d) => sum + d.value,
                                0,
                              )) *
                            100
                          ).toFixed(0)
                        : "0";

                      return `${value} ${percent}%`;
                    }}
                    height={60}
                    verticalAlign="bottom"
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "12px",
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
              {supplies
                .filter((item) => item.current_stock <= item.safety_stock)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-danger-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">
                        {item.name}
                      </span>
                      <Chip color="primary" size="sm" variant="flat">
                        {item.category}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color="danger" variant="flat">
                        {item.current_stock} {item.unit}
                      </Badge>
                      <Chip color="danger" size="sm" variant="flat">
                        安全库存: {item.safety_stock}
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
            <h3 className="text-lg font-semibold text-gray-700">
              库存数量一览
            </h3>
            <div className="flex gap-2">
              <Chip className="font-medium" color="primary" variant="flat">
                当前库存
              </Chip>
              <Chip className="font-medium" color="success" variant="flat">
                安全库存
              </Chip>
            </div>
          </div>
          <div className="h-[500px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                barGap={0}
                data={barChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 100,
                }}
              >
                <CartesianGrid
                  stroke="#E5E7EB"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  angle={-45}
                  dataKey="name"
                  fontSize={12}
                  height={80}
                  interval={0}
                  textAnchor="end"
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar
                  dataKey="quantity"
                  fill="#3B82F6"
                  name="当前库存"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="safetyStock"
                  fill="#10B981"
                  name="安全库存"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* 数据一致性检查模态框 */}
      <Modal
        isOpen={showConsistencyModal}
        size="lg"
        onClose={() => setShowConsistencyModal(false)}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isConsistencyValid ? (
                <Chip
                  color="success"
                  startContent={<InfoIcon />}
                  variant="flat"
                >
                  数据一致性检查
                </Chip>
              ) : (
                <Chip
                  color="warning"
                  startContent={<WarningIcon />}
                  variant="flat"
                >
                  发现数据不一致
                </Chip>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            {isConsistencyValid ? (
              <div className="text-center py-6">
                <InfoIcon className="text-success text-5xl mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-success mb-2">
                  数据一致性良好
                </h3>
                <p className="text-gray-600 text-sm">
                  库存总览和变动台账的数据完全一致，没有发现任何问题。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <h4 className="font-semibold text-warning-800 mb-2 text-sm">
                    发现以下问题：
                  </h4>
                  <ul className="space-y-1">
                    {consistencyIssues.map((issue, index) => (
                      <li
                        key={index}
                        className="text-xs text-warning-700 flex items-start gap-2"
                      >
                        <span className="text-warning-500 mt-1">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-info-50 border border-info-200 rounded-lg p-3">
                  <h4 className="font-semibold text-info-800 mb-2 text-sm">
                    建议操作：
                  </h4>
                  <p className="text-xs text-info-700">
                    点击"修复数据"按钮将根据变动记录自动修正库存数据，确保数据一致性。
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="flat"
              onClick={() => setShowConsistencyModal(false)}
            >
              关闭
            </Button>
            {!isConsistencyValid && (
              <Button color="warning" onClick={handleFixInconsistencies}>
                修复数据
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认对话框 */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <ModalContent>
          <ModalHeader>确认删除</ModalHeader>
          <ModalBody>
            <p>确定要删除这个耗材吗？此操作不可撤销。</p>
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

      {/* 批量操作模态框 */}
      <Modal
        isOpen={isBatchModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => {
          closeBatchModal();
          setBatchAdjustments({});
          setBatchRemarks({});
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold">
                {currentOperation === "in"
                  ? "批量入库"
                  : currentOperation === "out"
                    ? "批量出库"
                    : "批量调整"}
              </h3>
              <p className="text-small text-default-500">
                已选择{" "}
                {
                  Array.from(
                    selectedKeys === "all"
                      ? new Set(supplies.map((s) => s.id.toString()))
                      : (selectedKeys as Set<string>),
                  ).length
                }{" "}
                个耗材
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from(
                  selectedKeys === "all"
                    ? new Set(supplies.map((s) => s.id.toString()))
                    : (selectedKeys as Set<string>),
                ).map((key) => {
                  const supply = supplies.find((s) => s.id.toString() === key);

                  if (!supply) return null;

                  return (
                    <Card key={supply.id} className="p-3 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-medium text-sm truncate"
                              title={supply.name}
                            >
                              {supply.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Chip color="primary" size="sm" variant="flat">
                                {supply.category}
                              </Chip>
                              <span className="text-xs text-default-500">
                                当前: {supply.current_stock} {supply.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Input
                            className="min-w-0"
                            description={
                              currentOperation === "adjust"
                                ? `安全库存: ${supply.safety_stock} / 最大库存: ${supply.max_stock}`
                                : currentOperation === "in"
                                  ? `当前: ${supply.current_stock} / 最大库存: ${supply.max_stock}`
                                  : `当前: ${supply.current_stock} / 安全库存: ${supply.safety_stock}`
                            }
                            errorMessage={
                              batchAdjustments[supply.id.toString()] &&
                              (currentOperation === "adjust"
                                ? Number(
                                    batchAdjustments[supply.id.toString()],
                                  ) < supply.safety_stock
                                  ? "低于安全库存"
                                  : Number(
                                        batchAdjustments[supply.id.toString()],
                                      ) > supply.max_stock
                                    ? "超过最大库存"
                                    : ""
                                : currentOperation === "in"
                                  ? supply.current_stock +
                                      Number(
                                        batchAdjustments[supply.id.toString()],
                                      ) >
                                    supply.max_stock
                                    ? "将超过最大库存"
                                    : ""
                                  : currentOperation === "out"
                                    ? Number(
                                        batchAdjustments[supply.id.toString()],
                                      ) > supply.current_stock
                                      ? "库存不足"
                                      : supply.current_stock -
                                            Number(
                                              batchAdjustments[
                                                supply.id.toString()
                                              ],
                                            ) <
                                          supply.safety_stock
                                        ? "将低于安全库存"
                                        : ""
                                    : "")
                            }
                            label={
                              currentOperation === "adjust"
                                ? "调整后数量"
                                : currentOperation === "in"
                                  ? "入库数量"
                                  : "出库数量"
                            }
                            labelPlacement="outside"
                            min={0}
                            placeholder={
                              currentOperation === "adjust"
                                ? `当前: ${supply.current_stock}`
                                : "请输入数量"
                            }
                            size="sm"
                            step={1}
                            type="number"
                            value={batchAdjustments[supply.id.toString()] || ""}
                            onChange={(e) => {
                              let value = e.target.value;

                              // 确保输入为非负数
                              value = value.replace(/^-/, "");
                              if (value === "") {
                                setBatchAdjustments((prev) => ({
                                  ...prev,
                                  [supply.id.toString()]: "",
                                }));

                                return;
                              }

                              const numValue = Number(value);

                              if (isNaN(numValue)) return;

                              setBatchAdjustments((prev) => ({
                                ...prev,
                                [supply.id.toString()]: value,
                              }));
                            }}
                          />
                          <Input
                            className="min-w-0"
                            label="备注"
                            labelPlacement="outside"
                            placeholder="请输入操作备注"
                            size="sm"
                            value={batchRemarks[supply.id.toString()] || ""}
                            onChange={(e) => {
                              setBatchRemarks((prev) => ({
                                ...prev,
                                [supply.id.toString()]: e.target.value,
                              }));
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t">
            <Button
              color="danger"
              variant="light"
              onPress={() => {
                closeBatchModal();
                setBatchAdjustments({});
                setBatchRemarks({});
              }}
            >
              取消
            </Button>
            <Button
              color="primary"
              isDisabled={
                Object.keys(batchAdjustments).length === 0 ||
                Object.values(batchAdjustments).some(
                  (v) => !v || isNaN(Number(v)) || Number(v) < 0,
                )
              }
              isLoading={isBatchOperating}
              onPress={executeBatchOperation}
            >
              确认
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SuppliesInventoryOverviewPage;
