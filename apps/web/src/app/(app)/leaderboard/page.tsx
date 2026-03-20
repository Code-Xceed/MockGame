'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/lib/hooks/use-leaderboard';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, TierBadge, Avatar, Select, TableRowSkeleton } from '@/components/ui';
import { formatMmr } from '@/lib/utils';

const examTrackOptions = [
  { value: 'JEE_MAIN', label: 'JEE Main' },
  { value: 'JEE_ADVANCED', label: 'JEE Advanced' },
  { value: 'BITSAT', label: 'BITSAT' },
];

export default function LeaderboardPage() {
  const [track, setTrack] = useState('JEE_MAIN');
  const { data: entries, isLoading } = useLeaderboard(track);
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="w-full sm:w-48">
          <Select
            options={examTrackOptions}
            value={track}
            onChange={(e) => setTrack(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader
          title={`Top Players — ${track.replace('_', ' ')}`}
          subtitle="Ranked by hidden MMR"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider w-16">
                  Rank
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider">
                  Player
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider w-28">
                  Tier
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider w-24">
                  MMR
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-[var(--color-text-faint)] uppercase tracking-wider w-24">
                  Matches
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                </>
              ) : !entries || entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[var(--color-text-faint)]">
                    No players ranked yet for this track.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isMe = entry.userId === user?.id;
                  return (
                    <tr
                      key={entry.userId}
                      className={`border-b border-[var(--color-border)]/50 transition-colors hover:bg-[var(--color-surface-hover)] ${isMe ? 'bg-[var(--color-primary-muted)]/30' : ''}`}
                    >
                      <td className="py-3 px-3">
                        <span className={`text-lg font-bold ${entry.rank <= 3 ? 'gradient-text' : 'text-[var(--color-text-muted)]'}`}>
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={entry.displayName} size="sm" />
                          <span className="font-medium">
                            {entry.displayName}
                            {isMe && (
                              <span className="ml-2 text-xs text-[var(--color-primary)]">(you)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <TierBadge tier={entry.visibleTier} />
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        {formatMmr(entry.hiddenMmr)}
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--color-text-muted)]">
                        {entry.matchesPlayed}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
