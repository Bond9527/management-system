import { FC, useState, useEffect, KeyboardEvent } from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Textarea,
  RadioGroup,
  Radio,
  Chip,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Badge,
  Spinner,
} from "@heroui/react";
import { PlusIcon, MinusIcon, EditIcon, UserIcon, ClockIcon, InfoIcon, ListIcon, HomeIcon, TrashIcon } from "@/components/icons";
import { useNavigate } from "react-router-dom";
import { supplyCategories } from "@/config/supplies";
import { useSupplies, SupplyItem } from "@/hooks/useSupplies";
import { formatTimestamp } from "@/utils/dateUtils";
import { useAuth } from "@/context/AuthContext";
import { addToast } from "@heroui/toast";

interface NewSupplyForm {
  name: string;
  category: string;
  unit: string;
  currentStock: string;
  safetyStock: string;
  maxStock: string;
  minStock: string;
  unitPrice: string;
}

interface NewSupplyErrors {
  name?: string;
  category?: string;
  unit?: string;
  currentStock?: string;
  safetyStock?: string;
  maxStock?: string;
  minStock?: string;
  unitPrice?: string;
}

interface FormErrors {
  supply?: string;
  quantity?: string;
  remark?: string;
}

interface BatchRecord {
  id: string;
  supplyId: string;
  quantity: string;
  remarks: string;
  operationType: "in" | "out" | "adjust";
}

