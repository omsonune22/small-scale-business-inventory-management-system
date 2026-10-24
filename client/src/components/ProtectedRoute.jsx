import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * - Redirects unauthenticated users to '/login'.
 * - If adminOnly is true and the authenticated user role !== 'ADMIN',
 *   redirects Staff to '/pos' (or '/sales/pos').
 */
export default function ProtectedRoute({ adminOnly = false, children }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Verifying session credentials...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Redirect to /login with state preservation
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role restriction: Admin-only routes redirect Staff to '/unauthorized' (HTTP 403)
  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
}
