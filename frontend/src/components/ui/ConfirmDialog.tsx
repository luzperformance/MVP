import { useEffect, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import type { ConfirmOptions } from '@/stores/uiStore';

/* ─── Variant config ─── */
const VARIANT_BTN: Record<
  NonNullable<ConfirmOptions['variant']>,
  { className: string; label: string }
> = {
  danger: {
    className: 'btn btn-danger',
    label: 'Excluir',
  },
  warning: {
    className: 'btn',
    label: 'Confirmar',
  },
  info: {
    className: 'btn btn-primary',
    label: 'Confirmar',
  },
};

/* Inline styles for warning-tinted button (no dedicated CSS class) */
const WARNING_BTN_STYLE: React.CSSProperties = {
  background: 'rgba(255, 159, 10, 0.15)',
  color: '#ff9f0a',
  border: '0.5px solid rgba(255, 159, 10, 0.3)',
};

const WARNING_BTN_HOVER_STYLE: React.CSSProperties = {
  background: 'rgba(255, 159, 10, 0.25)',
};

/* ─── Component ─── */
function ConfirmDialog() {
  const confirm = useUIStore((s) => s.confirm);
  const hideConfirm = useUIStore((s) => s.hideConfirm);

  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  /* Reset loading state when dialog changes */
  useEffect(() => {
    setLoading(false);
    setHovered(false);
  }, [confirm]);

  /* ESC key handler */
  useEffect(() => {
    if (!confirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideConfirm();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirm, hideConfirm]);

  /* Backdrop click */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        hideConfirm();
      }
    },
    [hideConfirm],
  );

  /* Confirm handler — supports async */
  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    try {
      const result = confirm.onConfirm();
      if (result instanceof Promise) {
        setLoading(true);
        await result;
      }
    } finally {
      setLoading(false);
      hideConfirm();
    }
  }, [confirm, hideConfirm]);

  if (!confirm) return null;

  const variant = confirm.variant ?? 'info';
  const btnConfig = VARIANT_BTN[variant];

  const confirmBtnStyle =
    variant === 'warning'
      ? { ...WARNING_BTN_STYLE, ...(hovered ? WARNING_BTN_HOVER_STYLE : {}) }
      : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <dialog
        open
        className="glass-panel animate-scale-in"
        style={{
          maxWidth: '384px', /* max-w-sm */
          width: '100%',
          borderRadius: '16px', /* rounded-2xl */
          padding: '24px', /* p-6 */
          border: '0.5px solid rgba(255, 255, 255, 0.1)',
          margin: 0,
          background: 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: 'var(--shadow-glass)',
        }}
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={confirm.description ? 'confirm-dialog-desc' : undefined}
      >
        {/* Title */}
        <h2
          id="confirm-dialog-title"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.4,
          }}
        >
          {confirm.title}
        </h2>

        {/* Description */}
        {confirm.description && (
          <p
            id="confirm-dialog-desc"
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginTop: '8px',
              lineHeight: 1.5,
            }}
          >
            {confirm.description}
          </p>
        )}

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={hideConfirm}
            disabled={loading}
            aria-label={confirm.cancelLabel ?? 'Cancelar'}
          >
            {confirm.cancelLabel ?? 'Cancelar'}
          </button>

          <button
            type="button"
            className={btnConfig.className}
            style={confirmBtnStyle}
            onClick={handleConfirm}
            disabled={loading}
            aria-label={confirm.confirmLabel ?? btnConfig.label}
            onMouseEnter={() => variant === 'warning' && setHovered(true)}
            onMouseLeave={() => variant === 'warning' && setHovered(false)}
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {confirm.confirmLabel ?? btnConfig.label}
          </button>
        </div>
      </dialog>
    </div>
  );
}

export default ConfirmDialog;