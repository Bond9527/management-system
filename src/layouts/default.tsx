import { useState, useEffect } from "react";
import { Link } from "@heroui/link";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";

export default function DefaultLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();

  // 动态面包屑生成
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(x => x);
  const breadcrumbNameMap: Record<string, string> = {
    dashboard: "仪表盘",
    system: "系统管理",
    users: "用户管理",
    "basic-settings": "基础信息设置",
    supplies: "耗材管理",
    apply: "申请管理",
    approve: "审批管理",
    inventory: "库存管理",
    purchase: "采购管理",
    outbound: "出库管理",
    inbound: "入库管理",
    records: "台账记录",
    statistics: "数据统计",
    docs: "文档",
    pricing: "价格",
    blog: "博客",
    about: "关于",
    profile: "个人资料",
    settings: "设置",
    help: "帮助",
  };

  // 定义有子菜单的主菜单
  const menusWithChildren = ["system", "supplies"];

  const handleBreadcrumbClick = (to: string) => {
    navigate(to);
  };

  // 判断面包屑项是否可点击
  const isClickable = (value: string) => {
    // 如果是有子菜单的主菜单，则不可点击
    if (menusWithChildren.includes(value)) {
      return false;
    }
    // 其他菜单都可以点击
    return true;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar with sidebar toggle button inside */}
      <Navbar
        onMenuClick={() => setIsSidebarOpen(true)}
        sidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((v) => !v)}
      />
      <div className="flex flex-1 relative">
        {/* Sidebar with slide in/out animation */}
        <div
          className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] transition-transform duration-300 bg-gradient-to-b from-gray-50 to-gray-100
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
          style={{ width: '16rem' }}
        >
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen && window.innerWidth >= 1024 ? 'ml-64' : 'ml-0'}`}>
          {/* 面包屑导航，左上角 */}
          {location.pathname !== "/dashboard" && location.pathname !== "/" && (
            <div className="pl-6 pt-4">
              <Breadcrumbs color="primary">
                <BreadcrumbItem 
                  onPress={() => handleBreadcrumbClick("/dashboard")}
                  className="cursor-pointer"
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
                      onPress={canClick ? () => handleBreadcrumbClick(to) : undefined}
                      className={canClick ? "cursor-pointer" : ""}
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
