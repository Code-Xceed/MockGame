import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[0_0_20px_var(--color-primary-glow)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]',
  ghost:
    'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]',
  danger:
    'bg-[var(--color-danger)] text-white hover:brightness-110',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-sm)]',
  md: 'px-4 py-2.5 text-sm rounded-[var(--radius-md)]',
  lg: 'px-6 py-3 text-base rounded-[var(--radius-lg)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
