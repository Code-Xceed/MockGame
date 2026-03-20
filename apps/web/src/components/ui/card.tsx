import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  glow?: boolean;
};

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5',
        'transition-all duration-200',
        glow && 'glow-primary',
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-base font-bold text-[var(--color-text)]">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
