import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => {
        const getIcon = () => {
          switch (notif.type) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            case 'error':
              return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
            default:
              return <Info className="w-5 h-5 text-indigo-600 shrink-0" />;
          }
        };

        const getBorder = () => {
          switch (notif.type) {
            case 'success':
              return 'border-emerald-200 bg-white/95 text-slate-900';
            case 'error':
              return 'border-rose-200 bg-white/95 text-slate-900';
            case 'warning':
              return 'border-amber-200 bg-white/95 text-slate-900';
            default:
              return 'border-indigo-200 bg-white/95 text-slate-900';
          }
        };

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-lg backdrop-blur-md flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200 ${getBorder()}`}
          >
            <div className="flex items-start gap-3">
              {getIcon()}
              <div>
                <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{notif.message}</p>
              </div>
            </div>

            <button
              onClick={() => removeNotification(notif.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
