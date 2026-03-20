'use client';

import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/hooks/use-profile';
import { useMatches } from '@/lib/hooks/use-matches';
import { Card, CardHeader, Badge, Button, TierBadge, StatCardSkeleton } from '@/components/ui';
import { formatExamTrack, timeAgo, truncateId, formatMmr } from '@/lib/utils';
import Link from 'next/link';
import { Swords, TrendingUp, Target, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: matches, isLoading: matchesLoading } = useMatches();

  const rating = profile?.ratings?.[0];
  const recentMatches = matches?.slice(0, 5) ?? [];
  const totalMatches = rating?.matchesPlayed ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, <span className="gradient-text">{user?.displayName}</span>
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Ready for your next battle?
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {profileLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                  <TrendingUp size={18} className="text-[var(--color-primary)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">MMR</span>
              </div>
              <p className="text-3xl font-bold font-mono">{formatMmr(rating?.hiddenMmr ?? 1200)}</p>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-accent-muted)] flex items-center justify-center">
                  <Target size={18} className="text-[var(--color-accent)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Tier</span>
              </div>
              <div className="mt-1">
                <TierBadge tier={rating?.visibleTier ?? 'Bronze'} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[rgba(253,203,110,0.15)] flex items-center justify-center">
                  <Swords size={18} className="text-[var(--color-warning)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Matches</span>
              </div>
              <p className="text-3xl font-bold font-mono">{totalMatches}</p>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[rgba(0,184,148,0.15)] flex items-center justify-center">
                  <Clock size={18} className="text-[var(--color-success)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Track</span>
              </div>
              <p className="text-lg font-semibold">{formatExamTrack(user?.examTrack ?? 'JEE_MAIN')}</p>
            </Card>
          </>
        )}
      </div>

      {/* Quick play */}
      <Card glow>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-1">Ready to Compete?</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Join the matchmaking queue and battle a real opponent.
            </p>
          </div>
          <Link href="/play">
            <Button size="lg">
              <Swords size={18} />
              Find Match
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent matches */}
      <Card>
        <CardHeader title="Recent Matches" subtitle={`Last ${recentMatches.length} matches`} />
        {matchesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] animate-pulse" />
            ))}
          </div>
        ) : recentMatches.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-text-faint)] mb-3">No matches yet. Start your first battle!</p>
            <Link href="/play">
              <Button variant="secondary" size="sm">
                <Swords size={14} />
                Play Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentMatches.map((match) => {
              const isPlayerA = match.playerAId === user?.id;
              const opponentId = isPlayerA ? match.playerBId : match.playerAId;
              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        match.status === 'COMPLETED' ? 'success'
                        : match.status === 'ACTIVE' ? 'warning'
                        : 'default'
                      }
                    >
                      {match.status}
                    </Badge>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      vs {truncateId(opponentId)}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-faint)]">
                    {timeAgo(match.createdAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
