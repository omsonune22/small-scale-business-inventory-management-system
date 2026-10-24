import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShoppingCart, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg text-center space-y-6 p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert size={36} />
        </div>

        <div className="space-y-2">
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            HTTP 403 FORBIDDEN
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Restricted Admin Privilege Required
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your authenticated role is <b className="text-emerald-400 font-mono">{user?.role || 'STAFF'}</b>. 
            This module (Purchases, Suppliers, Audit Ledger, Reports & User Management) is restricted to Administrator personnel.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
          <Lock size={15} className="text-amber-400 shrink-0" />
          <span>Role-Based Access Control (RBAC) enforced</span>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            to="/pos"
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <ShoppingCart size={15} />
            <span>Return to Point of Sale</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
