import { clsx } from 'clsx';

type TierBadgeProps = {
  tier: string;
  className?: string;
  showLabel?: boolean;
};

const tierConfig: Record<string, { color: string; bg: string; icon: string }> = {
  Bronze:   { color: 'var(--color-tier-bronze)',   bg: 'rgba(205,127,50,0.15)',  icon: '🥉' },
  Silver:   { color: 'var(--color-tier-silver)',   bg: 'rgba(170,178,189,0.15)', icon: '🥈' },
  Gold:     { color: 'var(--color-tier-gold)',     bg: 'rgba(249,202,36,0.15)',  icon: '🥇' },
  Platinum: { color: 'var(--color-tier-platinum)', bg: 'rgba(116,185,255,0.15)', icon: '💎' },
  Diamond:  { color: 'var(--color-tier-diamond)',  bg: 'rgba(162,155,254,0.15)', icon: '💠' },
  Titan:    { color: 'var(--color-tier-titan)',     bg: 'rgba(253,121,168,0.15)', icon: '👑' },
};

export function TierBadge({ tier, className, showLabel = true }: TierBadgeProps) {
  const config = tierConfig[tier] ?? tierConfig.Bronze;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
        className,
      )}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <span>{config.icon}</span>
      {showLabel && tier}
    </span>
  );
}
