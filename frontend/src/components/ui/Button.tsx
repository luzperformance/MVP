import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'white';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    fullWidth = false,
    className = '',
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';

  return (
    <button
      ref={ref}
      type={type}
      className={[
        'btn',
        variantClass,
        sizeClass,
        fullWidth ? 'w-full' : '',
        loading ? 'opacity-70' : '',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin shrink-0" />}
      {!loading && icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
});

export default Button;
export type { ButtonProps, ButtonVariant, ButtonSize };