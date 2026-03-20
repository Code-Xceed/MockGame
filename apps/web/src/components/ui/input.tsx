import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-3.5 py-2.5 rounded-[var(--radius-md)]',
            'bg-[var(--color-bg-subtle)] border border-[var(--color-border)]',
            'text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]',
            'outline-none transition-all duration-150',
            'focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-muted)]',
            error && 'border-[var(--color-danger)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
