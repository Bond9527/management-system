# 动态申请表系统使用文档

## 🎯 系统概述

动态申请表系统是一个灵活的耗材管理解决方案，允许用户根据不同的业务需求创建和管理各种类型的申请表。系统支持模板化管理，可以快速创建新的申请表实例，并提供完整的管控表和计算表功能。

## 🌟 核心功能

### 1. 申请表模板管理
- **模板类型**：支持耗材管控、需求计算、产能预测、自定义等类型
- **模板配置**：可配置是否包含计算功能
- **模板复用**：一次创建，多次使用
- **版本管理**：支持模板的启用/停用状态

### 2. 申请表实例管理
- **基于模板创建**：选择模板快速创建申请表实例
- **个性化配置**：支持部门、周期等个性化设置
- **状态管理**：草稿、启用、归档等状态流转
- **关联管理**：自动关联管控表和计算表

### 3. 管控表功能
- **完整耗材信息**：序号、物料描述、单位、采购员等
- **价格管理**：单价、MOQ、交期等采购信息
- **库存管理**：安全库存上下限设置
- **计算参数**：每套机用量、使用次数、产能等
- **月度数据**：支持灵活的月度数据配置

### 4. 计算表功能
- **自动计算**：基于统一计算引擎的需求量计算
- **产能预测**：支持多月份产能数据管理
- **需求分析**：月度需求、净需求等分析
- **数据关联**：与管控表数据智能关联

## 🚀 快速开始

### 1. 初始化系统

```bash
# 执行数据库迁移
python manage.py migrate

# 初始化默认模板
python manage.py init_dynamic_templates
```

### 2. 创建申请表模板

1. 访问管理界面或使用API创建模板
2. 设置模板基本信息：
   - 模板名称：如"B482耗材管控申请表模板"
   - 模板代码：如"B482_TEMPLATE"
   - 模板类型：选择合适的类型
   - 是否包含计算功能

### 3. 创建申请表实例

1. 选择已有模板
2. 配置实例信息：
   - 申请表名称
   - 申请表代码
   - 申请部门
   - 申请周期
   - 状态设置

### 4. 管理耗材数据

#### 管控表操作：
- 添加耗材项目
- 设置采购信息
- 配置库存参数
- 启用自动计算

#### 计算表操作：
- 添加计算项目
- 设置计算参数
- 执行批量计算
- 查看需求分析

## 📊 API 接口说明

### 申请表模板 API

```typescript
// 获取所有模板
GET /api/application-templates/

// 获取启用的模板
GET /api/application-templates/active_templates/

// 创建模板
POST /api/application-templates/
{
  "name": "模板名称",
  "code": "TEMPLATE_CODE",
  "template_type": "supply_management",
  "description": "模板描述",
  "has_calculation": true,
  "is_active": true
}
```

### 申请表实例 API

```typescript
// 获取所有申请表
GET /api/application-forms/

// 按部门获取申请表
GET /api/application-forms/by_department/?department=部门名称

// 创建申请表
POST /api/application-forms/
{
  "template": 1,
  "name": "申请表名称",
  "code": "FORM_CODE",
  "department": "部门名称",
  "period": "2025年7月",
  "status": "active"
}

// 创建计算表
POST /api/application-forms/{id}/create_calculation_form/
```

### 动态耗材项目 API

```typescript
// 根据申请表ID获取耗材项目
GET /api/dynamic-supply-items/by_form/?form_id=1

// 批量创建耗材项目
POST /api/dynamic-supply-items/bulk_create/
{
  "form_id": 1,
  "items": [
    {
      "serial_number": 1,
      "material_description": "物料描述",
      "unit": "pcs",
      "purchaser": "采购员",
      "unit_price": 10.50,
      "min_safety_stock": 100,
      "max_safety_stock": 1000,
      "moq": 500,
      "lead_time": 7
    }
  ]
}
```

### 动态计算项目 API

