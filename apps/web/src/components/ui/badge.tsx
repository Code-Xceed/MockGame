import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]',
  primary: 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]',
  success: 'bg-[rgba(0,184,148,0.15)] text-[var(--color-success)]',
  warning: 'bg-[rgba(253,203,110,0.15)] text-[var(--color-warning)]',
  danger: 'bg-[rgba(225,112,85,0.15)] text-[var(--color-danger)]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
