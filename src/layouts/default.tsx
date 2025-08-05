import { useState, useEffect } from "react";
import { Link } from "@heroui/link";
import { Spinner } from "@heroui/react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";

import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/AuthContext";

export default function DefaultLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // 动态面包屑生成
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const breadcrumbNameMap: Record<string, string> = {
    dashboard: "仪表盘",
    system: "系统管理",
    users: "用户管理",
    "basic-settings": "基础信息设置",
    supplies: "耗材管理",
    "inventory-overview": "库存总览",
    "add-record": "新增记录",
    inventory: "库存管理",
    purchase: "采购管理",
    records: "台账记录",
    statistics: "数据统计",
    details: "库存总览",
    "debug-sync": "同步调试",
    "test-category-summary": "测试类别汇总",
    "data-comparison": "数据对比",
    "application-management": "申请表管理",
    docs: "文档中心",
    pricing: "价格方案",
    blog: "博客文章",
    about: "关于我们",
    profile: "个人资料",
    settings: "系统设置",
    help: "帮助中心",
    "test-menu": "菜单测试",
    "test-auth": "权限测试",
    "test-monthly-fields": "月度字段测试",
    "test-data-refresh": "数据刷新测试",
  };

  // 定义有子菜单的主菜单
  const menusWithChildren = ["system", "supplies"];

  const handleBreadcrumbClick = (to: string, value: string) => {
    // 如果点击的是库存总览，无论在哪个页面，都直接返回库存总览页面
    if (breadcrumbNameMap[value] === "库存总览") {
      navigate("/supplies/inventory-overview");
    } else {
      navigate(to);
    }
  };

  // 判断面包屑项是否可点击
  const isClickable = (value: string) => {
    // 只有主菜单（耗材管理、系统管理等）不可点击
    if (menusWithChildren.includes(value)) {
      return false;
    }

    // 其他菜单都可以点击
    return true;
  };

  // 认证保护
  useEffect(() => {
    console.log("DefaultLayout认证状态检查:", { isLoading, isAuthenticated });
    if (!isLoading && !isAuthenticated) {
      console.log("用户未认证，重定向到登录页面");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const handleResize = () => {
      const largeScreen = window.innerWidth >= 1024;

      setIsLargeScreen(largeScreen);

      if (largeScreen) {
        // 大屏幕时默认打开侧栏
        setIsSidebarOpen(true);
      } else {
        // 小屏幕时默认关闭侧栏
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 如果正在加载或未认证，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner
            classNames={{
              label: "text-gray-600 mt-4",
            }}
            color="primary"
            label="加载中..."
            size="lg"
          />
        </div>
      </div>
    );
  }

  // 如果未认证，不渲染内容（会被重定向到登录页面）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar with sidebar toggle button inside */}
      <Navbar
        sidebarOpen={isSidebarOpen}
        onMenuClick={() => setIsSidebarOpen(true)}
        onSidebarToggle={() => setIsSidebarOpen((v) => !v)}
      />
      <div className="flex flex-1 relative">
        {/* Sidebar with slide in/out animation */}
        <div
          className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] transition-transform duration-300 bg-gradient-to-b from-gray-50 to-gray-100
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{ width: "16rem" }}
        >
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
        <main
          className={`flex-1 transition-all duration-300 ${isSidebarOpen && isLargeScreen ? "ml-64" : "ml-0"}`}
        >
          {/* 面包屑导航，左上角 */}
          {location.pathname !== "/dashboard" && location.pathname !== "/" && (
            <div className="pl-6 pt-4">
              <Breadcrumbs color="primary">
                <BreadcrumbItem
                  className="cursor-pointer"
                  onPress={() => handleBreadcrumbClick("/dashboard", "")}
                >
                  仪表盘
                </BreadcrumbItem>
                {pathnames.map((value, idx) => {
                  const to = "/" + pathnames.slice(0, idx + 1).join("/");
                  const isLast = idx === pathnames.length - 1;
                  const canClick = isClickable(value);

                  if (isLast) {
                    return (
                      <BreadcrumbItem key={to} isCurrent>
                        {breadcrumbNameMap[value] || value}
                      </BreadcrumbItem>
                    );
                  }

                  return (
                    <BreadcrumbItem
                      key={to}
                      className={canClick ? "cursor-pointer" : ""}
                      onPress={
                        canClick
                          ? () => handleBreadcrumbClick(to, value)
                          : undefined
                      }
                    >
                      {breadcrumbNameMap[value] || value}
                    </BreadcrumbItem>
                  );
                })}
              </Breadcrumbs>
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://heroui.com"
          title="heroui.com homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">HeroUI</p>
        </Link>
      </footer>
    </div>
  );
}
