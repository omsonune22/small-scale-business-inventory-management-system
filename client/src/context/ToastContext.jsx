import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    dismiss: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          let badgeStyles = 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/50';
          let IconComponent = Info;
          let iconColor = 'text-indigo-400';

          if (t.type === 'success') {
            badgeStyles = 'bg-slate-900/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40';
            IconComponent = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (t.type === 'error') {
            badgeStyles = 'bg-slate-900/95 border-rose-500/40 text-rose-100 shadow-rose-950/40';
            IconComponent = AlertCircle;
            iconColor = 'text-rose-400';
          } else if (t.type === 'warning') {
            badgeStyles = 'bg-slate-900/95 border-amber-500/40 text-amber-100 shadow-amber-950/40';
            IconComponent = AlertTriangle;
            iconColor = 'text-amber-400';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transform transition-all duration-300 animate-slideUp text-xs font-sans ${badgeStyles}`}
            >
              <IconComponent size={18} className={`shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 pr-1 font-medium leading-relaxed">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
