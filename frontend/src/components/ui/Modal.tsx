import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/* ─── Size map ─── */
const SIZE_WIDTHS: Record<ModalSize, string> = {
  sm: '400px',
  md: '480px',
  lg: '560px',
  xl: '640px',
  full: '95vw',
};

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

/* ─── Component ─── */
const Modal = React.memo(function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showCloseButton = true,
  footer,
}: ModalProps) {
  /* Prevent body scroll when open */
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  /* ESC key handler */
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeOnEsc, onClose]);

  /* Backdrop click handler */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose],
  );

  /* Close button handler */
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="glass-panel animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        style={{
          width: '100%',
          maxWidth: SIZE_WIDTHS[size],
          borderRadius: 'var(--border-radius-lg)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '0.5px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'var(--shadow-glass)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        {(title || description || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '20px 24px 0 24px',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && (
                <h2
                  id="modal-title"
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginTop: '4px',
                    lineHeight: 1.5,
                    marginBlockStart: title ? '4px' : undefined,
                  }}
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  minWidth: '32px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '0.5px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* ─── Body ─── */}
        <div
          style={{
            padding: title || description ? '16px 24px' : '24px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
          className="scrollbar-visible"
        >
          {children}
        </div>

        {/* ─── Footer ─── */}
        {footer && (
          <div
            style={{
              borderTop: '0.5px solid var(--glass-border)',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

export default Modal;
export type { ModalProps, ModalSize };