import React from 'react';
import { useToast } from '../../hooks/useToast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Toast Notification Stack displaying floating alerts
 */
const Toast = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-50/90 text-emerald-950';
      case 'error':
        return 'border-red-500/30 bg-red-50/90 text-red-950';
      case 'warning':
        return 'border-amber-500/30 bg-amber-50/90 text-amber-950';
      default:
        return 'border-blue-500/30 bg-blue-50/90 text-blue-950';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md animate-slide-up transition-all ${getBorderColor(
            t.type
          )}`}
        >
          <div className="flex items-start gap-3">
            {getIcon(t.type)}
            <div>
              <h4 className="text-sm font-semibold tracking-tight">{t.title}</h4>
              {t.message && <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{t.message}</p>}
            </div>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="p-1 rounded-full hover:bg-black/5 opacity-70 hover:opacity-100 transition-all shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
