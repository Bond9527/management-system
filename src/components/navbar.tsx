import { Button, Spinner } from "@heroui/react";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { link as linkStyles } from "@heroui/theme";
import { useTheme } from "@heroui/use-theme";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { SVGProps } from "react";
import { useState, useMemo, useEffect } from "react";
import { Avatar as HeroUIAvatar } from "@heroui/react";

import { useMenu } from "@/context/MenuContext";
import { useAuth } from "@/context/AuthContext";
import { suppliesApi, SupplyItem } from "@/services/supplies";
import { ThemeSwitch } from "@/components/theme-switch";
import { SearchIcon } from "@/components/icons";

// 根据用户状态、职位级别和角色分配头像颜色
const getAvatarColor = (user: any) => {
  // 优先考虑用户状态
  if (!user?.is_active) return "danger";

  // 考虑系统权限
  if (user?.is_superuser) return "warning";

  // 根据职位级别设置颜色
  if (user?.job_title) {
    const jobTitle = user.job_title;

    // 正高级职位 - 紫色
    if (jobTitle.includes("资深经理") || jobTitle.includes("正高级")) {
      return "secondary";
    }

    // 副高级职位 - 蓝色
    if (
      jobTitle.includes("高级工程师") ||
      jobTitle.includes("课长") ||
      jobTitle.includes("副经理") ||
      jobTitle.includes("经理") ||
      jobTitle.includes("副高级")
    ) {
      return "primary";
    }

    // 中级职位 - 绿色
    if (
      jobTitle.includes("工程师") ||
      jobTitle.includes("组长") ||
      jobTitle.includes("副组长") ||
      jobTitle.includes("副课长") ||
      jobTitle.includes("中级")
    ) {
      return "success";
    }

    // 初级职位 - 默认色
    if (
      jobTitle.includes("助理") ||
      jobTitle.includes("技术员") ||
      jobTitle.includes("初级")
    ) {
      return "default";
    }
  }

  // 根据角色设置颜色
  if (user?.is_staff) return "secondary";

  // 根据管理员角色设置颜色
  if (user?.profile?.role === "管理员") return "primary";

  // 默认颜色
  return "success";
};

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

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

// 系统管理相关图标
const RoleManagementIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"
      fill="currentColor"
    />
  </svg>
);

// 耗材管理相关图标
const ApplyManagementIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z"
      fill="currentColor"
    />
  </svg>
);

const InventoryOverviewIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 20 2ZM8 20H4V16H8V20ZM8 14H4V10H8V14ZM8 8H4V4H8V8ZM14 20H10V16H14V20ZM14 14H10V10H14V14ZM14 8H10V4H14V8ZM20 20H16V16H20V20ZM20 14H16V10H20V14ZM20 8H16V4H20V8Z"
      fill="currentColor"
    />
  </svg>
);

const RecordsIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z"
      fill="currentColor"
    />
  </svg>
);

const StatisticsIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M3 13.125C3 12.504 3.504 12 4.125 12H19.875C20.496 12 21 12.504 21 13.125C21 13.746 20.496 14.25 19.875 14.25H4.125C3.504 14.25 3 13.746 3 13.125Z"
      fill="currentColor"
    />
    <path
      d="M3 6.375C3 5.754 3.504 5.25 4.125 5.25H19.875C20.496 5.25 21 5.754 21 6.375C21 6.996 20.496 7.5 19.875 7.5H4.125C3.504 7.5 3 6.996 3 6.375Z"
      fill="currentColor"
    />
    <path
      d="M3 19.875C3 19.254 3.504 18.75 4.125 18.75H19.875C20.496 18.75 21 19.254 21 19.875C21 20.496 20.496 21 19.875 21H4.125C3.504 21 3 20.496 3 19.875Z"
      fill="currentColor"
    />
  </svg>
);

interface MenuItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<IconProps>;
  order?: number;
}

