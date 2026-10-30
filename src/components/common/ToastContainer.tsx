import React from 'react';
import { useEmr } from '../../context/EmrContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useEmr();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isWarning = t.type === 'warning';
        const isError = t.type === 'error';
        const isInfo = t.type === 'info';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 flex items-start gap-3 ${
              isSuccess
                ? 'bg-white/95 border-emerald-300 text-slate-900 ring-1 ring-emerald-500/20'
                : isWarning
                ? 'bg-white/95 border-amber-300 text-slate-900 ring-1 ring-amber-500/20'
                : isError
                ? 'bg-white/95 border-rose-300 text-slate-900 ring-1 ring-rose-500/20'
                : 'bg-white/95 border-teal-300 text-slate-900 ring-1 ring-teal-500/20'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {isError && <XCircle className="w-5 h-5 text-rose-600" />}
              {isInfo && <Info className="w-5 h-5 text-teal-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {t.title}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {t.message}
              </div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