const SuppliesAddRecordPage: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { supplies, addSupply, updateSupply, addRecord } = useSupplies();
  const [selectedSupply, setSelectedSupply] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [operationType, setOperationType] = useState<"in" | "out" | "adjust">("in");
  const [remark, setRemark] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockWarning, setStockWarning] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>([]);
  
  // New states for supply creation
  const [showNewSupplyModal, setShowNewSupplyModal] = useState(false);
  const [newSupply, setNewSupply] = useState<NewSupplyForm>({
    name: "",
    category: "",
    unit: "",
    currentStock: "",
    safetyStock: "",
    maxStock: "",
    minStock: "",
    unitPrice: "",
  });
  const [newSupplyErrors, setNewSupplyErrors] = useState<NewSupplyErrors>({});
  const [isCreatingSupply, setIsCreatingSupply] = useState(false);
  
  // New states for category management
  const [categories, setCategories] = useState<string[]>([...supplyCategories]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryError, setNewCategoryError] = useState("");

  // 获取选中的耗材信息
  const selectedSupplyItem = supplies.find((s: SupplyItem) => s.id.toString() === selectedSupply);

  // 更新当前时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(formatTimestamp(now.toISOString()));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 监听操作类型变化，自动处理数量
  useEffect(() => {
    if (quantity && selectedSupply) {
      const numQuantity = Number(quantity);
      const supply = supplies.find((s: SupplyItem) => s.id.toString() === selectedSupply);
      if (supply) {
        let warning = "";
        if (operationType === "out") {
          if (numQuantity > supply.current_stock) {
            warning = `❌ 出库数量不能超过当前库存！当前库存: ${supply.current_stock}${supply.unit}，申请数量: ${numQuantity}${supply.unit}`;
          } else if (numQuantity === supply.current_stock) {
            warning = `⚠️ 出库后库存将为0，请注意及时补货`;
          } else if (supply.current_stock - numQuantity <= supply.safety_stock) {
            warning = `⚠️ 出库后库存将低于安全库存(${supply.safety_stock}${supply.unit})，建议及时补货`;
          }
        } else if (operationType === "adjust") {
          const newStock = numQuantity;
          if (newStock < supply.safety_stock) {
            warning = `⚠️ 调整后的库存低于安全库存(${supply.safety_stock}${supply.unit})`;
          }
        }
        setStockWarning(warning);
      }
    } else {
      setStockWarning("");
    }
  }, [operationType, quantity, selectedSupply, supplies]);

  // 快捷数量调整函数
  const adjustQuantity = (adjustment: number) => {
    const currentQty = Number(quantity) || 0;
    const newQty = Math.max(0, currentQty + adjustment);
    setQuantity(newQty.toString());
    setErrors(prev => ({ ...prev, quantity: undefined }));
  };

  // 获取库存变化提示
  const getStockChangeInfo = () => {
    if (!selectedSupplyItem || !quantity) return null;
    
    const currentStock = selectedSupplyItem.current_stock;
    const newStock = operationType === "adjust" ? Number(quantity) : 
                    operationType === "in" ? currentStock + Number(quantity) : 
                    currentStock - Number(quantity);
    
    return {
      current: currentStock,
      new: newStock,
      change: newStock - currentStock,
      unit: selectedSupplyItem.unit
    };
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const supply = supplies.find((s: SupplyItem) => s.id.toString() === selectedSupply);

    if (!selectedSupply) {
      newErrors.supply = "请选择耗材";
    }

    if (!quantity) {
      newErrors.quantity = "请输入数量";
    } else {
      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity <= 0) {
        newErrors.quantity = "请输入有效的数量";
      } else if (operationType === "out" && supply) {
        // 严格检查出库数量不能超过当前库存
        if (numQuantity > supply.current_stock) {
          newErrors.quantity = `❌ 出库数量不能超过当前库存！当前库存: ${supply.current_stock}${supply.unit}`;
        }
      }
    }

    if (operationType === "out" && !remark) {
      newErrors.remark = "出库操作必须填写备注";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // 如果是批量模式，添加到批量列表而不是直接提交
    if (isBatchMode) {
      handleAddToBatch();
      return;
    }

    setIsSubmitting(true);
    try {
      const supply = supplies.find((s: SupplyItem) => s.id.toString() === selectedSupply);
      if (!supply) {
        throw new Error("未找到选中的耗材");
      }

      const numQuantity = Number(quantity);
      
      // 出库时再次严格检查库存（防止并发操作）
      if (operationType === "out" && numQuantity > supply.current_stock) {
        throw new Error(`❌ 出库数量不能超过当前库存！当前库存: ${supply.current_stock}${supply.unit}，申请数量: ${numQuantity}${supply.unit}`);
      }

      // 计算新的库存数量
      let newStock = supply.current_stock;
      switch (operationType) {
        case "in":
          newStock += numQuantity;
          break;
        case "out":
          newStock -= numQuantity;
          break;
        case "adjust":
          newStock = numQuantity;
          break;
      }

      // 更新耗材库存
      await updateSupply({
        ...supply,
        current_stock: newStock,
      });

      // 添加记录
      addRecord({
        type: operationType,
        supply_id: supply.id,
        quantity: numQuantity,
        remark: remark,
      });

      setSuccessMessage(`${getOperationTypeText(operationType)}成功：${supply.name} ${numQuantity}${supply.unit}`);
      setShowSuccessModal(true);

      resetForm();
    } catch (error) {
      console.error("提交失败:", error);
      addToast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交失败，请重试",
        color: "danger",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加到批量列表
  const handleAddToBatch = () => {
    const supply = supplies.find((s: SupplyItem) => s.id.toString() === selectedSupply);
    if (!supply) return;

    const newRecord: BatchRecord = {
      id: Date.now().toString(),
      supplyId: selectedSupply,
      quantity: quantity,
      remarks: remark,
      operationType: operationType,
    };

    // 检查是否已存在相同的耗材记录，如果存在则更新数量
    const existingIndex = batchRecords.findIndex(record => record.supplyId === selectedSupply);
    
    if (existingIndex >= 0) {
      const updatedRecords = [...batchRecords];
      const existingQty = Number(updatedRecords[existingIndex].quantity);
      const newQty = operationType === "adjust" ? Number(quantity) : existingQty + Number(quantity);
      updatedRecords[existingIndex] = {
        ...updatedRecords[existingIndex],
        quantity: newQty.toString(),
        remarks: remark || updatedRecords[existingIndex].remarks,
      };
      setBatchRecords(updatedRecords);
      
      addToast({
        title: "已更新批量记录",
        description: `${supply.name} 的数量已更新为 ${newQty}${supply.unit}`,
        color: "success",
        timeout: 3000,
      });
    } else {
      setBatchRecords([...batchRecords, newRecord]);
      
      addToast({
        title: "已添加到批量列表",
        description: `${supply.name} ${quantity}${supply.unit} 已添加到批量录入列表`,
        color: "success",
        timeout: 3000,
      });
    }

    // 清空当前表单，准备下一个录入
    setSelectedSupply("");
    setQuantity("");
    setRemark("");
    setErrors({});
    setStockWarning("");
  };

  // 批量提交所有记录
  const handleBatchSubmit = async () => {
    if (batchRecords.length === 0) {
      addToast({
        title: "提示",
        description: "批量列表为空，请先添加记录",
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (const record of batchRecords) {
        try {
          const supply = supplies.find((s: SupplyItem) => s.id.toString() === record.supplyId);
          if (!supply) {
            throw new Error(`未找到耗材 ID: ${record.supplyId}`);
          }

          const numQuantity = Number(record.quantity);
          
          // 出库时检查库存
          if (operationType === "out" && numQuantity > supply.current_stock) {
            throw new Error(`${supply.name}: 出库数量 ${numQuantity}${supply.unit} 超过当前库存 ${supply.current_stock}${supply.unit}`);
          }

          // 计算新的库存数量 - 使用记录中保存的操作类型
          let newStock = supply.current_stock;
          switch (record.operationType) {
            case "in":
              newStock += numQuantity;
              break;
            case "out":
              newStock -= numQuantity;
              break;
            case "adjust":
              newStock = numQuantity;
              break;
          }

          // 更新耗材库存
          await updateSupply({
            ...supply,
            current_stock: newStock,
          });

          // 添加记录
          addRecord({
            type: record.operationType,
            supply_id: supply.id,
            quantity: numQuantity,
            remark: record.remarks,
          });

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(error instanceof Error ? error.message : "未知错误");
        }
      }

      if (successCount > 0) {
        addToast({
          title: "批量提交完成",
          description: `成功处理 ${successCount} 条记录${errorCount > 0 ? `，失败 ${errorCount} 条` : ""}`,
          color: successCount === batchRecords.length ? "success" : "warning",
          timeout: 5000,
        });

        // 清空批量列表
        setBatchRecords([]);
        setSuccessMessage(`批量${getOperationTypeText(operationType)}成功：共处理 ${successCount} 条记录`);
        setShowSuccessModal(true);
      }

      if (errorCount > 0 && errors.length > 0) {
        addToast({
          title: "部分记录处理失败",
          description: errors.slice(0, 3).join("; ") + (errors.length > 3 ? "..." : ""),
          color: "danger",
          timeout: 8000,
        });
      }

    } catch (error) {
      console.error("批量提交失败:", error);
      addToast({
        title: "批量提交失败",
        description: error instanceof Error ? error.message : "批量提交失败，请重试",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSupply("");
    setQuantity("");
    setOperationType("in");
    setRemark("");
    setErrors({});
    setStockWarning("");
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleNavigateToList = () => {
    navigate("/supplies/records");
  };

  const handleNavigateToOverview = () => {
    navigate("/supplies/inventory-overview");
  };

  const handleRemoveBatchRecord = (id: string) => {
    setBatchRecords(batchRecords.filter(record => record.id !== id));
  };

  const getOperationTypeColor = (type: "in" | "out" | "adjust") => {
    switch (type) {
      case "in":
        return "success";
      case "out":
        return "danger";
      case "adjust":
        return "warning";
      default:
        return "primary";
    }
  };

  const getOperationTypeText = (type: "in" | "out" | "adjust") => {
    switch (type) {
      case "in":
        return "入库";
      case "out":
        return "出库";
      case "adjust":
        return "修正库存";
      default:
        return "操作";
    }
  };

  const validateNewSupply = (): boolean => {
    const newErrors: NewSupplyErrors = {};

    if (!newSupply.name.trim()) {
      newErrors.name = "请输入耗材名称";
    }

    if (!newSupply.category.trim()) {
      newErrors.category = "请选择类别";
    }

    if (!newSupply.unit.trim()) {
      newErrors.unit = "请输入单位";
    }

    if (!newSupply.currentStock.trim()) {
      newErrors.currentStock = "请输入当前库存";
    } else {
      const stock = Number(newSupply.currentStock);
      if (isNaN(stock) || stock < 0) {
        newErrors.currentStock = "请输入有效的库存数量";
      }
    }

    if (!newSupply.maxStock.trim()) {
      newErrors.maxStock = "请输入最高库存";
    } else {
      const maxStock = Number(newSupply.maxStock);
      if (isNaN(maxStock) || maxStock < 0) {
        newErrors.maxStock = "请输入有效的最高库存数量";
      }
    }

    if (!newSupply.minStock.trim()) {
      newErrors.minStock = "请输入最低库存";
    } else {
      const minStock = Number(newSupply.minStock);
      if (isNaN(minStock) || minStock < 0) {
        newErrors.minStock = "请输入有效的最低库存数量";
      }
    }

    // 验证安全库存
    if (!newSupply.safetyStock.trim()) {
      newErrors.safetyStock = "请输入安全库存";
    } else {
      const safetyStock = Number(newSupply.safetyStock);
      const maxStock = Number(newSupply.maxStock);
      const minStock = Number(newSupply.minStock);
      
      if (isNaN(safetyStock) || safetyStock < 0) {
        newErrors.safetyStock = "请输入有效的安全库存数量";
      } else if (safetyStock !== maxStock) {
        newErrors.safetyStock = "安全库存必须等于最高库存";
      } else if (safetyStock < minStock) {
        newErrors.safetyStock = "安全库存不能低于最低库存";
      }
    }

    if (!newSupply.unitPrice.trim()) {
      newErrors.unitPrice = "请输入单价";
    } else {
      const price = Number(newSupply.unitPrice);
      if (isNaN(price) || price < 0) {
        newErrors.unitPrice = "请输入有效的单价";
      }
    }

    setNewSupplyErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSupply = async () => {
    if (!validateNewSupply()) {
      return;
    }

    setIsCreatingSupply(true);
    try {
      const supplyData = {
        name: newSupply.name.trim(),
        category: newSupply.category,
        unit: newSupply.unit.trim(),
        current_stock: Number(newSupply.currentStock),
        safety_stock: Number(newSupply.safetyStock),
        unit_price: Number(newSupply.unitPrice).toString(),
      };

      await addSupply(supplyData);
      setShowNewSupplyModal(false);
      setNewSupply({
        name: "",
        category: "",
        unit: "",
        currentStock: "",
        safetyStock: "",
        maxStock: "",
        minStock: "",
        unitPrice: "",
      });
      setNewSupplyErrors({});
    } catch (error) {
      console.error("创建耗材失败:", error);
      addToast({
        title: "创建失败",
        description: "创建耗材失败，请重试",
        color: "danger",
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
    } finally {
      setIsCreatingSupply(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      setNewCategoryError("请输入类别名称");
      return;
    }

    if (categories.includes(newCategory.trim())) {
      setNewCategoryError("该类别已存在");
      return;
    }

    // 更新本地类别列表
    setCategories([...categories, newCategory.trim()]);
    
    // 更新新耗材表单中的类别
    setNewSupply(prev => ({ ...prev, category: newCategory.trim() }));
    
    // 重置表单
    setNewCategory("");
    setNewCategoryError("");
    setShowNewCategoryModal(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 页面标题和批量模式切换 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">新增记录</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">批量录入模式</span>
          <Switch
            isSelected={isBatchMode}
            onValueChange={(checked) => {
              setIsBatchMode(checked);
              if (!checked) {
                setBatchRecords([]); // 关闭批量模式时清空列表
              }
            }}
            color="primary"
          />
          <Tooltip content={
            <div className="p-2 max-w-xs">
              <p className="font-semibold mb-2">批量录入模式使用说明：</p>
              <ul className="text-sm space-y-1">
                <li>• 开启后可以连续添加多个记录到批量列表</li>
                <li>• 填写完一个记录后点击"添加到批量列表"</li>
                <li>• 可以继续添加其他耗材记录</li>
                <li>• 最后点击"批量提交"一次性处理所有记录</li>
                <li>• 相同耗材会自动合并数量</li>
              </ul>
            </div>
          }>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="min-w-6 w-6 h-6"
            >
              <InfoIcon className="w-4 h-4 text-gray-400" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 批量模式提示 */}
      {isBatchMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="py-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <InfoIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">批量录入模式已启用</h3>
                <p className="text-sm text-blue-700">
                  您可以连续添加多个记录到批量列表，然后一次性提交所有记录。
                  {batchRecords.length > 0 && ` 当前已添加 ${batchRecords.length} 条记录。`}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 库存变化提示 - Toast样式 */}
      {(() => {
        const stockInfo = getStockChangeInfo();
        if (!stockInfo) return null;
        
        return (
          <div className="fixed top-4 right-4 z-50">
            <Card className="bg-white shadow-lg border-l-4 border-blue-500 max-w-sm">
              <CardBody className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Chip
                      color={stockInfo.change > 0 ? "success" : stockInfo.change < 0 ? "danger" : "warning"}
                      variant="flat"
                      size="sm"
                    >
                      {stockInfo.change > 0 ? "+" : ""}{stockInfo.change} {stockInfo.unit}
                    </Chip>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {getOperationTypeText(operationType)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stockInfo.current} → {stockInfo.new} {stockInfo.unit}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧表单 */}
        <Card className="shadow-lg">
          <CardBody className="space-y-6">
            {/* 耗材选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                耗材名称 <span className="text-danger">*</span>
              </label>
              <div className="flex gap-2">
                <Select
                  placeholder="搜索并选择耗材"
                  selectedKeys={selectedSupply ? new Set([selectedSupply]) : new Set()}
                  onSelectionChange={(keys) => {
                    const newSupply = Array.from(keys)[0] as string;
                    setSelectedSupply(newSupply);
                    setQuantity("");
                    setErrors(prev => ({ ...prev, supply: undefined }));
                  }}
                  className="w-full"
                  isInvalid={!!errors.supply}
                  errorMessage={errors.supply}
                  renderValue={(items) => {
                    return items.map((item) => {
                      const supply = supplies.find(s => s.id.toString() === item.key);
                      return (
                        <div key={item.key} className="flex items-center gap-2">
                          <span>{supply?.name}</span>
                          <Chip size="sm" variant="flat" color="primary">
                            {supply?.category}
                          </Chip>
                        </div>
                      );
                    });
                  }}
                >
                  {supplies.map((supply) => (
                    <SelectItem key={supply.id.toString()} textValue={supply.name}>
                      <div className="flex items-center justify-between">
                        <span>{supply.name}</span>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" variant="flat" color="primary">
                            {supply.category}
                          </Chip>
                          <Badge
                            color={supply.current_stock <= supply.safety_stock ? "danger" : "success"}
                            variant="flat"
                            size="sm"
                          >
                            {supply.current_stock}{supply.unit}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<PlusIcon />}
                  onClick={() => setShowNewSupplyModal(true)}
                >
                  新增
                </Button>
              </div>
              
              {/* 当前库存显示 */}
              {selectedSupplyItem && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">当前库存:</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        color={selectedSupplyItem.current_stock <= selectedSupplyItem.safety_stock ? "danger" : "success"}
                        variant="flat"
                        size="lg"
                      >
                        {selectedSupplyItem.current_stock} {selectedSupplyItem.unit}
                      </Badge>
                      {selectedSupplyItem.current_stock <= selectedSupplyItem.safety_stock && (
                        <Tooltip content={`安全库存: ${selectedSupplyItem.safety_stock}${selectedSupplyItem.unit}`}>
                          <Chip
                            color="danger"
                            variant="flat"
                            size="sm"
                            startContent={<InfoIcon className="text-danger" />}
                          >
                            库存不足
                          </Chip>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 操作类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                操作类型 <span className="text-danger">*</span>
              </label>
              <RadioGroup
                value={operationType}
                onValueChange={(value) => {
                  setOperationType(value as "in" | "out" | "adjust");
                  setQuantity("");
                  setStockWarning("");
                }}
                orientation="horizontal"
                className="gap-4"
              >
                <Radio value="in">
                  <div className="flex items-center gap-2">
                    <PlusIcon className="text-success" />
                    <span>入库</span>
                  </div>
                </Radio>
                <Radio value="out">
                  <div className="flex items-center gap-2">
                    <MinusIcon className="text-danger" />
                    <span>出库</span>
                  </div>
                </Radio>
                <Radio value="adjust">
                  <div className="flex items-center gap-2">
                    <EditIcon className="text-warning" />
                    <span>修正</span>
                  </div>
                </Radio>
              </RadioGroup>
            </div>

            {/* 数量输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数量 <span className="text-danger">*</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="请输入数量"
                    value={quantity}
                    onValueChange={(value) => {
                      setQuantity(value);
                      setErrors(prev => ({ ...prev, quantity: undefined }));
                    }}
                    className="flex-1"
                    isInvalid={!!errors.quantity || !!stockWarning}
                    errorMessage={errors.quantity || stockWarning}
                    onKeyPress={handleKeyPress}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">数量</span>
                      </div>
                    }
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">{selectedSupplyItem?.unit || "单位"}</span>
                      </div>
                    }
                  />
                </div>
                
                {/* 快捷按钮 */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onClick={() => adjustQuantity(1)}
                  >
                    +1
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onClick={() => adjustQuantity(5)}
                  >
                    +5
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onClick={() => adjustQuantity(10)}
                  >
                    +10
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="default"
                    onClick={() => adjustQuantity(-1)}
                  >
                    -1
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="default"
                    onClick={() => adjustQuantity(-5)}
                  >
                    -5
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    onClick={() => setQuantity("")}
                  >
                    清空
                  </Button>
                </div>

                {/* 库存变化预览 */}
                {(() => {
                  const stockInfo = getStockChangeInfo();
                  if (!stockInfo) return null;
                  
                  return (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">库存变化:</span>
                      <Chip
                        color={stockInfo.change > 0 ? "success" : stockInfo.change < 0 ? "danger" : "warning"}
                        variant="flat"
                        size="sm"
                      >
                        {stockInfo.current} → {stockInfo.new} {stockInfo.unit}
                      </Chip>
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 右侧信息 */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardBody className="space-y-6">
              {/* 操作人 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作人
                </label>
                <div className="flex items-center gap-2">
                  <Chip
                    variant="flat"
                    color="primary"
                    startContent={<UserIcon className="text-primary" />}
                    size="lg"
                  >
                    {user?.username || '未知用户'}
                  </Chip>
                </div>
              </div>

              {/* 操作时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作时间
                </label>
                <div className="flex items-center gap-2">
                  <Chip
                    variant="flat"
                    color="default"
                    startContent={<ClockIcon className="text-default-500" />}
                    size="lg"
                  >
                    {currentTime}
                  </Chip>
                </div>
              </div>

              {/* 备注信息 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注说明 {operationType === "out" && <span className="text-danger">*</span>}
                </label>
                <Textarea
                  placeholder="请输入备注信息（用途、原因等）"
                  value={remark}
                  onValueChange={(value) => {
                    setRemark(value);
                    setErrors(prev => ({ ...prev, remark: undefined }));
                  }}
                  className="w-full"
                  minRows={4}
                  isInvalid={!!errors.remark}
                  errorMessage={errors.remark}
                  onKeyPress={handleKeyPress}
                />
              </div>

              {/* 提交按钮 */}
              <div className="pt-4 space-y-3">
                <Button
                  color={getOperationTypeColor(operationType)}
                  size="lg"
                  onClick={handleSubmit}
                  className="w-full"
                  isLoading={isSubmitting && !isBatchMode}
                  spinner={<Spinner color="white" />}
                  isDisabled={!selectedSupply || !quantity || !!stockWarning}
                >
                  {isBatchMode 
                    ? `添加到批量列表 (${batchRecords.length})` 
                    : (isSubmitting ? "提交中..." : `确认${getOperationTypeText(operationType)}`)
                  }
                </Button>
                
                {/* 批量提交按钮 - 仅在批量模式下显示 */}
                {isBatchMode && batchRecords.length > 0 && (
                  <Button
                    color="success"
                    size="lg"
                    onClick={handleBatchSubmit}
                    className="w-full"
                    isLoading={isSubmitting}
                    spinner={<Spinner color="white" />}
                    variant="solid"
                  >
                    {isSubmitting 
                      ? "批量提交中..." 
                      : `批量${getOperationTypeText(operationType)} (${batchRecords.length}条记录)`
                    }
                  </Button>
                )}
                
                {/* 清空批量列表按钮 */}
                {isBatchMode && batchRecords.length > 0 && (
                  <Button
                    color="danger"
                    size="sm"
                    onClick={() => setBatchRecords([])}
                    className="w-full"
                    variant="flat"
                    startContent={<TrashIcon />}
                  >
                    清空批量列表
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* 批量记录列表 */}
          {isBatchMode && batchRecords.length > 0 && (
            <Card className="shadow-lg">
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">批量记录 ({batchRecords.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {batchRecords.map((record) => {
                    const supply = supplies.find(s => s.id.toString() === record.supplyId);
                    return (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{supply?.name}</span>
                            <Chip
                              color={getOperationTypeColor(record.operationType)}
                              variant="flat"
                              size="sm"
                            >
                              {getOperationTypeText(record.operationType)}
                            </Chip>
                          </div>
                          <div className="text-sm text-gray-600">
                            {record.quantity} {supply?.unit}
                            {record.remarks && ` - ${record.remarks}`}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          startContent={<TrashIcon />}
                          onClick={() => handleRemoveBatchRecord(record.id)}
                        >
                          删除
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* 成功提示模态框 */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Chip color="success" variant="flat" startContent={<PlusIcon />}>
                操作成功
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody>
            <p>{successMessage}</p>
            {isBatchMode && (
              <Chip
                color="primary"
                variant="flat"
                size="sm"
                className="mt-2"
                startContent={<InfoIcon />}
              >
                批量录入模式已启用，可以继续录入下一条记录
              </Chip>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="flat"
              startContent={<ListIcon />}
              onClick={handleNavigateToList}
            >
              查看台账列表
            </Button>
            <Button
              color="primary"
              startContent={<HomeIcon />}
              onClick={handleNavigateToOverview}
            >
              返回库存总览
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 新增耗材模态框 */}
      <Modal
        isOpen={showNewSupplyModal}
        onClose={() => setShowNewSupplyModal(false)}
        size="lg"
        scrollBehavior="inside"
        placement="center"
        className="mx-4"
      >
        <ModalContent className="max-h-[90vh]">
          <ModalHeader className="flex flex-col gap-1 pb-2">
            <div className="flex items-center gap-2">
              <Chip color="primary" variant="flat" startContent={<PlusIcon />}>
                新增耗材
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  耗材名称 <span className="text-danger">*</span>
                </label>
                <Input
                  placeholder="请输入耗材名称"
                  value={newSupply.name}
                  onValueChange={(value) => {
                    setNewSupply(prev => ({ ...prev, name: value }));
                    setNewSupplyErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  isInvalid={!!newSupplyErrors.name}
                  errorMessage={newSupplyErrors.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  类别 <span className="text-danger">*</span>
                </label>
                <div className="flex gap-2">
                  <Select
                    placeholder="请选择类别"
                    selectedKeys={newSupply.category ? new Set([newSupply.category]) : new Set()}
                    onSelectionChange={(keys) => {
                      const category = Array.from(keys)[0] as string;
                      setNewSupply(prev => ({ ...prev, category }));
                      setNewSupplyErrors(prev => ({ ...prev, category: undefined }));
                    }}
                    isInvalid={!!newSupplyErrors.category}
                    errorMessage={newSupplyErrors.category}
                    className="w-full"
                  >
                    {categories.map((category) => (
                      <SelectItem key={category}>{category}</SelectItem>
                    ))}
                  </Select>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<PlusIcon />}
                    onClick={() => setShowNewCategoryModal(true)}
                    className="shrink-0"
                  >
                    新增
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    单位 <span className="text-danger">*</span>
                  </label>
                  <Input
                    placeholder="请输入单位（如：个、支、瓶等）"
                    value={newSupply.unit}
                    onValueChange={(value) => {
                      setNewSupply(prev => ({ ...prev, unit: value }));
                      setNewSupplyErrors(prev => ({ ...prev, unit: undefined }));
                    }}
                    isInvalid={!!newSupplyErrors.unit}
                    errorMessage={newSupplyErrors.unit}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    单价 <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="请输入单价"
                    value={newSupply.unitPrice}
                    onValueChange={(value) => {
                      setNewSupply(prev => ({ ...prev, unitPrice: value }));
                      setNewSupplyErrors(prev => ({ ...prev, unitPrice: undefined }));
                    }}
                    isInvalid={!!newSupplyErrors.unitPrice}
                    errorMessage={newSupplyErrors.unitPrice}
                    startContent={<span className="text-default-400">¥</span>}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    当前库存 <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="请输入当前库存数量"
                    value={newSupply.currentStock}
                    onValueChange={(value) => {
                      setNewSupply(prev => ({ ...prev, currentStock: value }));
                      setNewSupplyErrors(prev => ({ ...prev, currentStock: undefined }));
                    }}
                    isInvalid={!!newSupplyErrors.currentStock}
                    errorMessage={newSupplyErrors.currentStock}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最高库存 <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="请输入最高库存数量"
                    value={newSupply.maxStock}
                    onValueChange={(value) => {
                      setNewSupply(prev => ({ 
                        ...prev, 
                        maxStock: value,
                        // 自动设置安全库存等于最高库存
                        safetyStock: value 
                      }));
                      setNewSupplyErrors(prev => ({ 
                        ...prev, 
                        maxStock: undefined,
                        safetyStock: undefined 
                      }));
                    }}
                    isInvalid={!!newSupplyErrors.maxStock}
                    errorMessage={newSupplyErrors.maxStock}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最低库存 <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="请输入最低库存数量"
                    value={newSupply.minStock}
                    onValueChange={(value) => {
                      setNewSupply(prev => ({ ...prev, minStock: value }));
                      setNewSupplyErrors(prev => ({ ...prev, minStock: undefined }));
                    }}
                    isInvalid={!!newSupplyErrors.minStock}
                    errorMessage={newSupplyErrors.minStock}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    安全库存 <span className="text-danger">*</span>
                    <Tooltip content="安全库存将自动等于最高库存">
                      <span className="ml-1 text-gray-400 cursor-help">
                        <InfoIcon className="w-4 h-4 inline" />
                      </span>
                    </Tooltip>
                  </label>
                  <Input
                    type="number"
                    placeholder="安全库存将等于最高库存"
                    value={newSupply.safetyStock}
                    isReadOnly
                    isDisabled
                    description="安全库存自动等于最高库存"
                    isInvalid={!!newSupplyErrors.safetyStock}
                    errorMessage={newSupplyErrors.safetyStock}
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="pt-2">
            <Button
              color="danger"
              variant="flat"
              onClick={() => setShowNewSupplyModal(false)}
            >
              取消
            </Button>
            <Button
              color="primary"
              onClick={handleCreateSupply}
              isLoading={isCreatingSupply}
              spinner={<Spinner color="white" />}
            >
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 新增类别模态框 */}
      <Modal
        isOpen={showNewCategoryModal}
        onClose={() => {
          setShowNewCategoryModal(false);
          setNewCategory("");
          setNewCategoryError("");
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Chip color="primary" variant="flat" startContent={<PlusIcon />}>
                新增类别
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  类别名称 <span className="text-danger">*</span>
                </label>
                <Input
                  placeholder="请输入类别名称"
                  value={newCategory}
                  onValueChange={(value) => {
                    setNewCategory(value);
                    setNewCategoryError("");
                  }}
                  isInvalid={!!newCategoryError}
                  errorMessage={newCategoryError}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => {
                setShowNewCategoryModal(false);
                setNewCategory("");
                setNewCategoryError("");
              }}
            >
              取消
            </Button>
            <Button
              color="primary"
              onClick={handleAddCategory}
            >
              添加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SuppliesAddRecordPage; 