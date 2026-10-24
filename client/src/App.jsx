import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import POS from './pages/POS';
import Purchases from './pages/Purchases';
import NewPurchase from './pages/NewPurchase';
import Suppliers from './pages/Suppliers';
import InventoryLedger from './pages/InventoryLedger';
import Reports from './pages/Reports';
import UsersPage from './pages/UsersPage';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

/**
 * PublicRoute: Redirects logged in users away from /login
 */
function PublicRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'STAFF' ? '/pos' : '/'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />

            {/* Authenticated Application Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                {/* Common Routes for both Admin and Staff */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/products" element={<Products />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/sales/pos" element={<Navigate to="/pos" replace />} />
                <Route path="/sales" element={<Navigate to="/pos" replace />} />

                {/* HTTP 403 Forbidden Route */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/403" element={<Unauthorized />} />

                {/* Admin-Only Routes */}
                <Route element={<ProtectedRoute adminOnly={true} />}>
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/purchases/new" element={<NewPurchase />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/ledger" element={<InventoryLedger />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/users" element={<UsersPage />} />
                </Route>

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
