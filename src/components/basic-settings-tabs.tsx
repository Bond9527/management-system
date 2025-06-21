import { Tabs, Tab } from "@heroui/react";
import { DepartmentManagementIcon, RoleManagementIcon, PositionManagementIcon, PermissionManagementIcon, MenuManagementIcon } from "@/components/management-icons";
import DepartmentTab from "./basic-settings/DepartmentTab";
import JobTitleTab from "./basic-settings/JobTitleTab";
import PositionTab from "./basic-settings/PositionTab";
import PermissionTab from "./basic-settings/PermissionTab";
import MenuTab from "./basic-settings/MenuTab";

export default function BasicSettingsTabs() {
  return (
    <Tabs aria-label="基础信息设置" color="primary" variant="solid" radius="lg" className="bg-gray-100 rounded-lg">
      <Tab
        key="departments"
        title={
          <div className="flex items-center space-x-2">
            <DepartmentManagementIcon className="w-5 h-5" />
            <span>部门管理</span>
          </div>
        }
      >
        <div className="mt-4">
          <DepartmentTab />
        </div>
      </Tab>
      <Tab
        key="positions"
        title={
          <div className="flex items-center space-x-2">
            <PositionManagementIcon className="w-5 h-5" />
            <span>职位管理</span>
          </div>
        }
      >
        <div className="mt-4">
          <PositionTab />
        </div>
      </Tab>
      <Tab
        key="titles"
        title={
          <div className="flex items-center space-x-2">
            <RoleManagementIcon className="w-5 h-5" />
            <span>职称管理</span>
          </div>
        }
      >
        <div className="mt-4">
          <JobTitleTab />
        </div>
      </Tab>
      <Tab
        key="permissions"
        title={
          <div className="flex items-center space-x-2">
            <PermissionManagementIcon className="w-5 h-5" />
            <span>权限管理</span>
          </div>
        }
      >
        <div className="mt-4">
          <PermissionTab />
        </div>
      </Tab>
      <Tab
        key="menus"
        title={
          <div className="flex items-center space-x-2">
            <MenuManagementIcon className="w-5 h-5" />
            <span>菜单管理</span>
          </div>
        }
      >
        <div className="mt-4">
          <MenuTab />
        </div>
      </Tab>
    </Tabs>
  );
} 