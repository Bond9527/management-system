import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardBody, Input, Button, Select, SelectItem, Checkbox, Spinner, Alert } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { useMenu } from "@/context/MenuContext";
import { api } from "@/services/api";

interface MenuItem {
  label: string;
  href?: string;
  icon?: any;
  children?: MenuItem[];
}

interface JobTitle {
  id: number;
  name: string;
  level: string;
  description: string;
  is_active: boolean;
}

// 将API菜单数据转换为权限树格式
const convertApiMenuToPermissionTree = (apiMenus: any[]): MenuItem[] => {
  const menuMap = new Map();
  const rootMenus: MenuItem[] = [];

  // 首先创建所有菜单项
  apiMenus.forEach(menu => {
    menuMap.set(menu.id, {
      label: menu.name,
      href: menu.path,
      children: [],
    });
  });

  // 建立父子关系
  apiMenus.forEach(menu => {
    const menuItem = menuMap.get(menu.id);
    if (menu.parent) {
      const parent = menuMap.get(menu.parent);
      if (parent) {
        parent.children.push(menuItem);
      }
    } else {
      rootMenus.push(menuItem);
    }
  });

  // 按order排序
  const sortMenus = (menus: MenuItem[]) => {
    menus.sort((a, b) => {
      const aMenu = apiMenus.find(m => m.name === a.label);
      const bMenu = apiMenus.find(m => m.name === b.label);
      return (aMenu?.order || 0) - (bMenu?.order || 0);
    });
    menus.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        sortMenus(menu.children);
      }
    });
  };
  sortMenus(rootMenus);

  return rootMenus;
};

const mockRoles = [
  { id: 1, en: "admin", cn: "管理员" },
  { id: 2, en: "hr", cn: "人事专员" },
  { id: 3, en: "manager", cn: "经理" },
];

