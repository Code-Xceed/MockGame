'use client';

import { useAuth } from '@/lib/auth';
import { useMatches } from '@/lib/hooks/use-matches';
import { Card, CardHeader, Badge, Button } from '@/components/ui';
import { formatExamTrack, timeAgo, truncateId } from '@/lib/utils';
import Link from 'next/link';
import { Calendar, ChevronRight, Swords } from 'lucide-react';

function statusVariant(status: string) {
  switch (status) {
    case 'COMPLETED': return 'success' as const;
    case 'ACTIVE': return 'warning' as const;
    case 'CANCELLED': return 'danger' as const;
    default: return 'default' as const;
  }
}

export default function MatchesPage() {
  const { user } = useAuth();
  const { data: matches, isLoading } = useMatches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Match History</h1>
        <Link href="/play">
          <Button size="sm">
            <Swords size={14} />
            New Match
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader title="Your Matches" subtitle="Recent battles and results" />

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] animate-pulse" />
            ))}
          </div>
        ) : !matches || matches.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--color-text-faint)] mb-4">
              No matches found. Start playing to see your history!
            </p>
            <Link href="/play">
              <Button variant="secondary" size="sm">
                <Swords size={14} />
                Find a Match
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const isPlayerA = match.playerAId === user?.id;
              const opponentId = isPlayerA ? match.playerBId : match.playerAId;

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex items-center justify-between p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant={statusVariant(match.status)}>
                      {match.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        vs <span className="font-mono">{truncateId(opponentId)}</span>
                      </p>
                      <p className="text-xs text-[var(--color-text-faint)]">
                        {formatExamTrack(match.examTrack)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-faint)]">
                      <Calendar size={12} />
                      {timeAgo(match.createdAt)}
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-text-faint)] group-hover:text-[var(--color-text)] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
