import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const homeTarget = user?.role === 'STAFF' ? '/pos' : '/';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg text-center space-y-6 p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Compass size={36} className="animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            HTTP 404 ERROR
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            The resource, inventory report, or URL path you requested does not exist or has been relocated within the system.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <ArrowLeft size={15} />
            <span>Go Back</span>
          </button>

          <Link
            to={homeTarget}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            {user?.role === 'STAFF' ? <ShoppingCart size={15} /> : <Home size={15} />}
            <span>{user?.role === 'STAFF' ? 'Return to POS' : 'Return to Dashboard'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
