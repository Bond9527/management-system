import { Button } from "@heroui/react";
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
  DropdownItem
} from "@heroui/react";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { SVGProps } from "react";
import { FC, useState } from "react";
import { useMenu } from "@/context/MenuContext";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
} from "@/components/icons";
import { Logo } from "@/components/icons";
import Avatar from "./Avatar";

// 导入所有图标组件
import {
  UserManagementIcon,
  PermissionManagementIcon,
  InventoryManagementIcon,
  AddRecordIcon,
  RecordsManagementIcon,
  StatisticsManagementIcon,
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
  'UserManagementIcon': UserManagementIcon,
  'PermissionManagementIcon': PermissionManagementIcon,
  'InventoryManagementIcon': InventoryManagementIcon,
  'AddRecordIcon': AddRecordIcon,
  'RecordsManagementIcon': RecordsManagementIcon,
  'StatisticsManagementIcon': StatisticsManagementIcon,
};

// 将API菜单数据转换为下拉菜单格式
const convertApiMenuToDropdownMenu = (apiMenus: any[]): { [key: string]: MenuItem[] } => {
  const menuMap = new Map();
  const dropdownMenus: { [key: string]: MenuItem[] } = {};

  // 首先创建所有菜单项
  apiMenus.forEach(menu => {
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
  apiMenus.forEach(menu => {
    const menuItem = menuMap.get(menu.id);
    if (menu.parent) {
      const parent = menuMap.get(menu.parent);
      if (parent) {
        // 将子菜单添加到父菜单的组中
        const parentName = apiMenus.find(m => m.id === menu.parent)?.name || '其他';
        if (!dropdownMenus[parentName]) {
          dropdownMenus[parentName] = [];
        }
        dropdownMenus[parentName].push(menuItem);
      }
    } else if (menu.menu_type === 'menu') {
      // 根菜单作为下拉菜单标题
      if (!dropdownMenus[menu.name]) {
        dropdownMenus[menu.name] = [];
      }
    }
  });

  // 按order排序每个下拉菜单中的项目
  Object.keys(dropdownMenus).forEach(key => {
    dropdownMenus[key].sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  return dropdownMenus;
};

interface NavbarProps {
  onMenuClick?: () => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export const Navbar = ({ onMenuClick, sidebarOpen, onSidebarToggle }: NavbarProps) => {
  const navigate = useNavigate();
  const { navbarMenus, loading, error } = useMenu();

  // 转换API菜单数据为下拉菜单格式
  const dynamicDropdownMenus = convertApiMenuToDropdownMenu(navbarMenus);

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
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-gray-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-gray-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar 
      maxWidth="full" 
      position="sticky"
      className="bg-white border-b border-gray-200 shadow-sm text-gray-900 transition-all duration-300 z-50"
    >
      <NavbarContent justify="start">
        <Button
          isIconOnly
          className="p-2 hover:bg-gray-100 rounded-lg mr-2"
          variant="light"
          onClick={onSidebarToggle}
          aria-label={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
        >
          {sidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </Button>
        <NavbarBrand className="gap-3 max-w-fit h-16">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/home"
          >
            <Logo />
            <p className="font-bold text-inherit">ACME</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Button
                onClick={() => navigate(item.href)}
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
                  "h-8 flex items-center text-sm tracking-wide px-4",
                  "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                  "transition-all duration-300"
                )}
                variant="light"
              >
                {item.label}
              </Button>
            </NavbarItem>
          ))}
          
          {/* 动态下拉菜单 */}
          {Object.entries(dynamicDropdownMenus).map(([menuName, menuItems]) => (
            <NavbarItem key={menuName} className="px-4">
              <Dropdown>
                <DropdownTrigger>
                  <Link
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
                      "h-8 flex items-center text-sm tracking-wide cursor-pointer",
                      "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                      "transition-all duration-300"
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
          ))}
          
          {loading ? (
            <NavbarItem>
              <div className="flex items-center px-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">加载中...</span>
              </div>
            </NavbarItem>
          ) : error ? (
            <NavbarItem>
              <div className="text-red-500 text-sm px-4">{error}</div>
            </NavbarItem>
          ) : null}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal href={siteConfig.links.twitter} title="Twitter">
            <TwitterIcon className="text-gray-500" />
          </Link>
          <Link isExternal href={siteConfig.links.discord} title="Discord">
            <DiscordIcon className="text-gray-500" />
          </Link>
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <GithubIcon className="text-gray-500" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
        <NavbarItem className="hidden md:flex">
          <Button
            isExternal
            as={Link}
            className="text-sm font-normal text-gray-600 bg-gray-100"
            href={siteConfig.links.sponsor}
            startContent={<HeartFilledIcon className="text-red-500" />}
            variant="flat"
          >
            Sponsor
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                className="p-0 bg-transparent hover:bg-gray-100 cursor-pointer"
                radius="full"
                variant="light"
              >
                <Avatar 
                  src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
                />
              </Button>
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
                  description="退出登录" 
                  className="text-danger" 
                  color="danger"
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
        <Link isExternal href={siteConfig.links.github}>
          <GithubIcon className="text-gray-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle onClick={onMenuClick} />
      </NavbarContent>

      <NavbarMenu>
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          <NavbarMenuItem>
            <Link
              color="foreground"
              href="/dashboard"
              size="lg"
              className="hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
            >
              仪表盘
            </Link>
          </NavbarMenuItem>
          
          {/* 动态下拉菜单 - 移动端 */}
          {Object.entries(dynamicDropdownMenus).map(([menuName, menuItems]) => (
            <NavbarMenuItem key={menuName}>
              <Dropdown>
                <DropdownTrigger>
                  <Link
                    className={clsx(
                      linkStyles({ color: "foreground" }),
                      "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
                      "h-8 flex items-center text-sm tracking-wide cursor-pointer",
                      "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                      "transition-all duration-300"
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
          ))}
          
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={
                  index === 2
                    ? "primary"
                    : index === siteConfig.navMenuItems.length - 1
                      ? "danger"
                      : "foreground"
                }
                href={item.href}
                size="lg"
                className={clsx(
                  "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                  "transition-all duration-300",
                  index === siteConfig.navMenuItems.length - 1 && "hover:from-red-500 hover:to-pink-500"
                )}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
