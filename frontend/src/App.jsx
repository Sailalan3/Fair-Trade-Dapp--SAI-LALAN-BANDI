import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider, { useAuth } from "./context/AuthContext";
import NotificationProvider from "./context/NotificationContext";
import { ToastContainer } from "./components/NotificationPanel";
import AIChatAssistant from "./components/AIChatAssistant";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ProductsPage from "./pages/ProductsPage";
import AddProductPage from "./pages/AddProductPage";
import TransactionsPage from "./pages/TransactionsPage";
import TrackingPage from "./pages/TrackingPage";
import ProcessorPage from "./pages/ProcessorPage";
import ExporterPage from "./pages/ExporterPage";
import RetailerPage from "./pages/Retailerpage";
import AdminPage from "./pages/AdminPage";
import WarehousePage from "./pages/WarehousePage";
import TransporterPage from "./pages/TransporterPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import SettingsPage from "./pages/SettingsPage";
import OrdersPage from "./pages/OrdersPage";
import DocumentsPage from "./pages/DocumentsPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  const role = user.preferredRole || user.role || "farmer";
  return <Navigate to={`/dashboard/${role}`} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/track/:productId" element={<TrackingPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard/farmer" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/processor" element={<ProtectedRoute><ProcessorPage /></ProtectedRoute>} />
        <Route path="/dashboard/roaster" element={<ProtectedRoute><ProcessorPage /></ProtectedRoute>} />
        <Route path="/dashboard/manufacturer" element={<ProtectedRoute><ProcessorPage /></ProtectedRoute>} />
        <Route path="/dashboard/exporter" element={<ProtectedRoute><ExporterPage /></ProtectedRoute>} />
        <Route path="/dashboard/retailer" element={<ProtectedRoute><RetailerPage /></ProtectedRoute>} />
        <Route path="/dashboard/warehouse" element={<ProtectedRoute><WarehousePage /></ProtectedRoute>} />
        <Route path="/dashboard/transporter" element={<ProtectedRoute><TransporterPage /></ProtectedRoute>} />
        <Route path="/dashboard/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<RootRedirect />} />

        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/add" element={<ProtectedRoute><AddProductPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/receipts" element={<ProtectedRoute><ReceiptsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function AuthenticatedExtras() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return (
    <>
      <ToastContainer />
      <AIChatAssistant />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <AuthenticatedExtras />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
