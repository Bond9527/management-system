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
  Divider,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Badge,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { PlusIcon, MinusIcon, EditIcon, UserIcon, ClockIcon, InfoIcon, ListIcon, HomeIcon, TrashIcon } from "@/components/icons";
import { useNavigate } from "react-router-dom";

interface SupplyItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  safetyStock: number;
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
}

const mockSupplies: SupplyItem[] = [
  {
    id: 1,
    name: "P1000探针",
    category: "探针",
    unit: "支",
    currentStock: 25,
    safetyStock: 20,
  },
  {
    id: 2,
    name: "P500探针",
    category: "探针",
    unit: "支",
    currentStock: 30,
    safetyStock: 25,
  },
  {
    id: 3,
    name: "P2000探针",
    category: "探针",
    unit: "支",
    currentStock: 15,
    safetyStock: 15,
  },
  {
    id: 4,
    name: "P3000探针",
    category: "探针",
    unit: "支",
    currentStock: 20,
    safetyStock: 15,
  },
  {
    id: 5,
    name: "探针清洁剂",
    category: "清洁剂",
    unit: "瓶",
    currentStock: 18,
    safetyStock: 15,
  },
  {
    id: 6,
    name: "探针专用清洁布",
    category: "清洁剂",
    unit: "包",
    currentStock: 25,
    safetyStock: 20,
  },
  {
    id: 7,
    name: "继电器模块",
    category: "继电器",
    unit: "个",
    currentStock: 20,
    safetyStock: 12,
  },
  {
    id: 8,
    name: "继电器底座",
    category: "继电器",
    unit: "个",
    currentStock: 15,
    safetyStock: 10,
  },
  {
    id: 9,
    name: "探针连接器",
    category: "连接器",
    unit: "个",
    currentStock: 25,
    safetyStock: 18,
  },
  {
    id: 10,
    name: "探针转接头",
    category: "连接器",
    unit: "个",
    currentStock: 20,
    safetyStock: 15,
  },
  {
    id: 11,
    name: "探针支架",
    category: "其他配件",
    unit: "个",
    currentStock: 15,
    safetyStock: 10,
  },
  {
    id: 12,
    name: "探针校准工具",
    category: "其他配件",
    unit: "套",
    currentStock: 8,
    safetyStock: 5,
  },
  {
    id: 13,
    name: "探针测试板",
    category: "其他配件",
    unit: "块",
    currentStock: 12,
    safetyStock: 8,
  },
  {
    id: 14,
    name: "探针保护套",
    category: "其他配件",
    unit: "个",
    currentStock: 30,
    safetyStock: 20,
  },
  {
    id: 15,
    name: "探针收纳盒",
    category: "其他配件",
    unit: "个",
    currentStock: 10,
    safetyStock: 5,
  },
  {
    id: 16,
    name: "探针维修工具",
    category: "其他配件",
    unit: "套",
    currentStock: 5,
    safetyStock: 3,
  },
  {
    id: 17,
    name: "探针说明书",
    category: "其他配件",
    unit: "本",
    currentStock: 50,
    safetyStock: 30,
  },
  {
    id: 18,
    name: "探针标签",
    category: "其他配件",
    unit: "张",
    currentStock: 100,
    safetyStock: 50,
  },
  {
    id: 19,
    name: "探针防静电袋",
    category: "其他配件",
    unit: "个",
    currentStock: 200,
    safetyStock: 100,
  },
  {
    id: 20,
    name: "探针包装盒",
    category: "其他配件",
    unit: "个",
    currentStock: 40,
    safetyStock: 20,
  },
];

