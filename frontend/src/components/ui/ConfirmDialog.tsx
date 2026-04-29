import React, { useState, useCallback } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useUIStore } from '@//stores/uiStore';

const VARIANT_BTN: Record<string, string> = {
  danger: 'btn btn-danger',
  warning: 'btn bg-warning/15 text-warning border-[0.5px] border-warning/30 hover:bg-warning/25',
  info: 'btn btn-primary',
};

const VARIANT_ICON: Record<string, React.ElementType> = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: AlertTriangle,
};

export default function ConfirmDialog() {
  const confirm = useUIStore((s) => s.confirm);
  const hideConfirm = useUIStore((s) => s.hideConfirm);
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    setLoading(true);
    try {
      await confirm.onConfirm();
    } finally {
      setLoading(false);
      hideConfirm();
    }
  }, [confirm, hideConfirm]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) hideConfirm();
  }, [hideConfirm]);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') hideConfirm();
  }, [hideConfirm]);

  React.useEffect(() => {
    if (confirm) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [confirm, handleEsc]);

  if (!confirm) return null;

  const variant = confirm.variant || 'info';
  const Icon = VARIANT_ICON[variant] || AlertTriangle;
  const confirmLabel = confirm.confirmLabel || (variant === 'danger' ? 'Excluir' : 'Confirmar');
  const cancelLabel = confirm.cancelLabel || 'Cancelar';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
      onClick={handleBackdrop}
      role="presentation"
    >
      <div
        className="glass-panel rounded-2xl p-6 w-full max-w-sm animate-scale-in"
        role="dialog"
        aria-modal
        aria-labelledby="confirm-title"
        aria-describedby={confirm.description ? 'confirm-desc' : undefined}
      >
        <div className="flex items-start gap-3 mb-4">
          <Icon size={20} className="text-white/40 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 id="confirm-title" className="text-lg font-bold text-white/90">{confirm.title}</h3>
            {confirm.description && (
              <p id="confirm-desc" className="text-sm text-white/60 mt-1">{confirm.description}</p>
            )}
          </div>
          <button onClick={hideConfirm} className="text-white/30 hover:text-white/60 transition-colors p-1" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={hideConfirm} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={VARIANT_BTN[variant] || VARIANT_BTN.info}
            onClick={handleConfirm}
            disabled={loading}
            aria-label={confirmLabel}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}