import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  component: string;
  icon: string;
  menu_type: 'menu' | 'page' | 'button';
  order: number;
  is_visible: boolean;
  is_active: boolean;
  parent: number | null;
  parent_name?: string;
  permissions_count: number;
  roles_count: number;
  display_position: 'sidebar' | 'navbar' | 'both';
  children?: MenuItem[];
  created_at: string;
  updated_at: string;
}

interface MenuContextType {
  sidebarMenus: MenuItem[];
  navbarMenus: MenuItem[];
  allMenus: MenuItem[];
  loading: boolean;
  error: string | null;
  refreshMenus: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [allMenus, setAllMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/menus/');
      const menus = response.results || response;
      setAllMenus(menus);
    } catch (err) {
      console.error('获取菜单失败:', err);
      setError('获取菜单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // 过滤侧边栏菜单
  const sidebarMenus = allMenus.filter(menu => 
    menu.is_active && 
    menu.is_visible && 
    (menu.display_position === 'sidebar' || menu.display_position === 'both')
  );

  // 过滤导航栏菜单
  const navbarMenus = allMenus.filter(menu => 
    menu.is_active && 
    menu.is_visible && 
    (menu.display_position === 'navbar' || menu.display_position === 'both')
  );

  const value: MenuContextType = {
    sidebarMenus,
    navbarMenus,
    allMenus,
    loading,
    error,
    refreshMenus: fetchMenus,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}; 