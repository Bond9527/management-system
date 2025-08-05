import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";

import DepartmentTab from "./basic-settings/DepartmentTab";
import JobTitleTab from "./basic-settings/JobTitleTab";
import MenuTab from "./basic-settings/MenuTab";
import PermissionTab from "./basic-settings/PermissionTab";
import {
  DepartmentManagementIcon,
  PositionManagementIcon,
  MenuManagementIcon,
  PermissionManagementIcon,
} from "./management-icons";

export default function BasicSettingsTabs() {
  const [selectedTab, setSelectedTab] = useState("departments");

  return (
    <div className="w-full">
      <Tabs
        aria-label="基础设置"
        className="bg-gray-100 rounded-lg"
        color="primary"
        radius="lg"
        selectedKey={selectedTab}
        variant="solid"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab
          key="departments"
          title={
            <div className="flex items-center space-x-2">
              <DepartmentManagementIcon className="w-4 h-4" />
              <span>部门管理</span>
            </div>
          }
        >
          <div className="mt-4">
            <DepartmentTab />
          </div>
        </Tab>

        <Tab
          key="jobTitles"
          title={
            <div className="flex items-center space-x-2">
              <PositionManagementIcon className="w-4 h-4" />
              <span>职称管理</span>
            </div>
          }
        >
          <div className="mt-4">
            <JobTitleTab />
          </div>
        </Tab>

        <Tab
          key="menus"
          title={
            <div className="flex items-center space-x-2">
              <MenuManagementIcon className="w-4 h-4" />
              <span>菜单管理</span>
            </div>
          }
        >
          <div className="mt-4">
            <MenuTab />
          </div>
        </Tab>

        <Tab
          key="permissions"
          title={
            <div className="flex items-center space-x-2">
              <PermissionManagementIcon className="w-4 h-4" />
              <span>权限管理</span>
            </div>
          }
        >
          <div className="mt-4">
            <PermissionTab />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
