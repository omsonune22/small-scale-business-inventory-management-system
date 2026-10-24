import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  Truck, 
  ClipboardList, 
  BarChart3, 
  Users,
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Store,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { user, logout, switchRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Navigation Items
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, adminOnly: false },
    { name: 'POS / Sales', path: '/pos', icon: ShoppingCart, adminOnly: false },
    { name: 'Products', path: '/products', icon: Package, adminOnly: false },
    { name: 'Purchases', path: '/purchases', icon: ShoppingBag, adminOnly: true },
    { name: 'Suppliers', path: '/suppliers', icon: Truck, adminOnly: true },
    { name: 'Inventory Ledger', path: '/ledger', icon: ClipboardList, adminOnly: true },
    { name: 'Reports', path: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'User Management', path: '/users', icon: Users, adminOnly: true },
  ];

  // Filter routes based on user role
  const visibleNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'ADMIN');

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    toast.info('Session ended. You have been logged out.');
    navigate('/login', { replace: true });
  };

  const handleRoleToggle = () => {
    const nextRole = user?.role === 'ADMIN' ? 'STAFF' : 'ADMIN';
    switchRole(nextRole);
    toast.success(`Role switched to ${nextRole}. Navigation updated.`);
  };

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans">
      {/* 1. Mobile Sidebar Drawer Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
        />
      )}

      {/* 2. Collapsible Desktop Sidebar / Mobile Drawer */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 flex flex-col bg-[#0f172a] border-r border-slate-800 transition-all duration-300 ease-in-out z-50 select-none ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand / Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
                <Store size={20} />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm tracking-tight text-white">RetailPulse</span>
                <span className="text-[11px] text-slate-400 font-medium">Inventory & POS</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Store size={20} />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Toggle */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Routes */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                } ${collapsed && !mobileOpen ? 'justify-center' : ''}`
              }
              title={collapsed && !mobileOpen ? item.name : undefined}
            >
              <item.icon size={20} className="shrink-0 transition-transform group-hover:scale-105" />
              {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Quick Info */}
        <div className="p-3 border-t border-slate-800/80">
          {(!collapsed || mobileOpen) ? (
            <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                <span>ROLE SCOPE</span>
                <span className={user?.role === 'ADMIN' ? 'text-purple-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {user?.role || 'STAFF'}
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-500">
                {user?.role === 'ADMIN' ? 'Full Operational Admin' : 'Staff Register & POS'}
              </p>
            </div>
          ) : (
            <div 
              className={`w-3 h-3 mx-auto rounded-full shadow-sm ${
                user?.role === 'ADMIN' ? 'bg-purple-500' : 'bg-emerald-500'
              }`} 
              title={`Role: ${user?.role}`} 
            />
          )}
        </div>
      </aside>

      {/* 3. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 z-10">
          {/* Mobile Hamburger + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="hidden sm:inline text-indigo-400">Store Inventory & Point of Sale</span>
              <span className="sm:hidden text-white font-bold">RetailPulse</span>
            </h1>
          </div>

          {/* User Controls & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Role Toggle (Dev Demo Tool) */}
            <button
              onClick={handleRoleToggle}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition hidden sm:flex items-center gap-1.5"
              title="Test RBAC permissions by switching between ADMIN and STAFF"
            >
              <Shield size={13} className="text-indigo-400" />
              <span>Simulate {user?.role === 'ADMIN' ? 'STAFF' : 'ADMIN'}</span>
            </button>

            {/* Current User Role Badge & Info */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-xs shrink-0">
                {user?.fullName ? user.fullName[0] : 'U'}
              </div>

              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {user?.fullName || 'Authenticated User'}
                </span>
                <span className="text-[11px] text-slate-400 leading-tight truncate max-w-[140px]">
                  {user?.email || 'user@store.com'}
                </span>
              </div>

              <span 
                className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider border shadow-sm ${
                  user?.role === 'ADMIN'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {user?.role || 'STAFF'}
              </span>
            </div>

            {/* Logout Button (Triggers Confirmation Modal) */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition shadow-sm"
              title="Sign out of system"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-[#0b0f19] to-[#0d1322]">
          <Outlet />
        </main>
      </div>

      {/* Confirmation Modal for Logout */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Sign Out of RetailPulse"
        message="Are you sure you want to end your current session? You will need to enter your credentials to access the POS register and inventory again."
        confirmText="Sign Out"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
