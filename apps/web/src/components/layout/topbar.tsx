'use client';

import { useAuth } from '@/lib/auth';
import { TierBadge } from '@/components/ui/tier-badge';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { useProfile } from '@/lib/hooks/use-profile';
import { formatMmr } from '@/lib/utils';
import { Menu } from 'lucide-react';

type TopbarProps = {
  onMenuClick?: () => void;
  showMenu?: boolean;
};

export function Topbar({ onMenuClick, showMenu }: TopbarProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const activeRating = profile?.ratings?.[0];

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}
        <ConnectionStatus />
      </div>

      <div className="flex items-center gap-4">
        {activeRating && (
          <div className="flex items-center gap-3">
            <TierBadge tier={activeRating.visibleTier} />
            <span className="text-sm font-mono text-[var(--color-text-muted)] hidden sm:inline">
              {formatMmr(activeRating.hiddenMmr)} MMR
            </span>
          </div>
        )}

        <div className="w-px h-6 bg-[var(--color-border)] hidden sm:block" />

        <span className="text-sm font-medium hidden sm:inline">{user?.displayName}</span>
      </div>
    </header>
  );
}
