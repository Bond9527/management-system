import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import DashboardPage from "./pages/dashboard";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import DefaultLayout from "@/layouts/default";

// System Management Pages
import UsersPage from "@/pages/system/users";
import RolesPage from "@/pages/system/roles";
import PermissionsPage from "@/pages/system/permissions";
import MenusPage from "@/pages/system/menus";
import DepartmentsPage from "@/pages/system/departments";
import PositionsPage from "@/pages/system/positions";

// Supplies Management Pages
import SuppliesApplyPage from "@/pages/supplies/apply";
import SuppliesApprovePage from "@/pages/supplies/approve";
import SuppliesInventoryPage from "@/pages/supplies/inventory";
import SuppliesPurchasePage from "@/pages/supplies/purchase";
import SuppliesOutboundPage from "@/pages/supplies/outbound";
import SuppliesInboundPage from "@/pages/supplies/inbound";
import SuppliesRecordsPage from "@/pages/supplies/records";
import SuppliesStatisticsPage from "@/pages/supplies/statistics";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes with DefaultLayout */}
      <Route element={<DefaultLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="/index" element={<Navigate to="/dashboard" replace />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* System Management Routes */}
        <Route path="/system/users" element={<UsersPage />} />
        <Route path="/system/roles" element={<RolesPage />} />
        <Route path="/system/permissions" element={<PermissionsPage />} />
        <Route path="/system/menus" element={<MenusPage />} />
        <Route path="/system/departments" element={<DepartmentsPage />} />
        <Route path="/system/positions" element={<PositionsPage />} />

        {/* Supplies Management Routes */}
        <Route path="/supplies/apply" element={<SuppliesApplyPage />} />
        <Route path="/supplies/approve" element={<SuppliesApprovePage />} />
        <Route path="/supplies/inventory" element={<SuppliesInventoryPage />} />
        <Route path="/supplies/purchase" element={<SuppliesPurchasePage />} />
        <Route path="/supplies/outbound" element={<SuppliesOutboundPage />} />
        <Route path="/supplies/inbound" element={<SuppliesInboundPage />} />
        <Route path="/supplies/records" element={<SuppliesRecordsPage />} />
        <Route path="/supplies/statistics" element={<SuppliesStatisticsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
