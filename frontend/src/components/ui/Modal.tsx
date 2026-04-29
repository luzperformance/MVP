import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

const SIZE_WIDTHS: Record<string, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[560px]',
  xl: 'max-w-[640px]',
  full: 'max-w-4xl w-[95vw]',
};

export default function Modal({
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
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const handleBackdrop = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdrop}
    >
      <div
        className={`glass-panel rounded-2xl w-full ${SIZE_WIDTHS[size]} animate-scale-in overflow-hidden`}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 pb-0">
            <div>
              {title && <h2 className="text-lg font-bold text-white/90">{title}</h2>}
              {description && <p className="text-sm text-white/60 mt-1">{description}</p>}
            </div>
            {showCloseButton && (
              <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors p-1" aria-label="Fechar">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-visible">{children}</div>
        {footer && (
          <div className="border-t border-white/[0.06] p-4 flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}