```typescript
// 根据申请表ID获取计算项目
GET /api/dynamic-calculation-items/by_form/?form_id=1

// 批量计算需求量
POST /api/dynamic-calculation-items/calculate_demands/
{
  "form_id": 1
}
```

## 🔧 前端组件使用

### 1. 动态申请表管理器

```tsx
import DynamicApplicationManager from '@/components/DynamicApplicationManager';

<DynamicApplicationManager />
```

### 2. 动态申请表详情

```tsx
import DynamicApplicationDetail from '@/components/DynamicApplicationDetail';

<DynamicApplicationDetail
  applicationForm={selectedForm}
  onBack={handleBackToList}
/>
```

### 3. 申请表管理页面

```tsx
import ApplicationManagementPage from '@/pages/supplies/application-management';

<ApplicationManagementPage />
```

## 🎨 系统特色

### 1. 模板化设计
- **可重复使用**：一次设计，多次使用
- **标准化管理**：统一的模板标准
- **灵活配置**：支持不同业务场景

### 2. 智能计算
- **统一计算引擎**：基于标准化的计算公式
- **自动化处理**：减少手工计算错误
- **实时更新**：参数变更自动重算

### 3. 数据关联
- **管控表与计算表关联**：数据同步更新
- **智能匹配**：基于物料名称自动关联
- **状态追踪**：关联状态可视化管理

### 4. 用户体验
- **直观界面**：清晰的Tab结构设计
- **操作便捷**：批量操作和快捷功能
- **响应式设计**：适配不同屏幕尺寸

## 📈 计算公式

### 基础计算公式
```
月度需求 = 月度产能 × 每套机用量 ÷ 使用次数
净需求 = 月度需求 - 最低库存
需求金额 = 月度需求 × 单价
```

### 库存计算
```
最大库存 = 最大产能 × 每套机用量 ÷ 使用次数
最小库存 = 最小产能 × 每套机用量 ÷ 使用次数
```

## 🛠️ 管理命令

### 初始化模板数据
```bash
python manage.py init_dynamic_templates
```

### 数据库迁移
```bash
python manage.py makemigrations
python manage.py migrate
```

## 🔐 权限管理

### 管理员权限
- 创建和管理申请表模板
- 管理所有申请表实例
- 系统配置和维护

### 用户权限
- 创建申请表实例
- 管理自己创建的申请表
- 查看和编辑授权的申请表

## 📝 最佳实践

### 1. 模板设计
- **命名规范**：使用清晰的命名规则
- **类型分类**：按业务类型合理分类
- **描述完整**：提供详细的模板描述

### 2. 申请表管理
- **周期管理**：按月度或季度创建申请表
- **部门分离**：不同部门使用独立的申请表
- **状态流转**：合理使用草稿、启用、归档状态

### 3. 数据维护
- **定期更新**：及时更新价格和库存信息
- **数据校验**：定期检查数据一致性
- **备份管理**：定期备份重要数据

## 🐛 故障排除

### 常见问题

1. **模板创建失败**
   - 检查模板代码是否重复
   - 确认必填字段是否完整

2. **计算结果异常**
   - 验证计算参数是否正确
   - 检查除数是否为零

3. **数据关联失败**
   - 确认物料名称匹配规则
   - 检查关联项目是否存在

### 日志查看
```bash
# 查看Django日志
tail -f logs/django.log

# 查看API请求日志
tail -f logs/api.log
```

## 🔄 版本更新

### v1.0.0 (当前版本)
- ✅ 基础模板管理功能
- ✅ 申请表实例管理
- ✅ 管控表和计算表功能
- ✅ 统一计算引擎
- ✅ 数据关联功能

### 计划功能
- 🔄 Excel导入导出增强
- 🔄 工作流审批功能
- 🔄 数据分析报表
- 🔄 移动端适配

---

**📞 技术支持**
如有问题或建议，请联系开发团队或提交Issue。 