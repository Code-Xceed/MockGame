import { clsx } from 'clsx';

type AvatarProps = {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

export function Avatar({ name, className, size = 'md' }: AvatarProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-bold shrink-0',
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: hashColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
