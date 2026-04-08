import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <Icon size={20} color="var(--luz-gold)" aria-hidden />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-display page-header-title">{title}</div>
        {subtitle ? <div className="page-header-subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}
