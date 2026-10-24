import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm,
  onClose,
  loading = false
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  let iconColor = 'text-rose-400';
  let iconBg = 'bg-rose-500/15 border-rose-500/30';
  let confirmBtnClass = 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30';
  let Icon = AlertCircle;

  if (confirmVariant === 'warning') {
    iconColor = 'text-amber-400';
    iconBg = 'bg-amber-500/15 border-amber-500/30';
    confirmBtnClass = 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30';
    Icon = AlertTriangle;
  } else if (confirmVariant === 'primary') {
    iconColor = 'text-indigo-400';
    iconBg = 'bg-indigo-500/15 border-indigo-500/30';
    confirmBtnClass = 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30';
    Icon = HelpCircle;
  }

  return (
    <div 
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4 animate-slideUp font-sans"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${iconBg} ${iconColor}`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Please review before confirming</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Body */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 disabled:opacity-50 ${confirmBtnClass}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