// 递归渲染权限树，增加可折叠功能
function PermissionTree({ nodes, checkedKeys, onCheck, parentKey = null, depth = 0, disabled = false }: {
  nodes: MenuItem[];
  checkedKeys: string[];
  onCheck: (node: MenuItem, checked: boolean, parentKey: string | null) => void;
  parentKey?: string | null;
  depth?: number;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const toggle = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div>
      {nodes.map((node) => {
        const checked = checkedKeys.includes(node.label);
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded[node.label] ?? true;
        return (
          <div key={node.label} className="my-1" style={{ marginLeft: depth * 50 }}>
            <div className="flex items-center">
              {hasChildren && (
                <button
                  onClick={() => toggle(node.label)}
                  className="mr-1 focus:outline-none"
                  style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-label={isExpanded ? "收起" : "展开"}
                  disabled={disabled}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                  >
                    <polygon points="3,2 10,6 3,10" fill={disabled ? "#ccc" : "#888"} />
                  </svg>
                </button>
              )}
              <Checkbox
                isSelected={checked}
                onValueChange={() => !disabled && onCheck(node, !checked, parentKey || null)}
                isDisabled={disabled}
              >
                {node.label}
              </Checkbox>
            </div>
            {hasChildren && isExpanded && (
              <PermissionTree
                nodes={node.children!}
                checkedKeys={checkedKeys}
                onCheck={onCheck}
                parentKey={node.label}
                depth={depth + 1}
                disabled={disabled}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PermissionTab() {
  const [roleEn, setRoleEn] = useState("");
  const [roleCn, setRoleCn] = useState("");
  const [roles, setRoles] = useState(mockRoles);
  
  // 职称数据状态
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("");
  const [jobTitlesLoading, setJobTitlesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Alert状态管理
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
    title: string;
    description: string;
  }>({
    type: "primary",
    title: "",
    description: ""
  });
  
  // 使用ref跟踪是否已经初始化
  const isInitialized = useRef(false);
  const lastSelectedJobTitle = useRef<string>("");
  
  // 获取动态菜单数据
  const { sidebarMenus, loading, error } = useMenu();
  const menuItems = useMemo(() => convertApiMenuToPermissionTree(sidebarMenus || []), [sidebarMenus]);
  
  // 使用useCallback优化getAllLabels函数
  const getAllLabels = useCallback((nodes: MenuItem[]): string[] => 
    nodes.flatMap(n => [n.label, ...(n.children ? getAllLabels(n.children) : [])]), []);
  
  // 使用useMemo计算所有标签
  const allLabels = useMemo(() => getAllLabels(menuItems), [menuItems, getAllLabels]);
  
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  // 显示Alert的辅助函数
  const showAlertMessage = (type: typeof alertConfig.type, title: string, description: string, duration = 5000) => {
    setAlertConfig({ type, title, description });
    setShowAlert(true);
    if (duration > 0) {
      setTimeout(() => setShowAlert(false), duration);
    }
  };

  // 获取职称列表
  const fetchJobTitles = async () => {
    setJobTitlesLoading(true);
    
    try {
      const response = await api.get('/job-titles/');
      
      // 现在API直接返回数组，不再是分页响应
      const jobTitleData = Array.isArray(response) ? response : 
                          response?.results || [];
      
      setJobTitles(jobTitleData);
      
      // 只在成功时显示一个简洁的Toast
      addToast({
        title: "职称数据加载完成",
        description: `共获取到 ${jobTitleData.length} 个职称`,
        color: "success",
        timeout: 2500,
        shouldShowTimeoutProgress: true,
      });
      
    } catch (error) {
      console.error('获取职称列表失败:', error);
      
      // 只显示错误Toast，不显示Alert
      addToast({
        title: "加载职称数据失败",
        description: "请检查网络连接后重试",
        color: "danger",
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
    } finally {
      setJobTitlesLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchJobTitles();
  }, []);

  // 统一处理权限初始化和职称切换
  useEffect(() => {
    if (allLabels.length > 0) {
      // 首次初始化或职称改变时重置权限
      if (!isInitialized.current || lastSelectedJobTitle.current !== selectedJobTitle) {
        setCheckedKeys(allLabels);
        isInitialized.current = true;
        lastSelectedJobTitle.current = selectedJobTitle;
      }
    }
  }, [allLabels, selectedJobTitle]);

  // 添加角色
  const handleAddRole = () => {
    if (!roleEn.trim() || !roleCn.trim()) {
      addToast({
        title: "请完善角色信息",
        description: "请填写完整的角色英文名和中文名",
        color: "warning",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }

    // 检查是否已存在相同的角色
    const existingRole = roles.find(role => 
      role.en.toLowerCase() === roleEn.toLowerCase() || 
      role.cn === roleCn
    );

    if (existingRole) {
      addToast({
        title: "角色名称重复",
        description: "该角色名称已存在，请使用不同的名称",
        color: "danger",
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }

    // 添加角色
    setRoles([...roles, { id: Date.now(), en: roleEn, cn: roleCn }]);
    
    // 只显示一个成功消息，包含完整信息
    addToast({
      title: "角色添加成功",
      description: `"${roleCn}"(${roleEn}) 已成功添加到角色列表`,
      color: "success",
      timeout: 3500,
      shouldShowTimeoutProgress: true,
    });

    setRoleEn("");
    setRoleCn("");
  };

  // 权限树勾选逻辑（父子联动）
  const handleCheck = (node: MenuItem, checked: boolean, parentKey: string | null) => {
    let newChecked = [...checkedKeys];
    const getAll = (n: MenuItem): string[] => [n.label, ...(n.children ? n.children.flatMap(getAll) : [])];
    const findNode = (label: string, nodes: MenuItem[]): MenuItem | null => {
      for (const n of nodes) {
        if (n.label === label) return n;
        if (n.children) {
          const found = findNode(label, n.children);
          if (found) return found;
        }
      }
      return null;
    };
    if (checked) {
      newChecked = Array.from(new Set([...newChecked, ...getAll(node)]));
      if (parentKey) {
        const parent = findNode(parentKey, menuItems);
        if (parent && parent.children && parent.children.every(child => newChecked.includes(child.label))) {
          newChecked = Array.from(new Set([...newChecked, parentKey]));
        }
      }
    } else {
      const removeKeys = getAll(node);
      newChecked = newChecked.filter(k => !removeKeys.includes(k));
      if (parentKey) {
        newChecked = newChecked.filter(k => k !== parentKey);
      }
    }
    setCheckedKeys(newChecked);
  };

  const handleCancel = () => {
    if (!selectedJobTitle) {
      addToast({
        title: "请先选择职称",
        description: "选择职称后才能重置权限设置",
        color: "warning",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }
    
    const selectedJobTitleName = jobTitles.find(jt => jt.id.toString() === selectedJobTitle)?.name || "未选择";
    const permissionCount = allLabels.length;
    
    // 重置所有选项为选中状态
    setCheckedKeys(allLabels);
    
    // 只显示重置成功的Toast
    addToast({
      title: "权限已重置",
      description: `"${selectedJobTitleName}" 的权限已重置，共 ${permissionCount} 个权限全部选中`,
      color: "secondary",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      ),
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    });
  };
  
  const handleSave = async () => {
    if (!selectedJobTitle) {
      addToast({
        title: "请先选择职称",
        description: "选择职称后才能保存权限配置",
        color: "warning",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }
    
    const selectedJobTitleName = jobTitles.find(jt => jt.id.toString() === selectedJobTitle)?.name || "";
    const permissionCount = checkedKeys.length;
    
    // 显示保存中的状态
    showAlertMessage("primary", "正在保存", `正在为"${selectedJobTitleName}"保存权限配置...`, 0);
    setSaving(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: 这里应该调用实际的API保存权限设置
      // await api.post('/permissions/', {
      //   job_title_id: selectedJobTitle,
      //   permissions: checkedKeys
      // });
      
      // 隐藏保存中Alert，只显示成功Toast
      setShowAlert(false);
      
      addToast({
        title: "权限配置保存成功",
        description: `"${selectedJobTitleName}" 的 ${permissionCount} 个权限配置已保存`,
        color: "success",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
        ),
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
      
    } catch (error) {
      console.error('保存权限设置失败:', error);
      
      // 隐藏保存中Alert，只显示错误Toast
      setShowAlert(false);
      
      addToast({
        title: "权限配置保存失败",
        description: "请检查网络连接后重试",
        color: "danger",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
        timeout: 4000,
        shouldShowTimeoutProgress: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-6">
          {/* Alert 显示区域 */}
          {showAlert && (
            <Alert
              color={alertConfig.type}
              title={alertConfig.title}
              description={alertConfig.description}
              isClosable
              onClose={() => setShowAlert(false)}
            />
          )}
          <div className="flex gap-2 items-center">
            <Input
              label="角色英文名"
              placeholder="请输入角色英文名"
              value={roleEn}
              onChange={e => setRoleEn(e.target.value)}
              className="w-56"
              aria-label="角色英文名输入框"
            />
            <Input
              label="角色中文名"
              placeholder="请输入角色中文名"
              value={roleCn}
              onChange={e => setRoleCn(e.target.value)}
              className="w-56"
              aria-label="角色中文名输入框"
            />
            <Button color="primary" onClick={handleAddRole}>+ 添加角色</Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <span>职称</span>
            <Select
              label="选择职称"
              selectedKeys={selectedJobTitle ? [selectedJobTitle] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setSelectedJobTitle(selectedKey || "");
              }}
              className="w-56"
              isLoading={jobTitlesLoading}
              placeholder="请选择职称"
              aria-label="选择职称下拉菜单"
            >
              {jobTitles.map(jt => {
                const textValue = `${jt.name} (${jt.level})`;
                return (
                  <SelectItem 
                    key={jt.id.toString()} 
                    textValue={textValue}
                    aria-label={`职称: ${textValue}`}
                  >
                    {jt.name} ({jt.level})
                  </SelectItem>
                );
              })}
            </Select>
          </div>
          {selectedJobTitle && (
            <div className="text-sm text-gray-600 pl-16">
              当前职称：{jobTitles.find(jt => jt.id.toString() === selectedJobTitle)?.name || '未找到'} 
              ({jobTitles.find(jt => jt.id.toString() === selectedJobTitle)?.level || ''})
            </div>
          )}
          <div>
            <div className="font-semibold mb-2">可访问资源</div>
            {!selectedJobTitle && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  请先选择职称，然后配置对应的权限
                </div>
              </div>
            )}
            <div className={`border rounded p-4 ${!selectedJobTitle ? 'bg-gray-100' : 'bg-gray-50'}`}>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner 
                    size="sm" 
                    color="primary" 
                    label="加载菜单中..."
                    classNames={{
                      label: "text-sm text-gray-500 ml-2"
                    }}
                  />
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-500 text-sm">
                  {error}
                </div>
              ) : !selectedJobTitle ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-500 mb-2">未选择职称</p>
                  <p className="text-sm text-gray-400">请先在上方选择职称，然后为该职称配置访问权限</p>
                </div>
              ) : (
                <PermissionTree
                  nodes={menuItems}
                  checkedKeys={checkedKeys}
                  onCheck={handleCheck}
                  disabled={!selectedJobTitle}
                />
              )}
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <Button 
              variant="flat" 
              onClick={handleCancel} 
              isDisabled={saving || !selectedJobTitle}
            >
              取消修改
            </Button>
            <Button 
              color="primary" 
              onClick={handleSave}
              isLoading={saving}
              isDisabled={saving || !selectedJobTitle}
            >
              {saving ? '保存中...' : '确认修改'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 