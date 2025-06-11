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

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

// 系统管理相关图标
const UserManagementIcon = (props: IconProps) => (
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
      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
      fill="currentColor"
    />
    <path
      d="M12 14.5C6.99 14.5 3 17.86 3 22H21C21 17.86 17.01 14.5 12 14.5Z"
      fill="currentColor"
      opacity={0.4}
    />
  </svg>
);

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

const PermissionManagementIcon = (props: IconProps) => (
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
      d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
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

const InventoryManagementIcon = (props: IconProps) => (
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

const PurchaseManagementIcon = (props: IconProps) => (
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
      d="M7 18C5.9 18 5.01 18.9 5.01 20C5.01 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20C9 18.9 8.1 18 7 18ZM17 18C15.9 18 15.01 18.9 15.01 20C15.01 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18ZM7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L21.16 4.96L19.42 4H19.41L18.31 6L15.55 11H8.53L8.4 10.73L6.16 6L5.21 4L4.27 2H1V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.29 15 7.17 14.89 7.17 14.75Z"
      fill="currentColor"
    />
  </svg>
);

// 添加更多图标组件
const MenuManagementIcon = (props: IconProps) => (
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

const DepartmentManagementIcon = (props: IconProps) => (
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

const PositionManagementIcon = (props: IconProps) => (
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

const ApproveManagementIcon = (props: IconProps) => (
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
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
      fill="currentColor"
    />
  </svg>
);

const OutboundManagementIcon = (props: IconProps) => (
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
      d="M19 7H15V3H9V7H5L12 14L19 7ZM5 18V20H19V18H5Z"
      fill="currentColor"
    />
  </svg>
);

const InboundManagementIcon = (props: IconProps) => (
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
      d="M19 13H15V17H9V13H5L12 6L19 13ZM5 18V20H19V18H5Z"
      fill="currentColor"
    />
  </svg>
);

const RecordsManagementIcon = (props: IconProps) => (
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

const StatisticsManagementIcon = (props: IconProps) => (
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
}

const systemManagementItems: MenuItem[] = [
  {
    key: "users",
    label: "用户管理",
    href: "/system/users",
    icon: UserManagementIcon,
  },
  {
    key: "basic-settings",
    label: "基础信息设置",
    href: "/system/basic-settings",
    icon: MenuManagementIcon,
  },
];

const suppliesManagementItems: MenuItem[] = [
  {
    key: "apply",
    label: "申请管理",
    href: "/supplies/apply",
    icon: ApplyManagementIcon,
  },
  {
    key: "approve",
    label: "审批管理",
    href: "/supplies/approve",
    icon: ApproveManagementIcon,
  },
  {
    key: "inventory",
    label: "库存管理",
    href: "/supplies/inventory",
    icon: InventoryManagementIcon,
  },
  {
    key: "purchase",
    label: "采购管理",
    href: "/supplies/purchase",
    icon: PurchaseManagementIcon,
  },
  {
    key: "outbound",
    label: "出库管理",
    href: "/supplies/outbound",
    icon: OutboundManagementIcon,
  },
  {
    key: "inbound",
    label: "入库管理",
    href: "/supplies/inbound",
    icon: InboundManagementIcon,
  },
  {
    key: "records",
    label: "台账记录",
    href: "/supplies/records",
    icon: RecordsManagementIcon,
  },
  {
    key: "statistics",
    label: "数据统计",
    href: "/supplies/statistics",
    icon: StatisticsManagementIcon,
  },
];

interface NavbarProps {
  onMenuClick?: () => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export const Navbar = ({ onMenuClick, sidebarOpen, onSidebarToggle }: NavbarProps) => {
  const navigate = useNavigate();

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
      className="bg-white border-b border-gray-200 shadow-sm text-gray-900 transition-all duration-300"
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
          <NavbarItem>
            <Link
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
                "h-8 flex items-center text-sm tracking-wide",
                "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                "transition-all duration-300"
              )}
              color="foreground"
              href="/dashboard"
            >
              仪表盘
            </Link>
          </NavbarItem>
          <NavbarItem>
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
                  系统管理
                </Link>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="系统管理" 
                items={systemManagementItems}
                className="p-2"
              >
                {(item: MenuItem) => {
                  const Icon = item.icon;
                  return (
                    <DropdownItem
                      key={item.key}
                      as={Link}
                      href={item.href}
                      className="text-sm tracking-wide"
                      startContent={<Icon className="text-xl text-default-500 pointer-events-none flex-shrink-0" />}
                    >
                      {item.label}
                    </DropdownItem>
                  );
                }}
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
          <NavbarItem>
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
                  耗材管理
                </Link>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="耗材管理" 
                items={suppliesManagementItems}
                className="p-2"
              >
                {(item: MenuItem) => {
                  const Icon = item.icon;
                  return (
                    <DropdownItem
                      key={item.key}
                      as={Link}
                      href={item.href}
                      className="text-sm tracking-wide"
                      startContent={<Icon className="text-xl text-default-500 pointer-events-none flex-shrink-0" />}
                    >
                      {item.label}
                    </DropdownItem>
                  );
                }}
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
          {siteConfig.navItems.slice(2).map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
                  "h-8 flex items-center text-sm tracking-wide",
                  "hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500",
                  "transition-all duration-300"
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
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
          <NavbarMenuItem>
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
                  系统管理
                </Link>
              </DropdownTrigger>
              <DropdownMenu aria-label="系统管理" items={systemManagementItems}>
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
          <NavbarMenuItem>
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
                  耗材管理
                </Link>
              </DropdownTrigger>
              <DropdownMenu aria-label="耗材管理" items={suppliesManagementItems}>
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
