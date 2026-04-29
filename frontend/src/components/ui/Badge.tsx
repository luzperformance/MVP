import React from 'react';
import { X } from 'lucide-react';

type BadgeVariant =
  | 'default' | 'ativo' | 'inativo'
  | 'novo' | 'contato' | 'qualificado' | 'proposta' | 'convertido' | 'perdido'
  | 'frio' | 'morno' | 'quente'
  | 'normal' | 'baixo' | 'alto' | 'subotimo' | 'acima_otimo'
  | 'success' | 'error' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'badge-default',
  ativo: 'badge-ativo',
  inativo: 'badge-inativo',
  novo: 'badge-novo',
  contato: 'badge-contato',
  qualificado: 'badge-qualificado',
  proposta: 'badge-proposta',
  convertido: 'badge-convertido',
  perdido: 'badge-perdido',
  frio: 'badge-frio',
  morno: 'badge-morno',
  quente: 'badge-quente',
  normal: 'badge-normal',
  baixo: 'badge-baixo',
  alto: 'badge-alto',
  subotimo: 'badge-subotimo',
  acima_otimo: 'badge-acima_otimo',
  /* semantic aliases */
  success: 'badge-convertido',
  error: 'badge-perdido',
  info: 'badge-novo',
};

const Badge = React.memo(function Badge({
  variant = 'default',
  children,
  className = '',
  dot = false,
  removable = false,
  onRemove,
}: BadgeProps) {
  return (
    <span
      className={`badge ${VARIANT_STYLES[variant]} inline-flex items-center gap-1.5 ${className}`.trim()}
      role="status"
    >
      {dot && (
        <span
          className="shrink-0 rounded-full bg-current"
          style={{ width: 6, height: 6 }}
          aria-hidden="true"
        />
      )}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex shrink-0 items-center justify-center rounded-full opacity-60 hover:opacity-100 focus:outline-none"
          aria-label="Remover"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
});

export default Badge;
export type { BadgeProps, BadgeVariant };
