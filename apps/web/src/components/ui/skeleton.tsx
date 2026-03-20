import { clsx } from 'clsx';

type SkeletonProps = {
  className?: string;
  width?: string;
  height?: string;
};

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]',
        'animate-[shimmer_1.5s_ease-in-out_infinite]',
        'bg-[length:200%_100%]',
        'bg-gradient-to-r from-[var(--color-surface-hover)] via-[var(--color-surface-active)] to-[var(--color-surface-hover)]',
        className,
      )}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
      <Skeleton height="12px" width="40%" />
      <Skeleton height="32px" width="60%" />
      <Skeleton height="12px" width="80%" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-[var(--color-border)]/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-3">
          <Skeleton height="16px" width={i === 0 ? '30px' : '80%'} />
        </td>
      ))}
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-9 h-9 !rounded-[var(--radius-md)]" />
        <Skeleton height="10px" width="60px" />
      </div>
      <Skeleton height="28px" width="80px" />
    </div>
  );
}
