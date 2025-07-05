import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardBody,
  CardHeader,
  Modal, 
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input, 
  Select,
  SelectItem,
  Tabs,
  Tab,
  Chip,
  Checkbox,
  CheckboxGroup,
  Textarea,
  Spinner
} from '@heroui/react';
// import { addToast } from '@heroui/toast'; // 暂时注释掉，使用console.log替代
import { PlusIcon, PencilIcon, TrashIcon, CalculatorIcon, EyeIcon } from '@heroicons/react/24/outline';
import {
  ApplicationTemplate,
  ApplicationForm,
  applicationTemplateService,
  applicationFormService,
} from '../services/materialManagement';
import { api } from '../services/api';
import DynamicApplicationDetail from './DynamicApplicationDetail';

const DynamicApplicationManager: React.FC = () => {
  // 状态管理
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ApplicationTemplate | null>(null);
  const [currentForm, setCurrentForm] = useState<ApplicationForm | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  
  // 详细页面状态
  const [showDetailPage, setShowDetailPage] = useState(false);
  const [selectedForm, setSelectedForm] = useState<ApplicationForm | null>(null);

  // 表单数据
  const [templateFormData, setTemplateFormData] = useState<Partial<ApplicationTemplate>>({
    is_active: true,
    has_calculation: false,
    template_type: []
  });
  const [applicationFormData, setApplicationFormData] = useState<Partial<ApplicationForm>>({
    status: 'draft'
  });

  // 模版复制相关状态
  const [enableCopyFromTemplate, setEnableCopyFromTemplate] = useState(false);
  const [sourceFormId, setSourceFormId] = useState<number | null>(null);

  // 页面加载时获取数据
  useEffect(() => {
    loadTemplates();
    loadForms();
  }, []);

  // 加载模板数据
  const loadTemplates = async () => {
    setLoading(true);
    try {
      console.log('开始加载模板数据...');
      const data = await applicationTemplateService.getAll();
      console.log('API返回的模板数据:', data);
      // Ensure data is always an array
      setTemplates(Array.isArray(data) ? data : []);
      console.log('设置模板状态完成，数据数量:', Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error('加载模板失败:', error);
      console.error('Toast: 加载模板失败: ' + (error as Error).message);
      // Set templates to empty array on error
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载申请表数据
  const loadForms = async () => {
    setLoading(true);
    try {
      const data = await applicationFormService.getAll();
      // Ensure data is always an array
      setForms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Toast: 加载申请表失败');
      // Set forms to empty array on error
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  // 模板相关操作
  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setTemplateFormData({ is_active: true, has_calculation: false, template_type: [] });
    setTemplateModalVisible(true);
  };

  const handleEditTemplate = (template: ApplicationTemplate) => {
    setCurrentTemplate(template);
    setTemplateFormData(template);
    setTemplateModalVisible(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await applicationTemplateService.delete(id);
      console.log('Toast: 删除模板成功');
      alert('✅ 删除模板成功');
      loadTemplates();
    } catch (error) {
      console.error('删除模板失败:', error);
      
      let errorMessage = '删除模板失败';
      if (error instanceof Error) {
        errorMessage += `：${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        // 尝试从API响应中提取错误信息
        const errorObj = error as any;
        if (errorObj.detail) {
          errorMessage += `：${errorObj.detail}`;
        } else if (errorObj.message) {
          errorMessage += `：${errorObj.message}`;
        } else if (errorObj.error) {
          errorMessage += `：${errorObj.error}`;
        }
      }
      
      // 常见错误提示
      if (errorMessage.includes('404')) {
        errorMessage = '删除失败：模板不存在或已被删除';
      } else if (errorMessage.includes('403')) {
        errorMessage = '删除失败：没有权限删除此模板';
      } else if (errorMessage.includes('400')) {
        errorMessage = '删除失败：模板正在被使用，请先删除相关的申请表';
      } else if (errorMessage.includes('500')) {
        errorMessage = '删除失败：服务器内部错误，请联系管理员';
      }
      
      alert(`❌ ${errorMessage}\n\n如果问题持续存在，请检查：\n1. 模板是否被申请表引用（需要先删除相关申请表）\n2. 网络连接是否正常\n3. 是否有操作权限`);
      console.error('Toast: 删除模板失败');
    }
  };

  const handleTemplateSubmit = async () => {
    try {
      if (currentTemplate) {
        await applicationTemplateService.update(currentTemplate.id, templateFormData);
        console.log('Toast: 更新模板成功');
      } else {
        await applicationTemplateService.create(templateFormData);
        console.log('Toast: 创建模板成功');
      }
      setTemplateModalVisible(false);
      loadTemplates();
    } catch (error) {
      console.error('Toast: ' + (currentTemplate ? '更新模板失败' : '创建模板失败'));
    }
  };

  // 申请表相关操作
  const handleCreateForm = () => {
    setCurrentForm(null);
    setApplicationFormData({ status: 'draft' });
    setEnableCopyFromTemplate(false);
    setSourceFormId(null);
    setFormModalVisible(true);
  };

  const handleEditForm = (form: ApplicationForm) => {
    setCurrentForm(form);
    setApplicationFormData(form);
    setFormModalVisible(true);
  };

  const handleDeleteForm = async (id: number) => {
    try {
      await applicationFormService.delete(id);
      console.log('Toast: 删除申请表成功');
      alert('✅ 删除申请表成功');
      loadForms();
    } catch (error) {
      console.error('删除申请表失败:', error);
      
      let errorMessage = '删除申请表失败';
      if (error instanceof Error) {
        errorMessage += `：${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        // 尝试从API响应中提取错误信息
        const errorObj = error as any;
        if (errorObj.detail) {
          errorMessage += `：${errorObj.detail}`;
        } else if (errorObj.message) {
          errorMessage += `：${errorObj.message}`;
        } else if (errorObj.error) {
          errorMessage += `：${errorObj.error}`;
        }
      }
      
      // 常见错误提示
      if (errorMessage.includes('404')) {
        errorMessage = '删除失败：申请表不存在或已被删除';
      } else if (errorMessage.includes('403')) {
        errorMessage = '删除失败：没有权限删除此申请表';
      } else if (errorMessage.includes('400')) {
        errorMessage = '删除失败：申请表包含关联数据，请先删除相关的计算项目';
      } else if (errorMessage.includes('500')) {
        errorMessage = '删除失败：服务器内部错误，请联系管理员';
      }
      
      alert(`❌ ${errorMessage}\n\n如果问题持续存在，请检查：\n1. 申请表是否包含计算项目（需要先删除）\n2. 网络连接是否正常\n3. 是否有操作权限`);
      console.error('Toast: 删除申请表失败');
    }
  };

  const handleFormSubmit = async () => {
    try {
      let newFormId: number;
      
      if (currentForm) {
        await applicationFormService.update(currentForm.id, applicationFormData);
        console.log('Toast: 更新申请表成功');
        newFormId = currentForm.id;
      } else {
        const newForm = await applicationFormService.create(applicationFormData);
        console.log('Toast: 创建申请表成功');
        newFormId = newForm.id;
        
        // 如果启用了模版复制功能且选择了源申请表，则复制耗材数据
        if (enableCopyFromTemplate && sourceFormId) {
          try {
            await copyMaterialsFromTemplate(newFormId, sourceFormId);
            alert('✅ 申请表创建成功，并已自动复制耗材信息！');
          } catch (error) {
            console.error('复制耗材信息失败:', error);
            alert('⚠️ 申请表创建成功，但复制耗材信息失败。您可以手动添加耗材项目。');
          }
        }
      }
      
      setFormModalVisible(false);
      setEnableCopyFromTemplate(false);
      setSourceFormId(null);
      loadForms();
    } catch (error) {
      console.error('Toast: ' + (currentForm ? '更新申请表失败' : '创建申请表失败'));
    }
  };

  // 复制耗材信息功能
  const copyMaterialsFromTemplate = async (targetFormId: number, sourceFormId: number) => {
    try {
      const result = await api.post('/dynamic-calculation-items/copy_from_template/', {
        target_form_id: targetFormId,
        source_form_id: sourceFormId
      });
      
      console.log('复制结果:', result);
      return result;
    } catch (error) {
      console.error('复制耗材信息失败:', error);
      throw error;
    }
  };

  // 创建计算表
  const handleCreateCalculationForm = async (formId: number) => {
    try {
      await applicationFormService.createCalculationForm(formId);
      console.log('Toast: 创建计算表成功');
      loadForms();
    } catch (error) {
      console.error('Toast: 创建计算表失败');
    }
  };

  // 查看详细数据
  const handleViewForm = (form: ApplicationForm) => {
    setSelectedForm(form);
    setShowDetailPage(true);
  };

  // 返回列表页面
  const handleBackToList = () => {
    setShowDetailPage(false);
    setSelectedForm(null);
    // 重新加载数据以获取最新状态
    loadForms();
  };

  // 模板类型映射
  const getTemplateTypeLabel = (type: string | string[]) => {
    const typeMap = {
      supply_management: '耗材管控申请表',
      demand_calculation: '需求计算表',
      capacity_forecast: '产能预测表',
      custom: '自定义表格',
    };
    
    if (Array.isArray(type)) {
      return type.map(t => typeMap[t as keyof typeof typeMap] || t).join(', ');
    }
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // 如果正在查看详细页面，显示详细组件
  if (showDetailPage && selectedForm) {
    return (
      <DynamicApplicationDetail
        applicationForm={selectedForm}
        onBack={handleBackToList}
        allowReturn={true}
      />
    );
  }

  return (
    <div>
      <Card className="w-full">
        <CardHeader>
          <h1 className="text-xl font-semibold">动态申请表管理系统</h1>
        </CardHeader>
        <CardBody>
          <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
            <Tab key="templates" title="申请表模板">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={handleCreateTemplate}
                  >
                    新建模板
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="border">
                        <CardBody>
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{template.name}</h3>
                                <Chip size="sm" variant="flat">{template.code}</Chip>
                              </div>
                              <p className="text-sm text-gray-600">{getTemplateTypeLabel(template.template_type)}</p>
                              <div className="flex gap-2">
                                <Chip
                                  size="sm"
                                  color={template.is_active ? 'success' : 'danger'}
                                  variant="flat"
                                >
                                  {template.is_active ? '启用' : '停用'}
                                </Chip>
                                <Chip
                                  size="sm"
                                  color={template.has_calculation ? 'primary' : 'default'}
                                  variant="flat"
                                >
                                  {template.has_calculation ? '包含计算' : '仅管控'}
                                </Chip>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                startContent={<PencilIcon className="w-4 h-4" />}
                                onPress={() => handleEditTemplate(template)}
                              >
                                编辑
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                variant="ghost"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => {
                                  if (confirm('确定要删除这个模板吗？')) {
                                    handleDeleteTemplate(template.id);
                                  }
                                }}
                              >
                                删除
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="forms" title="申请表实例">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={handleCreateForm}
                  >
                    新建申请表
                  </Button>
                  <p className="text-sm text-gray-500">
                    💡 提示：创建新申请表时可以从已有申请表复制耗材信息，大大提高录入效率
                  </p>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {forms.map((form) => (
                      <Card key={form.id} className="border">
                        <CardBody>
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{form.name}</h3>
                                <Chip size="sm" variant="flat">{form.code}</Chip>
                              </div>
                              <div className="flex gap-4 text-sm text-gray-600">
                                <span>部门: {form.department}</span>
                                <span>周期: {form.period}</span>
                              </div>
                              <div className="flex gap-2">
                                <Chip
                                  size="sm"
                                  color={form.status === 'active' ? 'success' : form.status === 'draft' ? 'warning' : 'default'}
                                  variant="flat"
                                >
                                  {form.status === 'draft' ? '草稿' : form.status === 'active' ? '启用' : '归档'}
                                </Chip>
                                {form.has_calculation_form && (
                                  <Chip size="sm" color="primary" variant="flat">
                                    包含计算表
                                  </Chip>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                color="primary"
                                variant="ghost"
                                startContent={<EyeIcon className="w-4 h-4" />}
                                onPress={() => handleViewForm(form)}
                              >
                                查看详细
                              </Button>
                              {!form.has_calculation_form && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  startContent={<CalculatorIcon className="w-4 h-4" />}
                                  onPress={() => handleCreateCalculationForm(form.id)}
                                >
                                  创建计算表
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                startContent={<PencilIcon className="w-4 h-4" />}
                                onPress={() => handleEditForm(form)}
                              >
                                编辑
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                variant="ghost"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => {
                                  if (confirm('确定要删除这个申请表吗？')) {
                                    handleDeleteForm(form.id);
                                  }
                                }}
                              >
                                删除
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* 模板创建/编辑模态框 */}
      <Modal isOpen={templateModalVisible} onOpenChange={setTemplateModalVisible} size="2xl" scrollBehavior="inside" placement="center" className="mx-4">
        <ModalContent className="max-h-[90vh]">
          <ModalHeader>
            {currentTemplate ? '编辑模板' : '新建模板'}
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="模板名称"
                  placeholder="请输入模板名称"
                  value={templateFormData.name || ''}
                  onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                  isRequired
                />

                <Input
                  label="模板代码"
                  placeholder="请输入模板代码（如：TEMPLATE_001）"
                  value={templateFormData.code || ''}
                  onChange={(e) => setTemplateFormData({...templateFormData, code: e.target.value})}
                  isRequired
                />
              </div>

              <CheckboxGroup
                label="模板类型 (可多选)"
                description="选择此模板支持的功能类型"
                value={Array.isArray(templateFormData.template_type) ? templateFormData.template_type : (templateFormData.template_type ? [templateFormData.template_type] : [])}
                onValueChange={(values) => {
                  setTemplateFormData({...templateFormData, template_type: values.length > 1 ? values : values[0] || []});
                }}
                isRequired
              >
                <Checkbox value="supply_management">耗材管控申请表</Checkbox>
                <Checkbox value="demand_calculation">需求计算表</Checkbox>
                <Checkbox value="capacity_forecast">产能预测表</Checkbox>
                <Checkbox value="custom">自定义表格</Checkbox>
              </CheckboxGroup>

              <Textarea
                label="模板描述"
                placeholder="请输入模板描述"
                value={templateFormData.description || ''}
                onChange={(e) => setTemplateFormData({...templateFormData, description: e.target.value})}
                minRows={3}
                maxRows={5}
                className="resize-none"
              />

              <div className="flex flex-wrap gap-4">
                <Checkbox
                  isSelected={templateFormData.has_calculation}
                  onValueChange={(checked) => setTemplateFormData({...templateFormData, has_calculation: checked})}
                >
                  包含计算功能
                </Checkbox>
                <Checkbox
                  isSelected={templateFormData.is_active}
                  onValueChange={(checked) => setTemplateFormData({...templateFormData, is_active: checked})}
                >
                  启用模板
                </Checkbox>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => setTemplateModalVisible(false)}>
              取消
            </Button>
            <Button color="primary" onPress={handleTemplateSubmit}>
              {currentTemplate ? '更新' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 申请表创建/编辑模态框 */}
      <Modal isOpen={formModalVisible} onOpenChange={setFormModalVisible} size="2xl" scrollBehavior="inside" placement="center" className="mx-4">
        <ModalContent className="max-h-[90vh]">
          <ModalHeader>
            {currentForm ? '编辑申请表' : '新建申请表'}
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <Select
                label="选择模板"
                placeholder="请选择申请表模板"
                selectedKeys={applicationFormData.template ? [applicationFormData.template.toString()] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setApplicationFormData({...applicationFormData, template: parseInt(key)});
                }}
                isRequired
              >
                {templates
                  .filter(t => t.is_active)
                  .map(template => (
                    <SelectItem 
                      key={template.id.toString()} 
                      textValue={`${template.name} (${template.code})`}
                    >
                      {template.name} ({template.code})
                    </SelectItem>
                  ))}
              </Select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="申请表名称"
                  placeholder="请输入申请表名称"
                  value={applicationFormData.name || ''}
                  onChange={(e) => setApplicationFormData({...applicationFormData, name: e.target.value})}
                  isRequired
                />

                <Input
                  label="申请表代码"
                  placeholder="请输入申请表代码（如：FORM_001）"
                  value={applicationFormData.code || ''}
                  onChange={(e) => setApplicationFormData({...applicationFormData, code: e.target.value})}
                  isRequired
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="申请部门"
                  placeholder="请输入申请部门"
                  value={applicationFormData.department || ''}
                  onChange={(e) => setApplicationFormData({...applicationFormData, department: e.target.value})}
                  isRequired
                />

                <Input
                  label="申请周期"
                  placeholder="请输入申请周期（如：2025年7月）"
                  value={applicationFormData.period || ''}
                  onChange={(e) => setApplicationFormData({...applicationFormData, period: e.target.value})}
                  isRequired
                />
              </div>

              <Select
                label="状态"
                placeholder="请选择状态"
                selectedKeys={applicationFormData.status ? [applicationFormData.status] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setApplicationFormData({...applicationFormData, status: key as any});
                }}
                isRequired
              >
                <SelectItem key="draft" textValue="草稿">草稿</SelectItem>
                <SelectItem key="active" textValue="启用">启用</SelectItem>
                <SelectItem key="archived" textValue="归档">归档</SelectItem>
              </Select>

              {/* 模版复制功能 */}
              {!currentForm && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="text-md font-semibold mb-3 text-blue-600">🚀 智能复制功能</h4>
                    <div className="space-y-2">
                      <Checkbox
                        isSelected={enableCopyFromTemplate}
                        onValueChange={setEnableCopyFromTemplate}
                      >
                        从已有申请表复制耗材信息
                      </Checkbox>
                      <p className="text-sm text-gray-600 ml-6">
                        从已有申请表复制耗材信息，包括料材名称、单价、使用次数等基础信息
                      </p>
                    </div>
                  </div>

                  {enableCopyFromTemplate && (
                    <Select
                      label="选择源申请表"
                      placeholder="请选择要复制耗材信息的申请表"
                      selectedKeys={sourceFormId ? [sourceFormId.toString()] : []}
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0] as string;
                        setSourceFormId(key ? parseInt(key) : null);
                      }}
                      description="系统会复制所选申请表中的所有耗材项目，但不会复制库存数量等变动数据"
                      isRequired
                    >
                      {forms
                        .filter(form => form.status === 'active' || form.status === 'draft')
                        .map(form => (
                          <SelectItem 
                            key={form.id.toString()} 
                            textValue={`${form.name} (${form.period})`}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{form.name}</span>
                              <span className="text-sm text-gray-500">{form.period} - {form.department}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </Select>
                  )}

                  {enableCopyFromTemplate && sourceFormId && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">将会复制以下信息：</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>✅ 耗材名称和分类</li>
                        <li>✅ 单价信息</li>
                        <li>✅ 采购员信息</li>
                        <li>✅ 使用参数（每套用量、使用次数、使用站别）</li>
                        <li>✅ MOQ等采购信息</li>
                        <li>❌ 不会复制库存数量（需要重新填写当前库存）</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => setFormModalVisible(false)}>
              取消
            </Button>
            <Button color="primary" onPress={handleFormSubmit}>
              {currentForm ? '更新' : '创建'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DynamicApplicationManager; 