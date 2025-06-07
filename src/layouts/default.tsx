import { useState } from "react";
import { Link } from "@heroui/link";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
          className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] transition-transform duration-300 bg-gradient-to-b from-gray-50 to-gray-100 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: '16rem' }}
        >
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
        <main className="flex-1 ml-0">
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
