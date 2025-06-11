import { Tabs, Tab } from "@heroui/react";
import DepartmentTab from "./basic-settings/DepartmentTab";
import MenuTab from "./basic-settings/MenuTab";
import PositionTab from "./basic-settings/PositionTab";
import PermissionTab from "./basic-settings/PermissionTab";

export default function BasicSettingsTabs() {
  return (
    <Tabs aria-label="基础设置">
      <Tab key="departments" title="部门管理">
        <DepartmentTab />
      </Tab>
      <Tab key="menus" title="菜单管理">
        <MenuTab />
      </Tab>
      <Tab key="positions" title="职称管理">
        <PositionTab />
      </Tab>
      <Tab key="permissions" title="权限管理">
        <PermissionTab />
      </Tab>
    </Tabs>
  );
} 