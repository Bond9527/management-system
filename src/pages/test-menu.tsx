import React from 'react';
import { useMenu } from '@/context/MenuContext';

export default function TestMenu() {
  const { sidebarMenus, navbarMenus, allMenus, loading, error } = useMenu();

  if (loading) {
    return <div>加载菜单中...</div>;
  }

  if (error) {
    return <div>错误: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">菜单测试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">所有菜单 ({allMenus.length})</h2>
          <div className="space-y-2">
            {allMenus.map(menu => (
              <div key={menu.id} className="p-3 border rounded">
                <div className="font-medium">{menu.name}</div>
                <div className="text-sm text-gray-600">
                  类型: {menu.menu_type} | 位置: {menu.display_position}
                </div>
                <div className="text-sm text-gray-500">
                  路径: {menu.path}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">侧边栏菜单 ({sidebarMenus.length})</h2>
          <div className="space-y-2">
            {sidebarMenus.map(menu => (
              <div key={menu.id} className="p-3 border rounded bg-blue-50">
                <div className="font-medium">{menu.name}</div>
                <div className="text-sm text-gray-600">
                  类型: {menu.menu_type} | 位置: {menu.display_position}
                </div>
                <div className="text-sm text-gray-500">
                  路径: {menu.path}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">导航栏菜单 ({navbarMenus.length})</h2>
          <div className="space-y-2">
            {navbarMenus.map(menu => (
              <div key={menu.id} className="p-3 border rounded bg-green-50">
                <div className="font-medium">{menu.name}</div>
                <div className="text-sm text-gray-600">
                  类型: {menu.menu_type} | 位置: {menu.display_position}
                </div>
                <div className="text-sm text-gray-500">
                  路径: {menu.path}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 