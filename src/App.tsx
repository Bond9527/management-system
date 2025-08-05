import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import DashboardPage from "./pages/dashboard";
import DocsPage from "./pages/docs";
import PricingPage from "./pages/pricing";
import BlogPage from "./pages/blog";
import AboutPage from "./pages/about";
import ProfilePage from "./pages/profile";
import AccountSettingsPage from "./pages/system/account-settings";
import DefaultLayout from "./layouts/default";
import TestMenu from "./pages/test-menu";
import TestAuthPage from "./pages/test-auth";
import TestMonthlyFieldsPage from "./pages/test-monthly-fields";
import TestDataRefreshPage from "./pages/test-data-refresh";
// import TestDataSyncPage from "./pages/test-data-sync";
// import TestMonthlyDataBinding from "./pages/test-monthly-data-binding";
import TestExcelExport from "./pages/test-excel-export";
import TestCalculationView from "./pages/test-calculation-view";

// System Management Pages
import UsersPage from "./pages/system/users";
import BasicSettingsPage from "./pages/system/basic-settings";

// Supplies Management Pages
import SuppliesInventoryOverviewPage from "./pages/supplies/inventory-overview";
import SuppliesAddRecordPage from "./pages/supplies/add-record";
import SuppliesRecordsPage from "./pages/supplies/records";
import SuppliesStatisticsPage from "./pages/supplies/statistics";
import SupplyDetailsPage from "./pages/supplies/details";
import DebugSyncPage from "./pages/supplies/debug-sync";
import TestCategorySummaryPage from "./pages/supplies/test-category-summary";
import DataComparisonPage from "./pages/supplies/data-comparison";
import ApplicationManagementPage from "./pages/supplies/application-management";

import ResetPasswordPage from "@/pages/reset-password";
import ForgotPasswordPage from "@/pages/forgot-password";

function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/login" />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<Register />} path="/register" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />
      <Route element={<ResetPasswordPage />} path="/reset-password" />

      {/* Protected Routes with DefaultLayout */}
      <Route element={<DefaultLayout />}>
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<Navigate replace to="/dashboard" />} path="/home" />
        <Route element={<Navigate replace to="/dashboard" />} path="/index" />
        <Route element={<DocsPage />} path="/docs" />
        <Route element={<PricingPage />} path="/pricing" />
        <Route element={<BlogPage />} path="/blog" />
        <Route element={<AboutPage />} path="/about" />
        <Route element={<ProfilePage />} path="/profile" />
        <Route element={<AccountSettingsPage />} path="/settings" />
        <Route
          element={
            <div className="p-6">
              <h1 className="text-2xl font-bold">帮助页面</h1>
              <p className="mt-4">帮助内容正在开发中...</p>
            </div>
          }
          path="/help"
        />

        {/* System Management Routes */}
        <Route element={<UsersPage />} path="/system/users" />
        <Route element={<BasicSettingsPage />} path="/system/basic-settings" />

        {/* Supplies Management Routes */}
        <Route
          element={<SuppliesInventoryOverviewPage />}
          path="/supplies/inventory-overview"
        />
        <Route
          element={<SuppliesAddRecordPage />}
          path="/supplies/add-record"
        />
        <Route element={<SuppliesRecordsPage />} path="/supplies/records" />
        <Route
          element={<SuppliesStatisticsPage />}
          path="/supplies/statistics"
        />
        <Route element={<SupplyDetailsPage />} path="/supplies/details/:id" />
        <Route element={<DebugSyncPage />} path="/supplies/debug-sync" />
        <Route
          element={<TestCategorySummaryPage />}
          path="/supplies/test-category-summary"
        />
        <Route
          element={<DataComparisonPage />}
          path="/supplies/data-comparison"
        />
        <Route
          element={<ApplicationManagementPage />}
          path="/supplies/application-management"
        />

        <Route element={<TestMenu />} path="/test-menu" />
        <Route element={<TestAuthPage />} path="/test-auth" />
        <Route
          element={<TestMonthlyFieldsPage />}
          path="/test-monthly-fields"
        />
        <Route element={<TestDataRefreshPage />} path="/test-data-refresh" />
        {/* <Route element={<TestDataSyncPage />} path="/test-data-sync" />
        <Route
          element={<TestMonthlyDataBinding />}
          path="/test-monthly-data-binding"
        /> */}
        <Route element={<TestExcelExport />} path="/test-excel-export" />
        <Route element={<TestCalculationView />} path="/test-calculation-view" />
      </Route>
    </Routes>
  );
}

export default App;
