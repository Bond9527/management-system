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
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-blue-600 data-[active=true]:font-medium",
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
                href="#"
                size="lg"
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