// 图标映射
const iconMap: Record<string, React.ComponentType<IconProps>> = {
  UserManagementIcon: UserManagementIcon,
  PermissionManagementIcon: PermissionManagementIcon,
  InventoryManagementIcon: InventoryManagementIcon,
  AddRecordIcon: AddRecordIcon,
  RecordsManagementIcon: RecordsManagementIcon,
  StatisticsManagementIcon: StatisticsManagementIcon,
  DashboardIcon: DashboardIcon,
  dashboard: DashboardIcon,
};

// 将API菜单数据转换为navbar格式
const convertApiMenuToNavbarFormat = (
  apiMenus: any[],
): {
  directMenus: MenuItem[];
  dropdownMenus: { [key: string]: MenuItem[] };
} => {
  const menuMap = new Map();
  const directMenus: MenuItem[] = [];
  const dropdownMenus: { [key: string]: MenuItem[] } = {};

  // 首先创建所有菜单项
  apiMenus.forEach((menu) => {
    const Icon = menu.icon ? iconMap[menu.icon] : undefined;

    menuMap.set(menu.id, {
      key: menu.id.toString(),
      label: menu.name,
      href: menu.path,
      icon: Icon || (() => null),
      order: menu.order,
    });
  });

  // 建立父子关系
  apiMenus.forEach((menu) => {
    const menuItem = menuMap.get(menu.id);

    if (menu.parent) {
      const parent = menuMap.get(menu.parent);

      if (parent) {
        // 将子菜单添加到父菜单的组中
        const parentName =
          apiMenus.find((m) => m.id === menu.parent)?.name || "其他";

        if (!dropdownMenus[parentName]) {
          dropdownMenus[parentName] = [];
        }
        dropdownMenus[parentName].push(menuItem);
      }
    } else {
      // 根菜单处理
      if (menu.menu_type === "menu") {
        // 有子菜单的根菜单作为下拉菜单标题
        if (!dropdownMenus[menu.name]) {
          dropdownMenus[menu.name] = [];
        }
      } else {
        // 无子菜单的根菜单作为直接菜单项
        directMenus.push(menuItem);
      }
    }
  });

  // 排序
  directMenus.sort((a, b) => (a.order || 0) - (b.order || 0));
  Object.keys(dropdownMenus).forEach((key) => {
    dropdownMenus[key].sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  return { directMenus, dropdownMenus };
};

interface NavbarProps {
  onMenuClick?: () => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export const Navbar = ({
  onMenuClick,
  sidebarOpen,
  onSidebarToggle,
}: NavbarProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { navbarMenus, loading, error } = useMenu();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SupplyItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<SupplyItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 从 localStorage 加载最近搜索记录
  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSupplySearches");

    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, []);

  // 保存最近搜索记录
  const saveToRecentSearches = (item: SupplyItem) => {
    const newRecentSearches = [
      item,
      ...recentSearches.filter((i) => i.id !== item.id),
    ].slice(0, 5);

    setRecentSearches(newRecentSearches);
    localStorage.setItem(
      "recentSupplySearches",
      JSON.stringify(newRecentSearches),
    );
  };

  // 转换API菜单数据为navbar格式
  const { directMenus, dynamicDropdownMenus } = useMemo(() => {
    if (!navbarMenus || navbarMenus.length === 0)
      return { directMenus: [], dynamicDropdownMenus: {} };
    const result = convertApiMenuToNavbarFormat(navbarMenus);

    return {
      directMenus: result.directMenus,
      dynamicDropdownMenus: result.dropdownMenus,
    };
  }, [navbarMenus]);

  // 处理搜索
  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResults([]);

      return;
    }

    setIsSearching(true);
    try {
      const results = await suppliesApi.getSupplies({ search: value });

      setSearchResults(results);
    } catch (error) {
      console.error("搜索出错:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理搜索结果点击
  const handleResultClick = (item: SupplyItem) => {
    saveToRecentSearches(item);
    navigate(`/supplies/details/${item.id}`);
    onClose();
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleHelp = () => {
    navigate("/help");
  };

  const handleLogout = () => {
    // 清除所有登录相关的存储
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // 清除其他可能存在的认证信息
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // 使用 navigate 进行路由跳转
    navigate("/login", { replace: true });
  };

  const searchInput = (
    <Input
      readOnly
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="搜索耗材..."
      startContent={
        <SearchIcon className="text-base pointer-events-none flex-shrink-0 text-default-400" />
      }
      type="search"
      value={searchTerm}
      onClick={onOpen}
    />
  );

  return (
    <>
      <HeroUINavbar
        className="shadow-sm transition-all duration-300 z-50 border-b border-divider bg-background text-foreground"
        maxWidth="full"
        position="sticky"
      >
        <NavbarContent justify="start">
          <Button
            isIconOnly
            aria-label={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
            className="p-2 rounded-lg mr-2 hover:bg-default-100"
            variant="light"
            onClick={onSidebarToggle}
          >
            {sidebarOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            )}
          </Button>
          <NavbarBrand className="gap-3 max-w-fit h-16">
            <Link
              className="flex justify-start items-center"
              color="foreground"
              href="/home"
            >
              <p className="font-bold italic text-xl text-blue-600 wiggle">
                Foxlink
              </p>
            </Link>
          </NavbarBrand>
          <div className="hidden lg:flex gap-4 justify-start ml-2">
            {/* 直接菜单项 */}
            {directMenus.map((item) => (
              <NavbarItem key={item.key}>
                <Button
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
                    "h-8 flex items-center text-sm tracking-wide px-4",
                    "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                    "transition-all duration-300",
                  )}
                  variant="light"
                  onClick={() => navigate(item.href)}
                >
                  {item.label}
                </Button>
              </NavbarItem>
            ))}

            {/* 动态下拉菜单 */}
            {Object.entries(dynamicDropdownMenus).map(
              ([menuName, menuItems]) => (
                <NavbarItem key={menuName} className="px-4">
                  <Dropdown>
                    <DropdownTrigger>
                      <Link
                        className={clsx(
                          linkStyles({ color: "foreground" }),
                          "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
                          "h-8 flex items-center text-sm tracking-wide cursor-pointer",
                          "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                          "transition-all duration-300",
                        )}
                        color="foreground"
                      >
                        {menuName}
                      </Link>
                    </DropdownTrigger>
                    <DropdownMenu aria-label={menuName} items={menuItems}>
                      {(item: MenuItem) => {
                        const Icon = item.icon;

                        return (
                          <DropdownItem
                            key={item.key}
                            as={Link}
                            href={item.href}
                          >
                            <Icon className="text-xl text-default-500 pointer-events-none flex-shrink-0" />
                            {item.label}
                          </DropdownItem>
                        );
                      }}
                    </DropdownMenu>
                  </Dropdown>
                </NavbarItem>
              ),
            )}

            {loading ? (
              <NavbarItem>
                <div className="flex items-center px-4">
                  <Spinner
                    classNames={{
                      label: "text-sm ml-2 text-default-500",
                    }}
                    color="primary"
                    label="加载中..."
                    size="sm"
                  />
                </div>
              </NavbarItem>
            ) : error ? (
              <NavbarItem>
                <div className="text-danger text-sm px-4">{error}</div>
              </NavbarItem>
            ) : null}
          </div>
        </NavbarContent>

        <NavbarContent
          className="hidden sm:flex basis-1/5 sm:basis-full"
          justify="end"
        >
          <NavbarItem className="hidden sm:flex gap-2">
            <ThemeSwitch />
          </NavbarItem>
          <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <HeroUIAvatar
                  className="cursor-pointer hover:scale-110 transition-transform"
                  color={getAvatarColor(user)}
                  isBordered={true}
                  name={user?.username}
                  radius="lg"
                  size="md"
                  src={user?.avatar || undefined}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="用户菜单">
                <DropdownSection title="用户信息">
                  <DropdownItem
                    key="profile"
                    description="查看个人资料"
                    onPress={handleProfile}
                  >
                    个人资料
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    description="管理账户设置"
                    onPress={handleSettings}
                  >
                    设置
                  </DropdownItem>
                </DropdownSection>
                <DropdownSection title="帮助">
                  <DropdownItem
                    key="help"
                    description="获取帮助"
                    onPress={handleHelp}
                  >
                    帮助中心
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    className="text-danger"
                    color="danger"
                    description="退出登录"
                    onPress={handleLogout}
                  >
                    退出登录
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
          <ThemeSwitch />
          <NavbarMenuToggle onClick={onMenuClick} />
        </NavbarContent>

        <NavbarMenu>
          {searchInput}
          <div className="mx-4 mt-2 flex flex-col gap-2">
            {/* 直接菜单项 - 移动端 */}
            {directMenus.map((item) => (
              <NavbarMenuItem key={item.key}>
                <Link
                  className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
                  color="foreground"
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}

            {/* 动态下拉菜单 - 移动端 */}
            {Object.entries(dynamicDropdownMenus).map(
              ([menuName, menuItems]) => (
                <NavbarMenuItem key={menuName}>
                  <Dropdown>
                    <DropdownTrigger>
                      <Link
                        className={clsx(
                          linkStyles({ color: "foreground" }),
                          "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
                          "h-8 flex items-center text-sm tracking-wide cursor-pointer",
                          "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                          "transition-all duration-300",
                        )}
                        color="foreground"
                      >
                        {menuName}
                      </Link>
                    </DropdownTrigger>
                    <DropdownMenu aria-label={menuName} items={menuItems}>
                      {(item: MenuItem) => {
                        const Icon = item.icon;

                        return (
                          <DropdownItem
                            key={item.key}
                            as={Link}
                            href={item.href}
                          >
                            <Icon className="text-xl text-default-500 pointer-events-none flex-shrink-0" />
                            {item.label}
                          </DropdownItem>
                        );
                      }}
                    </DropdownMenu>
                  </Dropdown>
                </NavbarMenuItem>
              ),
            )}
          </div>
        </NavbarMenu>
      </HeroUINavbar>

      <Modal
        backdrop="blur"
        classNames={{
          base: "bg-default-100/90 dark:bg-default-100/90 backdrop-blur-md rounded-2xl",
          backdrop: "bg-background/30",
          body: "p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          closeButton: "hidden",
          header: "border-b-0 p-0",
          wrapper: "rounded-2xl overflow-hidden",
        }}
        isOpen={isOpen}
        placement="top"
        scrollBehavior="inside"
        size="md"
        onClose={onClose}
      >
        <ModalContent>
          <ModalBody>
            <div className="p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Input
                autoFocus
                classNames={{
                  inputWrapper: "bg-default-200/50",
                }}
                endContent={
                  <div className="flex items-center">
                    <Kbd className="hidden sm:inline-block">ESC</Kbd>
                  </div>
                }
                placeholder="搜索耗材..."
                radius="lg"
                size="lg"
                startContent={
                  isSearching ? (
                    <Spinner size="sm" />
                  ) : (
                    <SearchIcon className="text-default-400" />
                  )
                }
                value={searchTerm}
                variant="bordered"
                onValueChange={handleSearch}
              />

              {/* 显示搜索结果或最近记录 */}
              {(searchResults.length > 0 ||
                (!searchTerm && recentSearches.length > 0)) && (
                <div className="mt-4">
                  <div className="text-sm text-default-500 mb-2">
                    {searchTerm ? "搜索结果" : "最近搜索"}
                  </div>
                  <div className="flex flex-col gap-1">
                    {(searchTerm ? searchResults : recentSearches).map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-primary-500/10 group"
                          onClick={() => handleResultClick(item)}
                        >
                          <SearchIcon className="text-default-400 flex-shrink-0 group-hover:text-primary-500" />
                          <div>
                            <div className="font-medium group-hover:text-primary-500">
                              {item.name}
                            </div>
                            <div className="text-sm text-default-500 group-hover:text-primary-400">
                              {item.category}
                            </div>
                          </div>
                          <div className="ml-auto text-sm text-default-400 group-hover:text-primary-400">
                            {item.current_stock} {item.unit}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* 无搜索结果提示 */}
              {searchTerm && !isSearching && searchResults.length === 0 && (
                <div className="mt-4 text-center text-default-500">
                  未找到相关耗材
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
