import React from 'react';

type BadgeVariant =
  | 'default' | 'ativo' | 'inativo'
  | 'novo' | 'contato' | 'qualificado' | 'proposta' | 'convertido' | 'perdido'
  | 'frio' | 'morno' | 'quente'
  | 'normal' | 'baixo' | 'alto' | 'subotimo' | 'acima_otimo';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'badge-novo',
  ativo: 'badge-convertido',
  inativo: 'badge-perdido',
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
};

const Badge = React.memo(function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${VARIANT_STYLES[variant]} ${className}`.trim()} role="status">
      {children}
    </span>
  );
});

export default Badge;
export type { BadgeProps, BadgeVariant };
