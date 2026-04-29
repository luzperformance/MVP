import React, { useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUIStore, type Toast as ToastType, type ToastVariant } from '@/stores/uiStore';

/* ─── Variant Config ─── */

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: LucideIcon; accent: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, accent: 'var(--success)', iconColor: 'var(--success)' },
  error:   { icon: XCircle,      accent: 'var(--danger)',  iconColor: 'var(--danger)' },
  warning: { icon: AlertTriangle, accent: 'var(--warning)', iconColor: 'var(--warning)' },
  info:    { icon: Info,          accent: 'var(--info)',    iconColor: 'var(--info)' },
};

/* ─── Toast Item ─── */

interface ToastItemProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const ToastItem = React.memo(function ToastItem({ toast, onClose }: ToastItemProps) {
  const { id, variant, title, description } = toast;
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handleClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  return (
    <div
      className="animate-fade-in-down"
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '0.5px solid rgba(255, 255, 255, 0.1)',
        borderLeft: `3px solid ${config.accent}`,
        borderRadius: 'var(--border-radius)',
        padding: '14px 16px',
        position: 'relative',
        minWidth: 0,
        boxShadow: 'var(--shadow-glass)',
        transition: 'var(--transition)',
      }}
    >
      {/* Icon */}
      <Icon size={18} className="toast-icon" style={{ color: config.iconColor, flexShrink: 0, marginTop: 1 }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            paddingRight: 20,
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginTop: 2,
            }}
          >
            {description}
          </div>
        )}
      </div>

      {/* Close */}
      <button
        onClick={handleClose}
        aria-label="Fechar notificação"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: 2,
          borderRadius: 'var(--border-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          top: 10,
          right: 10,
          transition: 'var(--transition)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)';
          (e.currentTarget as HTMLButtonElement).style.background = 'none';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
});

/* ─── Toast Container ─── */

function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      aria-live="polite"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}

/* ─── useToast Hook ─── */

interface UseToastReturn {
  success: (title: string, description?: string, duration?: number) => void;
  error:   (title: string, description?: string, duration?: number) => void;
  warning: (title: string, description?: string, duration?: number) => void;
  info:    (title: string, description?: string, duration?: number) => void;
}

function useToast(): UseToastReturn {
  const addToast = useUIStore((s) => s.addToast);

  const create = useCallback(
    (variant: ToastVariant) =>
      (title: string, description?: string, duration?: number) => {
        addToast({ variant, title, ...(description && { description }), ...(duration != null && { duration }) });
      },
    [addToast],
  );

  return {
    success: create('success'),
    error:   create('error'),
    warning: create('warning'),
    info:    create('info'),
  };
}

/* ─── Exports ─── */

export default ToastContainer;
export { ToastItem, useToast };
export type { ToastItemProps, UseToastReturn };
