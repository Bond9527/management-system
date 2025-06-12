import { useState } from "react";
import { Card, CardBody, Input, Button, Select, SelectItem, Checkbox } from "@heroui/react";
import { systemMenuItems } from "@/components/sidebar";

interface MenuItem {
  label: string;
  href?: string;
  icon?: any;
  children?: MenuItem[];
}

// 职位数据（与 PositionTab.tsx 保持一致）
const positionOptions = [
  "技术总监",
  "运营总监",
  "市场总监",
  "研发工程师",
  "运维工程师"
];

const mockRoles = [
  { id: 1, en: "admin", cn: "管理员" },
  { id: 2, en: "hr", cn: "人事专员" },
  { id: 3, en: "manager", cn: "经理" },
];

// 递归渲染权限树，增加可折叠功能
function PermissionTree({ nodes, checkedKeys, onCheck, parentKey = null, depth = 0 }: {
  nodes: MenuItem[];
  checkedKeys: string[];
  onCheck: (node: MenuItem, checked: boolean, parentKey: string | null) => void;
  parentKey?: string | null;
  depth?: number;
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
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                  >
                    <polygon points="3,2 10,6 3,10" fill="#888" />
                  </svg>
                </button>
              )}
              <Checkbox
                isSelected={checked}
                onValueChange={() => onCheck(node, !checked, parentKey || null)}
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
  // 职位选择
  const [position, setPosition] = useState(positionOptions[0]);
  // 默认全部选中
  const getAllLabels = (nodes: MenuItem[]): string[] => nodes.flatMap(n => [n.label, ...(n.children ? getAllLabels(n.children) : [])]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>(getAllLabels(systemMenuItems));

  // 添加角色
  const handleAddRole = () => {
    if (!roleEn.trim() || !roleCn.trim()) return;
    setRoles([...roles, { id: Date.now(), en: roleEn, cn: roleCn }]);
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
        const parent = findNode(parentKey, systemMenuItems);
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
    setCheckedKeys(getAllLabels(systemMenuItems));
  };
  const handleSave = () => {
    alert(`已保存权限设置！\n职位：${position}\n选中权限: ${checkedKeys.join(", ")}`);
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-6">
          <div className="flex gap-2 items-center">
            <Input
              label="角色英文名"
              placeholder="请输入角色英文名"
              value={roleEn}
              onChange={e => setRoleEn(e.target.value)}
              className="w-56"
            />
            <Input
              label="角色中文名"
              placeholder="请输入角色中文名"
              value={roleCn}
              onChange={e => setRoleCn(e.target.value)}
              className="w-56"
            />
            <Button color="primary" onClick={handleAddRole}>+ 添加角色</Button>
          </div>
          <div className="flex gap-2 items-center">
            <span>职位</span>
            <Select
              selectedKeys={[position]}
              onSelectionChange={keys => setPosition(Array.from(keys)[0] as string)}
              className="w-56"
            >
              {positionOptions.map(pos => (
                <SelectItem key={pos}>{pos}</SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <div className="font-semibold mb-2">可访问资源</div>
            <div className="border rounded p-4 bg-gray-50">
              <PermissionTree
                nodes={systemMenuItems}
                checkedKeys={checkedKeys}
                onCheck={handleCheck}
              />
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <Button variant="flat" onClick={handleCancel}>取消修改</Button>
            <Button color="primary" onClick={handleSave}>确认修改</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 