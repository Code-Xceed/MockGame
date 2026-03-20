import { forwardRef, type SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'w-full px-3.5 py-2.5 rounded-[var(--radius-md)]',
            'bg-[var(--color-bg-subtle)] border border-[var(--color-border)]',
            'text-[var(--color-text)]',
            'outline-none transition-all duration-150',
            'focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-muted)]',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);

Select.displayName = 'Select';
