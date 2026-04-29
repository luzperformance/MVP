import React from 'react';
import { Plus } from 'lucide-react';

type FABColor = 'primary' | 'white';
type FABSize = 'sm' | 'md' | 'lg';

interface FABProps {
  icon?: React.ReactNode;
  onClick: () => void;
  label?: string;
  color?: FABColor;
  size?: FABSize;
  className?: string;
}

const sizeConfig: Record<FABSize, { circle: string; extended: string; icon: number }> = {
  sm: { circle: 'w-12 h-12', extended: 'min-h-[48px]', icon: 18 },
  md: { circle: 'w-14 h-14', extended: 'min-h-[56px]', icon: 22 },
  lg: { circle: 'w-16 h-16', extended: 'min-h-[64px]', icon: 26 },
};

const FAB = React.memo(
  React.forwardRef<HTMLButtonElement, FABProps>(function FAB(
    { icon, onClick, label, color = 'primary', size = 'md', className = '' },
    ref
  ) {
    const isExtended = !!label;
    const { circle, extended, icon: iconSize } = sizeConfig[size];

    const colorClasses =
      color === 'primary'
        ? 'bg-primary text-primary-content shadow-primary-glow hover:shadow-primary-glow-lg'
        : 'bg-white text-black shadow-white-glow';

    const baseClasses = [
      'fixed bottom-24 right-6 z-30',
      'flex items-center justify-center gap-2',
      'font-semibold text-sm',
      'select-none',
      'transition-all duration-200 ease-out',
      'hover:scale-105',
      'active:scale-95',
      'animate-fade-in',
      'outline-none',
      'focus-visible:ring-2 focus-visible:ring-primary/50',
    ].join(' ');

    const shapeClasses = isExtended
      ? `rounded-full px-8 py-2.5 ${extended}`
      : `${circle} rounded-full`;

    const iconEl = icon ?? <Plus size={iconSize} />;

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={[baseClasses, colorClasses, shapeClasses, className]
          .filter(Boolean)
          .join(' ')}
        aria-label={label ?? 'Action'}
      >
        <span className="shrink-0 flex items-center justify-center">
          {iconEl}
        </span>
        {isExtended && <span>{label}</span>}
      </button>
    );
  })
);

export default FAB;
export type { FABProps, FABColor, FABSize };
