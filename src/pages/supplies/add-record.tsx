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
import { supplyCategories, SupplyCategory } from "@/config/supplies";
import { useSupplies, SupplyItem } from "@/hooks/useSupplies";

interface NewSupplyForm {
  name: string;
  category: string;
  unit: string;
  currentStock: string;
  safetyStock: string;
}

interface NewSupplyErrors {
  name?: string;
  category?: string;
  unit?: string;
  currentStock?: string;
  safetyStock?: string;
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

const SuppliesAddRecordPage: FC = () => {
  const navigate = useNavigate();
  const { supplies, addSupply, updateSupply } = useSupplies();
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
  
  // New states for supply creation
  const [showNewSupplyModal, setShowNewSupplyModal] = useState(false);
  const [newSupply, setNewSupply] = useState<NewSupplyForm>({
    name: "",
    category: "",
    unit: "",
    currentStock: "",
    safetyStock: "",
  });
  const [newSupplyErrors, setNewSupplyErrors] = useState<NewSupplyErrors>({});
  const [isCreatingSupply, setIsCreatingSupply] = useState(false);
  
  // New states for category management
  const [categories, setCategories] = useState<string[]>([...supplyCategories]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryError, setNewCategoryError] = useState("");

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
      const supply = supplies.find((s: SupplyItem) => s.id.toString() === selectedSupply);
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
  }, [operationType, quantity, selectedSupply, supplies]);

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
      const supply = supplies.find((s: SupplyItem) => s.id.toString() === selectedSupply);
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

      // 更新耗材库存
      await updateSupply({
        ...supply,
        currentStock: newStock
      });

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

  const selectedSupplyItem = supplies.find((s: SupplyItem) => s.id.toString() === selectedSupply);

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

  const validateNewSupply = (): boolean => {
    const errors: NewSupplyErrors = {};
    
    if (!newSupply.name.trim()) {
      errors.name = "请输入耗材名称";
    }
    
    if (!newSupply.category.trim()) {
      errors.category = "请选择耗材类别";
    }
    
    if (!newSupply.unit.trim()) {
      errors.unit = "请输入单位";
    }
    
    const currentStock = Number(newSupply.currentStock);
    if (isNaN(currentStock) || currentStock < 0) {
      errors.currentStock = "请输入有效的当前库存";
    }
    
    const safetyStock = Number(newSupply.safetyStock);
    if (isNaN(safetyStock) || safetyStock < 0) {
      errors.safetyStock = "请输入有效的安全库存";
    }
    
    setNewSupplyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSupply = async () => {
    if (!validateNewSupply()) {
      return;
    }

    setIsCreatingSupply(true);
    try {
      // 创建新的耗材对象
      const newSupplyItem: SupplyItem = {
        id: supplies.length + 1,
        name: newSupply.name.trim(),
        category: newSupply.category.trim(),
        unit: newSupply.unit.trim(),
        currentStock: Number(newSupply.currentStock),
        safetyStock: Number(newSupply.safetyStock),
      };

      // 使用共享的addSupply函数添加新耗材
      await addSupply(newSupplyItem);
      
      // 自动选中新创建的耗材
      setSelectedSupply(newSupplyItem.id.toString());
      
      // 关闭模态框并重置表单
      setShowNewSupplyModal(false);
      setNewSupply({
        name: "",
        category: "",
        unit: "",
        currentStock: "",
        safetyStock: "",
      });
      setNewSupplyErrors({});
      
      // 显示成功提示
      setSuccessMessage(`已成功创建新耗材：${newSupplyItem.name}`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("创建耗材失败:", error);
    } finally {
      setIsCreatingSupply(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      setNewCategoryError("请输入类别名称");
      return;
    }

    if (supplyCategories.includes(newCategory.trim())) {
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
                  <div className="flex gap-2">
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
                            <Chip size="sm" variant="flat" color="primary">
                              {supply.category}
                            </Chip>
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

            {/* 新增耗材模态框 */}
            <Modal
              isOpen={showNewSupplyModal}
              onClose={() => setShowNewSupplyModal(false)}
              size="lg"
            >
              <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Chip color="primary" variant="flat" startContent={<PlusIcon />}>
                      新增耗材
                    </Chip>
                  </div>
                </ModalHeader>
                <ModalBody>
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
                          {supplyCategories.map((category) => (
                            <SelectItem key={category}>{category}</SelectItem>
                          ))}
                        </Select>
                        <Button
                          color="primary"
                          variant="flat"
                          startContent={<PlusIcon />}
                          onClick={() => setShowNewCategoryModal(true)}
                        >
                          新增
                        </Button>
                      </div>
                    </div>
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
                        安全库存 <span className="text-danger">*</span>
                      </label>
                      <Input
                        type="number"
                        placeholder="请输入安全库存数量"
                        value={newSupply.safetyStock}
                        onValueChange={(value) => {
                          setNewSupply(prev => ({ ...prev, safetyStock: value }));
                          setNewSupplyErrors(prev => ({ ...prev, safetyStock: undefined }));
                        }}
                        isInvalid={!!newSupplyErrors.safetyStock}
                        errorMessage={newSupplyErrors.safetyStock}
                      />
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
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
        </CardBody>
      </Card>
    </div>
  );
};

export default SuppliesAddRecordPage; 