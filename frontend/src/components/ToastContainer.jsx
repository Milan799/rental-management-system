import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Cloud, 
  Info, 
  X, 
  IndianRupee 
} from 'lucide-react';

function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration || 4000;

  useEffect(() => {
    if (isPaused) return;
    const interval = 40;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, duration, isPaused, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
      case 'tenant':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'payment':
        return <IndianRupee className="w-4 h-4 text-emerald-400" />;
      case 'due':
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'cloud':
        return <Cloud className="w-4 h-4 text-sky-400 animate-pulse" />;
      case 'utility':
        return <Zap className="w-4 h-4 text-indigo-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
      case 'payment':
        return 'border-emerald-500/40 shadow-emerald-500/10';
      case 'due':
      case 'alert':
        return 'border-amber-500/40 shadow-amber-500/10';
      case 'cloud':
        return 'border-sky-500/40 shadow-sky-500/10';
      case 'utility':
        return 'border-indigo-500/40 shadow-indigo-500/10';
      default:
        return 'border-slate-200/80 dark:border-white/15';
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
      case 'payment':
        return 'bg-emerald-500';
      case 'due':
      case 'alert':
        return 'bg-amber-500';
      case 'cloud':
        return 'bg-sky-500';
      case 'utility':
        return 'bg-indigo-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative overflow-hidden pointer-events-auto w-full max-w-sm rounded-2xl glass-modal p-3.5 border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 sm:slide-in-from-right-4 ${getBorderColor()}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {toast.title}
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-2">
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5">
        <div
          className={`h-full transition-all linear duration-75 ${getProgressBarColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      aria-live="polite"
      className="fixed top-16 sm:top-20 right-3 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
