import { FC, useState } from "react";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/react";
import { SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@heroui/use-theme";
import { useMenu } from "@/context/MenuContext";

// 导入所有图标组件
import {
  UserManagementIcon,
  PermissionManagementIcon,
  InventoryManagementIcon,
  AddRecordIcon,
  RecordsManagementIcon,
  StatisticsManagementIcon,
  DashboardIcon,
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
  'DashboardIcon': DashboardIcon,
  'dashboard': DashboardIcon,
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

// 系统菜单项已迁移到数据库，通过API动态获取

export const Sidebar: FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const navigate = useNavigate();
  const { theme } = useTheme();
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
                "hover:bg-default-100 hover:text-primary",
                "data-[active=true]:bg-default-100 data-[active=true]:text-primary data-[active=true]:font-medium",
                "group relative",
                "bg-transparent"
              )}
              variant="light"
            >
              <div className="flex items-center">
                <span className="absolute left-0 w-1 h-0 bg-primary rounded-r-full transition-all duration-200 group-hover:h-full" />
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
              "hover:bg-default-100 hover:text-primary",
              "data-[active=true]:bg-default-100 data-[active=true]:text-primary data-[active=true]:font-medium",
              "group relative",
              "bg-transparent",
              "justify-start"
            )}
            variant="light"
          >
            <span className="absolute left-0 w-1 h-0 bg-primary rounded-r-full transition-all duration-200 group-hover:h-full group-data-[active=true]:h-full" />
            {Icon && <Icon className="w-5 h-5 mr-2 text-default-500" />}
            <span className="ml-2">{item.label}</span>
          </Button>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col w-64 h-[calc(100vh-4rem)] bg-content1">
      {/* 动态菜单 */}
      <nav className="flex-1 overflow-auto px-3 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner 
              size="sm" 
              color="primary" 
              label="加载菜单中..."
              classNames={{
                label: "text-sm ml-2 text-default-500"
              }}
            />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-danger text-sm">
            {error}
          </div>
        ) : (
          dynamicMenuItems.map(item => renderMenuItem(item))
        )}
      </nav>
    </div>
  );

  // Desktop Sidebar
  const desktopSidebar = (
    <aside className="hidden lg:block w-64 shadow-md transition-all duration-300 border-r border-divider">
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