import React from "react";

import { useMenu } from "@/context/MenuContext";

export default function TestMenu() {
  const { sidebarMenus, navbarMenus, loading, error, refreshMenus } = useMenu();

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
        <p className="text-center mt-4">加载菜单中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">错误!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={refreshMenus}
        >
          重新加载菜单
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">菜单测试页面</h1>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={refreshMenus}
        >
          刷新菜单
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            侧边栏菜单 ({sidebarMenus.length}个)
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sidebarMenus.length === 0 ? (
              <div className="text-gray-500 italic">没有侧边栏菜单数据</div>
            ) : (
              sidebarMenus.map((menu) => (
                <div key={menu.id} className="p-3 border rounded bg-blue-50">
                  <div className="font-medium flex items-center gap-2">
                    {menu.icon && (
                      <span className="text-xs bg-gray-200 px-1 rounded">
                        {menu.icon}
                      </span>
                    )}
                    {menu.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    类型: {menu.menu_type} | 位置: {menu.display_position}
                  </div>
                  <div className="text-sm text-gray-500">
                    路径: {menu.path} | 排序: {menu.order}
                  </div>
                  {menu.parent && (
                    <div className="text-xs text-purple-600">
                      父菜单ID: {menu.parent}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            导航栏菜单 ({navbarMenus.length}个)
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {navbarMenus.length === 0 ? (
              <div className="text-gray-500 italic">没有导航栏菜单数据</div>
            ) : (
              navbarMenus.map((menu) => (
                <div key={menu.id} className="p-3 border rounded bg-green-50">
                  <div className="font-medium flex items-center gap-2">
                    {menu.icon && (
                      <span className="text-xs bg-gray-200 px-1 rounded">
                        {menu.icon}
                      </span>
                    )}
                    {menu.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    类型: {menu.menu_type} | 位置: {menu.display_position}
                  </div>
                  <div className="text-sm text-gray-500">
                    路径: {menu.path} | 排序: {menu.order}
                  </div>
                  {menu.parent && (
                    <div className="text-xs text-purple-600">
                      父菜单ID: {menu.parent}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">调试信息</h2>
        <div className="bg-gray-100 p-4 rounded text-sm font-mono">
          <p>侧边栏菜单数量: {sidebarMenus.length}</p>
          <p>导航栏菜单数量: {navbarMenus.length}</p>
          <p>加载状态: {loading ? "加载中" : "已完成"}</p>
          <p>错误状态: {error || "无错误"}</p>
          <p>当前时间: {new Date().toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">原始数据</h3>
        <details className="bg-gray-50 p-4 rounded">
          <summary className="cursor-pointer font-medium">
            点击查看原始JSON数据
          </summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify({ sidebarMenus, navbarMenus }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
