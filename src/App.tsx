import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import DashboardPage from "./pages/dashboard";
import DocsPage from "./pages/docs";
import PricingPage from "./pages/pricing";
import BlogPage from "./pages/blog";
import AboutPage from "./pages/about";
import DefaultLayout from "./layouts/default";

// System Management Pages
import UsersPage from "./pages/system/users";
import BasicSettingsPage from "./pages/system/basic-settings";

// Supplies Management Pages
import SuppliesInventoryOverviewPage from "./pages/supplies/inventory-overview";
import SuppliesAddRecordPage from "./pages/supplies/add-record";
import SuppliesRecordsPage from "./pages/supplies/records";
import SuppliesStatisticsPage from "./pages/supplies/statistics";

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
        <Route path="/system/basic-settings" element={<BasicSettingsPage />} />

        {/* Supplies Management Routes */}
        <Route path="/supplies/inventory-overview" element={<SuppliesInventoryOverviewPage />} />
        <Route path="/supplies/add-record" element={<SuppliesAddRecordPage />} />
        <Route path="/supplies/records" element={<SuppliesRecordsPage />} />
        <Route path="/supplies/statistics" element={<SuppliesStatisticsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
