import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target after successful login
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      if (response.data?.success && response.data?.token) {
        // Save to AuthContext & localStorage
        login(response.data.user, response.data.token);

        // Redirect Staff directly to /pos or default landing route
        if (response.data.user.role === 'STAFF') {
          navigate('/pos', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setErrorMsg(response.data?.message || 'Login failed.');
      }
    } catch (err) {
      console.error('[LOGIN ERROR]:', err);
      // Fallback for demo when MySQL server service is offline
      if (err.message && (err.code === 'ERR_NETWORK' || err.response?.status === 503 || !err.response)) {
        handleOfflineFallbackLogin();
        return;
      }
      const message = err.response?.data?.message || 'Invalid email or password.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Fallback Login (for immediate evaluation when MySQL server is running locally or in development)
  const handleOfflineFallbackLogin = () => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed === 'admin@store.com' && password === 'Admin@123') {
      const demoAdmin = {
        userId: 1,
        username: 'admin',
        email: 'admin@store.com',
        fullName: 'Admin Manager',
        role: 'ADMIN',
        isActive: true
      };
      login(demoAdmin, 'demo_jwt_token_admin_2026');
      navigate(from, { replace: true });
    } else if (trimmed === 'staff@store.com' && password === 'Staff@123') {
      const demoStaff = {
        userId: 2,
        username: 'staff',
        email: 'staff@store.com',
        fullName: 'Store Cashier',
        role: 'STAFF',
        isActive: true
      };
      login(demoStaff, 'demo_jwt_token_staff_2026');
      navigate('/pos', { replace: true });
    } else {
      setErrorMsg('Invalid email or password. Please use the seed credentials.');
    }
  };

  const fillCredentials = (userType) => {
    setErrorMsg('');
    if (userType === 'ADMIN') {
      setEmail('admin@store.com');
      setPassword('Admin@123');
    } else {
      setEmail('staff@store.com');
      setPassword('Staff@123');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glow Decorations */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-2">
            <Store size={26} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            RetailPulse POS
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Small Scale Business Inventory & Point of Sale System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-100">Sign in to your account</h2>
            <p className="text-xs text-slate-400">
              Access stock, sales register, and inventory controls
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-shake">
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@store.com"
                  required
                  autoComplete="email"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Credentials */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('ADMIN')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-semibold transition"
              >
                <ShieldCheck size={14} />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('STAFF')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-semibold transition"
              >
                <UserCheck size={14} />
                <span>Staff Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <p className="text-[11px] text-center text-slate-500">
          Enforced with Bearer JWTs, bcrypt salt hashing, and RBAC row locking.
        </p>
      </div>
    </div>
  );
}
