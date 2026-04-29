import React, { forwardRef } from 'react';

/* ─────────────────────────── Input ─────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelSm?: boolean;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  inputSize?: 'md' | 'sm';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelSm = false,
      error,
      hint,
      iconLeft,
      iconRight,
      inputSize = 'md',
      className = '',
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const sizeClass = inputSize === 'sm' ? 'form-input-sm' : 'form-input';
    const labelClass = labelSm ? 'form-label-sm' : 'form-label';

    const inputClasses = [
      sizeClass,
      !error && 'glass-input',
      error && 'border-danger',
      iconLeft && 'pl-10',
      iconRight && 'pr-10',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="relative">
        {label && (
          <label htmlFor={inputId} className={labelClass}>
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] [&>svg]:w-[18px] [&>svg]:h-[18px]">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...rest}
          />
          {iconRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] [&>svg]:w-[18px] [&>svg]:h-[18px]">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="form-error">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="form-hint">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

/* ─────────────────────────── Textarea ─────────────────────────── */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelSm?: boolean;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  inputSize?: 'md' | 'sm';
  minRows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      labelSm = false,
      error,
      hint,
      iconLeft,
      iconRight,
      inputSize = 'md',
      minRows = 3,
      className = '',
      id,
      ...rest
    },
    ref,
  ) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const sizeClass = inputSize === 'sm' ? 'form-input-sm' : 'form-input';
    const labelClass = labelSm ? 'form-label-sm' : 'form-label';

    const textareaClasses = [
      sizeClass,
      !error && 'glass-input',
      error && 'border-danger',
      iconLeft && 'pl-10',
      iconRight && 'pr-10',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="relative">
        {label && (
          <label htmlFor={textareaId} className={labelClass}>
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute left-3 top-3 pointer-events-none text-[var(--text-secondary)] [&>svg]:w-[18px] [&>svg]:h-[18px]">
              {iconLeft}
            </span>
          )}
          <textarea
            ref={ref}
            id={textareaId}
            className={textareaClasses}
            rows={minRows}
            aria-invalid={!!error}
            aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
            {...rest}
          />
          {iconRight && (
            <span className="absolute right-3 top-3 pointer-events-none text-[var(--text-secondary)] [&>svg]:w-[18px] [&>svg]:h-[18px]">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p id={`${textareaId}-error`} className="form-error">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${textareaId}-hint`} className="form-hint">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Input;