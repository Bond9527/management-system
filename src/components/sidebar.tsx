import { FC, useState } from "react";
import { Link } from "@heroui/link";
import { siteConfig } from "@/config/site";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { useMenu } from "@/context/MenuContext";

// 导入所有图标组件
import {
  UserManagementIcon,
  PermissionManagementIcon,
  InventoryManagementIcon,
  AddRecordIcon,
  RecordsManagementIcon,
  StatisticsManagementIcon,
} from "@/components/management-icons";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  absoluteStrokeWidth?: boolean;
}

interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<IconProps>;
  children?: MenuItem[];
  order?: number;
}

// 图标映射
const iconMap: Record<string, React.ComponentType<IconProps>> = {
  'UserManagementIcon': UserManagementIcon,
  'PermissionManagementIcon': PermissionManagementIcon,
  'InventoryManagementIcon': InventoryManagementIcon,
  'AddRecordIcon': AddRecordIcon,
  'RecordsManagementIcon': RecordsManagementIcon,
  'StatisticsManagementIcon': StatisticsManagementIcon,
};

// 将API菜单数据转换为组件菜单格式
const convertApiMenuToComponentMenu = (apiMenus: any[]): MenuItem[] => {
  const menuMap = new Map();
  const rootMenus: MenuItem[] = [];

  // 首先创建所有菜单项
  apiMenus.forEach(menu => {
    const Icon = menu.icon ? iconMap[menu.icon] : undefined;
    menuMap.set(menu.id, {
      label: menu.name,
      href: menu.path,
      icon: Icon,
      children: [],
      order: menu.order,
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
    menus.sort((a, b) => (a.order || 0) - (b.order || 0));
    menus.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        sortMenus(menu.children);
      }
    });
  };
  sortMenus(rootMenus);

  return rootMenus;
};

export const systemMenuItems: MenuItem[] = [
  {
    label: "系统管理",
    children: [
      {
        label: "用户管理",
        href: "/system/users",
        icon: UserManagementIcon,
      },
      {
        label: "基础信息设置",
        href: "/system/basic-settings",
        icon: PermissionManagementIcon,
      },
    ],
  },
  {
    label: "耗材管理",
    children: [
      {
        label: "库存总览",
        href: "/supplies/inventory-overview",
        icon: InventoryManagementIcon,
      },
      {
        label: "新增记录",
        href: "/supplies/add-record",
        icon: AddRecordIcon,
      },
      {
        label: "变动台账",
        href: "/supplies/records",
        icon: RecordsManagementIcon,
      },
      {
        label: "数据统计",
        href: "/supplies/statistics",
        icon: StatisticsManagementIcon,
      },
    ],
  },
];

export const Sidebar: FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const navigate = useNavigate();
  const { sidebarMenus, loading, error } = useMenu();

  // 转换API菜单数据为组件菜单格式
  const dynamicMenuItems = convertApiMenuToComponentMenu(sidebarMenus);

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedMenus.includes(item.label);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    return (
      <div key={item.label}>
        {hasChildren ? (
          <div>
            <Button
              onClick={() => toggleMenu(item.label)}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600",
                "group relative",
                "bg-transparent",
                "data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-50 data-[active=true]:to-blue-100 data-[active=true]:text-blue-600 data-[active=true]:font-medium"
              )}
              variant="light"
            >
              <div className="flex items-center">
                <span className="absolute left-0 w-1 h-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full transition-all duration-200 group-hover:h-full" />
                <span className="ml-2">{item.label}</span>
              </div>
              <svg
                className={clsx(
                  "w-4 h-4 transition-transform duration-200",
                  isExpanded ? "transform rotate-180" : ""
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            {isExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children?.map(child => renderMenuItem(child, level + 1))}
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={() => item.href && navigate(item.href)}
            className={clsx(
              "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
              "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600",
              "data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-50 data-[active=true]:to-blue-100 data-[active=true]:text-blue-600 data-[active=true]:font-medium",
              "group relative",
              "bg-transparent",
              "justify-start"
            )}
            variant="light"
          >
            <span className="absolute left-0 w-1 h-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full transition-all duration-200 group-hover:h-full group-data-[active=true]:h-full" />
            {Icon && <Icon className="w-5 h-5 text-gray-500 mr-2" />}
            <span className="ml-2">{item.label}</span>
          </Button>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col w-64 bg-gradient-to-b from-gray-50 to-gray-100 h-[calc(100vh-4rem)]">
      {/* Navigation Items (now at the very top) */}
      <nav className="flex-1 overflow-auto px-3 py-4 space-y-1">
        {siteConfig.navItems.map((item) => (
          <Button
            key={item.href}
            onClick={() => navigate(item.href)}
            className={clsx(
              "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
              "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600",
              "data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-50 data-[active=true]:to-blue-100 data-[active=true]:text-blue-600 data-[active=true]:font-medium",
              "group relative",
              "bg-transparent",
              "justify-start"
            )}
            variant="light"
          >
            <span className="absolute left-0 w-1 h-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full transition-all duration-200 group-hover:h-full group-data-[active=true]:h-full" />
            <span className="ml-2">{item.label}</span>
          </Button>
        ))}

        {/* System Management Menu */}
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-500">加载菜单中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500 text-sm">
              {error}
            </div>
          ) : (
            dynamicMenuItems.map(item => renderMenuItem(item))
          )}
        </div>
      </nav>
    </div>
  );

  // Desktop Sidebar
  const desktopSidebar = (
    <aside className="hidden lg:block w-64 border-r border-gray-200 shadow-md transition-all duration-300">
      {sidebarContent}
    </aside>
  );

  // Mobile Drawer
  const mobileDrawer = (
    <div
      className={clsx(
        "fixed inset-0 z-40 lg:hidden transition-all duration-300",
        isOpen ? "block" : "hidden"
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 shadow-md transform transition-transform duration-300">
        {sidebarContent}
      </div>
    </div>
  );

  return (
    <>
      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}; 