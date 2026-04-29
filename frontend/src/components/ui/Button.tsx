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

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  outline: 'btn-outline',
  white: 'btn-white',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    fullWidth = false,
    disabled,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  const classes = [
    'btn',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? 'w-full' : '',
    loading ? 'opacity-70' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinner = <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={classes}
      {...rest}
    >
      {loading ? (
        <>
          {spinner}
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && <span className="inline-flex shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
});

export default Button;
export type { ButtonProps, ButtonVariant, ButtonSize };
