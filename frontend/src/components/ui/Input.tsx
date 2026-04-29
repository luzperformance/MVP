import React from 'react';

/* ─── Input ─── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelSm?: boolean;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  inputSize?: 'md' | 'sm';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, labelSm, error, hint, iconLeft, iconRight, inputSize = 'md', className = '', id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={labelSm ? 'form-label form-label-sm' : 'form-label'}>
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'form-input',
            inputSize === 'sm' ? 'form-input-sm' : '',
            iconLeft ? 'pl-10' : '',
            iconRight ? 'pr-10' : '',
            error ? 'border-danger/50' : '',
          ].filter(Boolean).join(' ')}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            {iconRight}
          </span>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  );
});

/* ─── Textarea ─── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelSm?: boolean;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, labelSm, error, hint, className = '', id, rows = 3, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={labelSm ? 'form-label form-label-sm' : 'form-label'}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={[
          'form-input',
          error ? 'border-danger/50' : '',
        ].filter(Boolean).join(' ')}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  );
});

export default Input;
export { Textarea };
export type { InputProps, TextareaProps };