import { apiRequest } from './api';

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
  children?: MenuItem[];
  created_at: string;
  updated_at: string;
}

export interface MenuFormData {
  name: string;
  path: string;
  component: string;
  icon: string;
  menu_type: 'menu' | 'page' | 'button';
  order: number;
  is_visible: boolean;
  is_active: boolean;
  parent: number | null;
}

export interface MenuResponse {
  success: boolean;
  data: MenuItem[];
  message?: string;
}

export interface MenuDetailResponse {
  success: boolean;
  data: MenuItem;
  message?: string;
}

export interface MenuCreateResponse {
  success: boolean;
  data: MenuItem;
  message?: string;
}

export interface MenuUpdateResponse {
  success: boolean;
  data: MenuItem;
  message?: string;
}

export interface MenuDeleteResponse {
  success: boolean;
  message?: string;
}

// 获取菜单列表
export const getMenuList = async (): Promise<MenuResponse> => {
  try {
    const response = await apiRequest<MenuResponse>('/menus/');
    return response;
  } catch (error) {
    console.error('获取菜单列表失败:', error);
    throw error;
  }
};

// 获取菜单树结构
export const getMenuTree = async (): Promise<MenuResponse> => {
  try {
    const response = await apiRequest<MenuResponse>('/menus/tree/');
    return response;
  } catch (error) {
    console.error('获取菜单树失败:', error);
    throw error;
  }
};

// 获取菜单详情
export const getMenuDetail = async (menuId: number): Promise<MenuDetailResponse> => {
  try {
    const response = await apiRequest<MenuDetailResponse>(`/menus/${menuId}/`);
    return response;
  } catch (error) {
    console.error('获取菜单详情失败:', error);
    throw error;
  }
};

// 创建菜单
export const createMenu = async (menuData: MenuFormData): Promise<MenuCreateResponse> => {
  try {
    const response = await apiRequest<MenuCreateResponse>('/menus/create/', {
      method: 'POST',
      body: JSON.stringify(menuData),
    });
    return response;
  } catch (error) {
    console.error('创建菜单失败:', error);
    throw error;
  }
};

// 更新菜单
export const updateMenu = async (menuId: number, menuData: Partial<MenuFormData>): Promise<MenuUpdateResponse> => {
  try {
    const response = await apiRequest<MenuUpdateResponse>(`/menus/${menuId}/update/`, {
      method: 'PUT',
      body: JSON.stringify(menuData),
    });
    return response;
  } catch (error) {
    console.error('更新菜单失败:', error);
    throw error;
  }
};

// 删除菜单
export const deleteMenu = async (menuId: number): Promise<MenuDeleteResponse> => {
  try {
    const response = await apiRequest<MenuDeleteResponse>(`/menus/${menuId}/delete/`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('删除菜单失败:', error);
    throw error;
  }
};

// 批量更新菜单
export const batchUpdateMenus = async (menusData: Partial<MenuItem>[]): Promise<MenuResponse> => {
  try {
    const response = await apiRequest<MenuResponse>('/menus/batch-update/', {
      method: 'POST',
      body: JSON.stringify({ menus: menusData }),
    });
    return response;
  } catch (error) {
    console.error('批量更新菜单失败:', error);
    throw error;
  }
};

// 获取用户可访问的菜单
export const getUserMenus = async (): Promise<MenuResponse> => {
  try {
    const response = await apiRequest<MenuResponse>('/menus/');
    return response;
  } catch (error) {
    console.error('获取用户菜单失败:', error);
    throw error;
  }
}; 