const SuppliesAddRecordPage: FC = () => {
  const navigate = useNavigate();
  const [selectedSupply, setSelectedSupply] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [operationType, setOperationType] = useState<"in" | "out" | "adjust">("in");
  const [remark, setRemark] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentUser] = useState<string>("张三"); // 实际应用中从用户上下文获取
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockWarning, setStockWarning] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>([]);

  // 更新当前时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 监听操作类型变化，自动处理数量
  useEffect(() => {
    if (quantity && selectedSupply) {
      const numQuantity = Number(quantity);
      const supply = mockSupplies.find(s => s.id.toString() === selectedSupply);
      if (supply) {
        let warning = "";
        if (operationType === "out" && numQuantity > supply.currentStock) {
          warning = `出库数量不能大于当前库存(${supply.currentStock}${supply.unit})`;
        } else if (operationType === "adjust") {
          const newStock = numQuantity;
          if (newStock < supply.safetyStock) {
            warning = `调整后的库存低于安全库存(${supply.safetyStock}${supply.unit})`;
          }
        }
        setStockWarning(warning);
      }
    } else {
      setStockWarning("");
    }
  }, [operationType, quantity, selectedSupply]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const supply = mockSupplies.find(s => s.id.toString() === selectedSupply);

    if (!selectedSupply) {
      newErrors.supply = "请选择耗材";
    }

    if (!quantity) {
      newErrors.quantity = "请输入数量";
    } else {
      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity <= 0) {
        newErrors.quantity = "请输入有效的数量";
      } else if (operationType === "out" && supply && numQuantity > supply.currentStock) {
        newErrors.quantity = `出库数量不能大于当前库存(${supply.currentStock}${supply.unit})`;
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

    setIsSubmitting(true);
    try {
      const supply = mockSupplies.find(s => s.id.toString() === selectedSupply);
      if (!supply) {
        throw new Error("未找到选中的耗材");
      }

      // 计算新的库存数量
      let newStock = supply.currentStock;
      switch (operationType) {
        case "in":
          newStock += Number(quantity);
          break;
        case "out":
          newStock -= Number(quantity);
          break;
        case "adjust":
          newStock = Number(quantity);
          break;
      }

      // TODO: 调用API更新库存和记录
      const record = {
        supplyId: selectedSupply,
        supplyName: supply.name,
        quantity: Number(quantity),
        operationType,
        newStock,
        remark,
        operator: currentUser,
        operationTime: currentTime,
      };

      console.log("提交记录:", record);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 设置成功消息
      setSuccessMessage(`已成功${operationType === "in" ? "入库" : operationType === "out" ? "出库" : "修正"} ${quantity}${supply.unit} ${supply.name}`);
      
      // 显示成功提示
      setShowSuccessModal(true);

      // 如果不是批量模式，重置表单
      if (!isBatchMode) {
        resetForm();
      } else {
        // 批量模式下只清空数量和备注
        setQuantity("");
        setRemark("");
      }
    } catch (error) {
      console.error("提交失败:", error);
      // TODO: 显示错误提示
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSupply("");
    setQuantity("");
    setRemark("");
    setErrors({});
    setStockWarning("");
  };

  const handleSuccess = () => {
    if (!isBatchMode) {
      resetForm();
    }
    setShowSuccessModal(false);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNavigateToList = () => {
    handleSuccess();
    navigate("/supplies/records");
  };

  const handleNavigateToOverview = () => {
    handleSuccess();
    navigate("/supplies/inventory");
  };

  const selectedSupplyItem = mockSupplies.find(s => s.id.toString() === selectedSupply);

  const handleAddBatchRecord = () => {
    if (!selectedSupply || !quantity) return;

    const newRecord: BatchRecord = {
      id: Date.now().toString(),
      supplyId: selectedSupply,
      quantity,
      remarks: remark,
    };

    setBatchRecords([...batchRecords, newRecord]);
    setSelectedSupply("");
    setQuantity("");
    setRemark("");
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
    }
  };

  const getOperationTypeText = (type: "in" | "out" | "adjust") => {
    switch (type) {
      case "in":
        return "入库";
      case "out":
        return "出库";
      case "adjust":
        return "调整";
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">新增记录</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">批量录入模式</span>
          <Switch
            isSelected={isBatchMode}
            onValueChange={setIsBatchMode}
            color="primary"
          />
        </div>
      </div>

      <Card className="shadow-lg">
        <CardBody>
          <div className="space-y-8">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 左侧：耗材选择和操作类型 */}
              <div className="space-y-8">
                {/* 耗材选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    耗材名称 <span className="text-danger">*</span>
                  </label>
                  <Select
                    placeholder="请选择耗材"
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
                        const supply = mockSupplies.find(s => s.id.toString() === item.key);
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
                    {mockSupplies.map((supply) => (
                      <SelectItem key={supply.id.toString()} textValue={supply.name}>
                        <div className="flex items-center justify-between">
                          <span>{supply.name}</span>
                          <Chip size="sm" variant="flat" color="primary">
                            {supply.category}
                          </Chip>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                  {selectedSupplyItem && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">当前库存: </span>
                      <Badge
                        color={selectedSupplyItem.currentStock <= selectedSupplyItem.safetyStock ? "danger" : "success"}
                        variant="flat"
                        className="ml-1"
                      >
                        {selectedSupplyItem.currentStock} {selectedSupplyItem.unit}
                      </Badge>
                      {selectedSupplyItem.currentStock <= selectedSupplyItem.safetyStock && (
                        <Tooltip content={`安全库存: ${selectedSupplyItem.safetyStock}${selectedSupplyItem.unit}`}>
                          <Chip
                            color="danger"
                            variant="flat"
                            size="sm"
                            className="ml-2"
                            startContent={<InfoIcon className="text-danger" />}
                          >
                            库存不足
                          </Chip>
                        </Tooltip>
                      )}
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
                        <span>修正库存</span>
                      </div>
                    </Radio>
                  </RadioGroup>
                </div>
              </div>

              {/* 右侧：数量和单位 */}
              <div className="space-y-8">
                {/* 数量输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    数量 <span className="text-danger">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="请输入数量"
                      value={quantity}
                      onValueChange={(value) => {
                        setQuantity(value);
                        setErrors(prev => ({ ...prev, quantity: undefined }));
                      }}
                      className="w-48"
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
                  {selectedSupplyItem && quantity && (
                    <div className="mt-2">
                      <Chip
                        color="primary"
                        variant="flat"
                        size="sm"
                        className="mt-1"
                      >
                        {operationType === "in" && (
                          <span>入库后库存: {selectedSupplyItem.currentStock + Number(quantity)} {selectedSupplyItem.unit}</span>
                        )}
                        {operationType === "out" && (
                          <span>出库后库存: {selectedSupplyItem.currentStock - Number(quantity)} {selectedSupplyItem.unit}</span>
                        )}
                        {operationType === "adjust" && (
                          <span>调整后库存: {quantity} {selectedSupplyItem.unit}</span>
                        )}
                      </Chip>
                    </div>
                  )}
                </div>

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
                    >
                      {currentUser}
                    </Chip>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* 备注信息 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注 {operationType === "out" && <span className="text-danger">*</span>}
              </label>
              <Textarea
                placeholder="请输入备注信息"
                value={remark}
                onValueChange={(value) => {
                  setRemark(value);
                  setErrors(prev => ({ ...prev, remark: undefined }));
                }}
                className="w-full"
                minRows={3}
                isInvalid={!!errors.remark}
                errorMessage={errors.remark}
                onKeyPress={handleKeyPress}
              />
            </div>

            {/* 操作时间 */}
            <div className="flex items-center gap-2">
              <Chip
                variant="flat"
                color="default"
                startContent={<ClockIcon className="text-default-500" />}
              >
                {currentTime}
              </Chip>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end">
              <Button
                color={getOperationTypeColor(operationType)}
                size="lg"
                onClick={isBatchMode ? handleSubmit : handleSubmit}
                className="min-w-[120px]"
                isLoading={isSubmitting}
                spinner={<Spinner color="white" />}
              >
                {isBatchMode ? "提交批量记录" : `确认${getOperationTypeText(operationType)}`}
              </Button>
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
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SuppliesAddRecordPage; 