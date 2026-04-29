import React, { useCallback } from 'react';
import { XCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '@//stores/uiStore';
import type { ToastVariant } from '@//stores/uiStore';

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<ToastVariant, string> = {
  success: '#34c759',
  error: '#ff3b30',
  warning: '#ff9f0a',
  info: '#007AFF',
};

const ToastItem = React.memo(function ToastItem({
  id, variant, title, description,
}: {
  id: string; variant: ToastVariant; title: string; description?: string;
}) {
  const removeToast = useUIStore((s) => s.removeToast);
  const Icon = ICONS[variant];
  const color = COLORS[variant];

  return (
    <div
      className="glass-panel rounded-2xl p-4 flex gap-3 animate-fade-in-down max-w-[360px] w-full"
      style={{ borderLeft: `3px solid ${color}` }}
      role="alert"
    >
      <Icon size={20} className="shrink-0 mt-0.5" style={{ color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/90 leading-tight">{title}</p>
        {description && (
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(id)}
        className="shrink-0 text-white/30 hover:text-white/60 transition-colors p-0.5"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </div>
  );
});

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}

export function useToast() {
  const addToast = useUIStore((s) => s.addToast);
  return useCallback({
    success: (title: string, description?: string, duration?: number) =>
      addToast({ variant: 'success', title, description, duration }),
    error: (title: string, description?: string, duration?: number) =>
      addToast({ variant: 'error', title, description, duration }),
    warning: (title: string, description?: string, duration?: number) =>
      addToast({ variant: 'warning', title, description, duration }),
    info: (title: string, description?: string, duration?: number) =>
      addToast({ variant: 'info', title, description, duration }),
  }, [addToast]);
}

export default ToastContainer;