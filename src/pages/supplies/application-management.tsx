import React, { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";

import { PlusIcon } from "@/components/icons";
import DynamicApplicationManager from "@/components/DynamicApplicationManager";
import DynamicApplicationDetail from "@/components/DynamicApplicationDetail";
// import ImportSuppliesButton from "@/components/ImportSuppliesButton";
import {
  ApplicationForm,
  applicationFormService,
  applicationTemplateService,
  ApplicationTemplate,
} from "@/services/materialManagement";

const ApplicationManagementPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<"list" | "detail">("list");
  const [selectedForm, setSelectedForm] = useState<ApplicationForm | null>(
    null,
  );

  // 快速创建相关状态
  const [quickCreateModalVisible, setQuickCreateModalVisible] = useState(false);
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [quickCreateData, setQuickCreateData] = useState({
    department: "",
    period: "",
    template_id: "",
    purpose: "supply_management" as
      | "supply_management"
      | "demand_calculation"
      | "capacity_forecast",
  });

  const handleViewForm = (form: ApplicationForm) => {
    setSelectedForm(form);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedForm(null);
  };

  // 快速创建申请表
  const handleQuickCreate = async () => {
    try {
      // 加载可用模板
      const availableTemplates =
        await applicationTemplateService.getActiveTemplates();

      setTemplates(availableTemplates);

      // 生成默认值
      const currentMonth = new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "long",
      });

      setQuickCreateData({
        department: "",
        period: currentMonth,
        template_id: "",
        purpose: "supply_management",
      });

      console.log("加载到的模板数量:", availableTemplates.length);
      setQuickCreateModalVisible(true);
    } catch (error: any) {
      console.error("加载模板失败:", error);

      // 如果是认证错误，直接跳转登录
      if (error.message === "AUTHENTICATION_EXPIRED") {
        alert("登录已过期，请重新登录");
        window.location.href = "/login";

        return;
      }

      // 如果没有模板，询问是否创建默认模板
      if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        const createDefault = confirm("系统中暂无可用模板，是否创建默认模板？");

        if (createDefault) {
          await createDefaultTemplates();
          // 重新尝试加载模板
          handleQuickCreate();
        }

        return;
      }

      alert("加载模板失败，请稍后重试");
    }
  };

  // 创建默认模板
  const createDefaultTemplates = async () => {
    try {
      const defaultTemplates = [
        {
          name: "标准耗材管控申请表",
          code: "STD_SUPPLY_001",
          template_type: ["supply_management"],
          description: "用于日常耗材管控的标准申请表模板",
          has_calculation: false,
          is_active: true,
        },
        {
          name: "耗材需求计算表",
          code: "STD_CALC_001",
          template_type: ["demand_calculation"],
          description: "用于计算耗材需求量的标准模板",
          has_calculation: true,
          is_active: true,
        },
        {
          name: "综合管理申请表",
          code: "STD_COMP_001",
          template_type: ["supply_management", "demand_calculation"],
          description: "包含管控和计算功能的综合模板",
          has_calculation: true,
          is_active: true,
        },
      ];

      for (const template of defaultTemplates) {
        await applicationTemplateService.create(template);
      }

      alert("默认模板创建成功！");
    } catch (error) {
      console.error("创建默认模板失败:", error);
      alert("创建默认模板失败，请联系管理员");
    }
  };

  // 提交快速创建
  const handleQuickCreateSubmit = async () => {
    if (!quickCreateData.department || !quickCreateData.period) {
      alert("请填写部门和周期信息");

      return;
    }

    setQuickCreateLoading(true);
    try {
      // 选择或创建模板
      let templateId = quickCreateData.template_id;

      if (!templateId) {
        // 如果没有选择模板，根据用途选择默认模板
        const suitableTemplate = templates.find((t) => {
          if (Array.isArray(t.template_type)) {
            return t.template_type.includes(quickCreateData.purpose);
          }

          return t.template_type === quickCreateData.purpose;
        });

        if (suitableTemplate) {
          templateId = suitableTemplate.id.toString();
        } else {
          alert("找不到合适的模板，请手动选择");

          return;
        }
      }

      // 生成申请表名称和代码
      const formName = `${quickCreateData.department}_${quickCreateData.period}_${getPurposeLabel(quickCreateData.purpose)}申请表`;
      const formCode = `${quickCreateData.department.toUpperCase()}_${Date.now().toString().slice(-6)}`;

      console.log("准备创建申请表，数据:", {
        template: parseInt(templateId),
        name: formName,
        code: formCode,
        department: quickCreateData.department,
        period: quickCreateData.period,
        status: "active",
      });

      // 创建申请表
      const newForm = await applicationFormService.create({
        template: parseInt(templateId),
        name: formName,
        code: formCode,
        department: quickCreateData.department,
        period: quickCreateData.period,
        status: "active",
      });

      // 创建成功后直接跳转到详情页面
      setSelectedForm(newForm);
      setCurrentView("detail");
      setQuickCreateModalVisible(false);

      console.log("快速创建申请表成功:", newForm);
      alert("申请表创建成功！");
    } catch (error: any) {
      console.error("创建申请表失败:", error);

      // 显示详细的错误信息
      let errorMessage = "创建申请表失败";

      if (error.message) {
        errorMessage += `：${error.message}`;
      }

      // 检查是否是认证错误
      if (error.message === "AUTHENTICATION_EXPIRED") {
        errorMessage = "登录已过期，请重新登录";
        // 可以在这里添加跳转到登录页面的逻辑
        window.location.href = "/login";

        return;
      }

      alert(errorMessage);
    } finally {
      setQuickCreateLoading(false);
    }
  };

  // 获取用途标签
  const getPurposeLabel = (purpose: string) => {
    const labels = {
      supply_management: "耗材管控",
      demand_calculation: "需求计算",
      capacity_forecast: "产能预测",
    };

    return labels[purpose as keyof typeof labels] || purpose;
  };

  // 获取用途对应的模板
  const getTemplatesByPurpose = (purpose: string) => {
    return templates.filter((t) => {
      if (Array.isArray(t.template_type)) {
        return t.template_type.includes(purpose);
      }

      return t.template_type === purpose;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">动态申请表管理</h1>
        {currentView === "list" && (
          <div className="flex gap-2">
            <Button
              color="primary"
              startContent={<PlusIcon />}
              onPress={handleQuickCreate}
            >
              快速创建申请表
            </Button>
            {/* <ImportSuppliesButton
              onImportSuccess={() => {
                // 导入成功后刷新页面数据
                console.log("导入成功，准备刷新页面...");
                setTimeout(() => {
                  console.log("执行页面刷新...");
                  window.location.reload();
                }, 2000); // 增加延迟，确保后端同步完成
              }}
            /> */}
          </div>
        )}
      </div>

      {/* 主要内容区域 - 统一布局 */}
      <div className="grid grid-cols-1 gap-6">
        {/* 功能说明卡片 */}
        {currentView === "list" && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
            <CardBody>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💡</span>
                  </div>
                </div>
                <div className="w-full">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    动态申请表系统功能
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">
                        📋 申请表模板管理
                      </h4>
                      <ul className="space-y-1 pl-4">
                        <li>• 创建可重复使用的申请表模板</li>
                        <li>• 支持耗材管控、需求计算、产能预测等类型</li>
                        <li>• 灵活配置是否包含计算功能</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">
                        📊 申请表实例管理
                      </h4>
                      <ul className="space-y-1 pl-4">
                        <li>• 基于模板创建具体的申请表实例</li>
                        <li>• 支持部门、周期等个性化配置</li>
                        <li>• 自动关联管控表和计算表</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">
                        🔧 管控表功能
                      </h4>
                      <ul className="space-y-1 pl-4">
                        <li>• 完整的耗材信息管理</li>
                        <li>• 支持安全库存、MOQ、交期等参数</li>
                        <li>• 灵活的月度数据配置</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">
                        🧮 计算表功能
                      </h4>
                      <ul className="space-y-1 pl-4">
                        <li>• 自动计算月度需求量</li>
                        <li>• 支持产能预测和需求分析</li>
                        <li>• 与管控表数据智能关联</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 管控耗材表 - 与上面的卡片对齐 */}
        <div className="w-full">
          {currentView === "list" ? (
            <DynamicApplicationManager />
          ) : (
            selectedForm && (
              <DynamicApplicationDetail
                applicationForm={selectedForm}
                onBack={handleBackToList}
              />
            )
          )}
        </div>
      </div>

      {/* 底部统计信息 */}
      {currentView === "list" && (
        <Card className="bg-gray-50">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">∞</div>
                <div className="text-sm text-gray-600">无限制申请表</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">🔄</div>
                <div className="text-sm text-gray-600">自动计算功能</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">📊</div>
                <div className="text-sm text-gray-600">数据分析支持</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">📤</div>
                <div className="text-sm text-gray-600">Excel导出功能</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 快速创建模态框 */}
      <Modal
        isOpen={quickCreateModalVisible}
        placement="center"
        size="lg"
        onOpenChange={setQuickCreateModalVisible}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs">⚡</span>
              </div>
              <span>快速创建申请表</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  💡 快速创建优势
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 自动生成申请表名称和代码</li>
                  <li>• 智能选择合适的模板</li>
                  <li>• 预设当前月份作为申请周期</li>
                  <li>• 创建完成后直接进入详情页面</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Input
                  isRequired
                  label="申请部门"
                  placeholder="请输入部门名称（如：TE课、研发部）"
                  value={quickCreateData.department}
                  onChange={(e) =>
                    setQuickCreateData({
                      ...quickCreateData,
                      department: e.target.value,
                    })
                  }
                />

                <Input
                  isRequired
                  label="申请周期"
                  placeholder="请输入申请周期"
                  value={quickCreateData.period}
                  onChange={(e) =>
                    setQuickCreateData({
                      ...quickCreateData,
                      period: e.target.value,
                    })
                  }
                />

                <Select
                  isRequired
                  label="申请用途"
                  placeholder="选择申请表主要用途"
                  selectedKeys={[quickCreateData.purpose]}
                  onSelectionChange={(keys) => {
                    const purpose = Array.from(keys)[0] as string;

                    setQuickCreateData({
                      ...quickCreateData,
                      purpose: purpose as any,
                    });
                  }}
                >
                  <SelectItem key="supply_management">
                    耗材管控申请表
                  </SelectItem>
                  <SelectItem key="demand_calculation">需求计算表</SelectItem>
                  <SelectItem key="capacity_forecast">产能预测表</SelectItem>
                </Select>

                {/* 显示推荐模板 */}
                {quickCreateData.purpose && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 text-sm font-medium">
                        推荐模板
                      </span>
                      <Chip color="success" size="sm" variant="flat">
                        {getTemplatesByPurpose(quickCreateData.purpose).length}{" "}
                        个可用
                      </Chip>
                    </div>
                    <div className="text-xs text-green-700">
                      系统将自动选择最适合的模板，您也可以创建后手动调整
                    </div>
                  </div>
                )}

                <Select
                  label="指定模板（可选）"
                  placeholder="不选择将自动选择最适合的模板"
                  selectedKeys={
                    quickCreateData.template_id
                      ? [quickCreateData.template_id]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const templateId = Array.from(keys)[0] as string;

                    setQuickCreateData({
                      ...quickCreateData,
                      template_id: templateId,
                    });
                  }}
                >
                  {getTemplatesByPurpose(quickCreateData.purpose).map(
                    (template) => (
                      <SelectItem
                        key={template.id.toString()}
                        textValue={template.name}
                      >
                        <div className="flex items-center justify-between">
                          <span>{template.name}</span>
                          <Chip color="primary" size="sm" variant="flat">
                            {template.code}
                          </Chip>
                        </div>
                      </SelectItem>
                    ),
                  )}
                </Select>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <strong>预览：</strong>
                  {quickCreateData.department && quickCreateData.period && (
                    <span className="ml-2">
                      将创建名为 "{quickCreateData.department}_
                      {quickCreateData.period}_
                      {getPurposeLabel(quickCreateData.purpose)}申请表" 的申请表
                    </span>
                  )}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setQuickCreateModalVisible(false)}
            >
              取消
            </Button>
            <Button
              color="primary"
              isLoading={quickCreateLoading}
              onPress={handleQuickCreateSubmit}
            >
              {quickCreateLoading ? "创建中..." : "快速创建"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ApplicationManagementPage;
