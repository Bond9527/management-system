import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { apiRequest } from "@/services/api";

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  component: string;
  icon?: string;
  parent?: number | null;
  parent_name?: string;
  menu_type: "menu" | "page" | "button";
  order: number;
  is_visible: boolean;
  is_active: boolean;
  display_position: "sidebar" | "navbar" | "both";
  created_at: string;
  updated_at: string;
  permissions: number[];
  roles: number[];
  permissions_count: number;
  roles_count: number;
  menu_type_display: string;
  display_position_display: string;
}

interface MenuContextType {
  sidebarMenus: MenuItem[];
  navbarMenus: MenuItem[];
  loading: boolean;
  error: string | null;
  refreshMenus: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error("useMenu must be used within a MenuProvider");
  }

  return context;
};

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [sidebarMenus, setSidebarMenus] = useState<MenuItem[]>([]);
  const [navbarMenus, setNavbarMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest<
        MenuItem[] | { count: number; results: MenuItem[] }
      >("/menus/");
      // 处理两种可能的响应格式：直接数组或分页对象
      const menus = Array.isArray(response) ? response : response.results || [];

      // 确保 menus 是数组
      if (!Array.isArray(menus)) {
        console.error("菜单数据不是数组格式:", menus);
        setError("菜单数据格式错误");

        return;
      }

      // 分类菜单 - 根据实际的API数据结构进行分类
      const sidebar = menus.filter(
        (menu) =>
          menu.is_active &&
          menu.is_visible &&
          (menu.display_position === "sidebar" ||
            menu.display_position === "both"),
      );

      const navbar = menus.filter(
        (menu) =>
          menu.is_active &&
          menu.is_visible &&
          (menu.display_position === "navbar" ||
            menu.display_position === "both"),
      );

      setSidebarMenus(sidebar);
      setNavbarMenus(navbar);
    } catch (error: any) {
      console.error("获取菜单失败:", error);

      // 如果是认证过期错误，不设置error状态，让AuthContext处理
      if (error.message !== "AUTHENTICATION_EXPIRED") {
        setError(error.message || "获取菜单失败");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const refreshMenus = async () => {
    await fetchMenus();
  };

  const value: MenuContextType = {
    sidebarMenus,
    navbarMenus,
    loading,
    error,
    refreshMenus,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};
