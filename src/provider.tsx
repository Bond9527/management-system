import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { useHref, useNavigate } from "react-router-dom";
import { MenuProvider } from "@/context/MenuContext";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <MenuProvider>
        {children}
      </MenuProvider>
      <div className="fixed z-[100]">
        <ToastProvider placement="top-center" toastOffset={20} />
      </div>
    </HeroUIProvider>
  );
}
