import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import TwoFactorLoginPage from './pages/TwoFactorLoginPage';
import TwoFactorSettingsPage from './pages/TwoFactorSettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import SessionManagementPage from './pages/SessionManagementPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { AccountPage } from './pages/AccountPage';
import { OrdersPage } from './pages/OrdersPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ResumePaymentPage } from './pages/ResumePaymentPage';
import { CartPage } from './pages/CartPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<ProductsPage />} />
    
    {/* Auth Routes - Public */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/login/2fa" element={<TwoFactorLoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/resend-verification" element={<ResendVerificationPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/auth/callback" element={<OAuthCallbackPage />} />
    
    {/* Product Routes */}
    <Route path="/products/:productId" element={<ProductDetailsPage />} />
    <Route path="/cart" element={<CartPage />} />

    {/* Protected User Routes */}
    <Route
      path="/account"
      element={
        <ProtectedRoute>
          <AccountPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/account/change-password"
      element={
        <ProtectedRoute>
          <ChangePasswordPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/account/2fa"
      element={
        <ProtectedRoute>
          <TwoFactorSettingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/account/sessions"
      element={
        <ProtectedRoute>
          <SessionManagementPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/orders"
      element={
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/checkout"
      element={
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/checkout/resume/:orderId"
      element={
        <ProtectedRoute>
          <ResumePaymentPage />
        </ProtectedRoute>
      }
    />

    {/* Admin Routes */}
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <Navigate to="/admin/dashboard" replace />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/dashboard"
      element={
        <AdminRoute>
          <AdminDashboardPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <AdminRoute>
          <AdminUsersPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/products"
      element={
        <AdminRoute>
          <AdminProductsPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/orders"
      element={
        <AdminRoute>
          <AdminOrdersPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/analytics"
      element={
        <AdminRoute>
          <AdminAnalyticsPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/settings"
      element={
        <AdminRoute>
          <AdminSettingsPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/audit-logs"
      element={
        <AdminRoute>
          <AuditLogsPage />
        </AdminRoute>
      }
    />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
