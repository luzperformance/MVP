import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: React.ReactNode;
  tone?: 'default' | 'error';
}

export default function EmptyStateCard({
  icon: Icon,
  title,
  description,
  actions,
  tone = 'default',
}: EmptyStateCardProps) {
  return (
    <div className="card animate-fade-in-up agenda-empty-state">
      <Icon size={48} color={tone === 'error' ? 'var(--luz-danger)' : 'var(--luz-gold)'} aria-hidden />
      <h3 className="exam-section-title">{title}</h3>
      <p style={{ color: 'var(--luz-gray-dark)' }}>{description}</p>
      {actions ? <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}
