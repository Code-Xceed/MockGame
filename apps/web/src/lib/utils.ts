/**
 * Utility functions for MockGame frontend
 */

/** Format a tier name for display (e.g., "Bronze" → "🥉 Bronze") */
const tierIcons: Record<string, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  Diamond: '💠',
  Titan: '👑',
};

export function tierIcon(tier: string): string {
  return tierIcons[tier] ?? '🏅';
}

/** Format exam track enum to display (e.g., "JEE_MAIN" → "JEE Main") */
export function formatExamTrack(track: string): string {
  return track
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

/** Format a date to relative time (e.g., "2 hours ago") */
export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return new Date(date).toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/** Format MMR as display string */
export function formatMmr(mmr: number): string {
  return mmr.toLocaleString();
}

/** Truncate a UUID for display */
export function truncateId(id: string, chars = 8): string {
  return `${id.slice(0, chars)}…`;
}

/** cn utility: merge class names (drop-in for clsx) */
export { clsx as cn } from 'clsx';
