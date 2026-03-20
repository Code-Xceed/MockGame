'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api, getErrorMessage } from '@/lib/api';
import { useMatchDetail } from '@/lib/hooks/use-matches';
import { useQueueStore } from '@/lib/stores/queue-store';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function formatEnum(value: string | null) {
  if (!value) return 'Any';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function FoundMatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const { token, user } = useAuth();
  const { data: match, isLoading } = useMatchDetail(matchId);
  const { reset } = useQueueStore();
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const opponent = useMemo(() => {
    if (!match || !user) return null;
    return match.playerAId === user.id ? match.playerB : match.playerA;
  }, [match, user]);

  useEffect(() => {
    if (match?.status === 'ACTIVE') {
      router.replace(`/play/live/${matchId}`);
    }
  }, [match?.status, matchId, router]);

  async function startBattle() {
    if (!token) return;
    setError('');
    setStarting(true);
    try {
      await api(`/battles/${matchId}/start`, {
        method: 'POST',
        token,
        body: {},
      });
      router.replace(`/play/live/${matchId}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to start battle.'));
    } finally {
      setStarting(false);
    }
  }

  async function cancelFoundMatch() {
    if (!token) return;
    setError('');
    setCancelling(true);
    try {
      await api(`/matchmaking/match/${matchId}/dismiss`, {
        method: 'POST',
        token,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to cancel found match.'));
    } finally {
      reset();
      setCancelling(false);
      router.replace('/play');
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">Match lobby not found.</p>
        <Button onClick={() => router.replace('/play')}>Back to Play</Button>
      </Card>
    );
  }

  if (match.status === 'ACTIVE') {
    return null;
  }

  if (match.status !== 'FOUND') {
    return (
      <Card>
        <CardHeader title="Match Not Available" />
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          This found lobby is no longer active.
        </p>
        <Button onClick={() => router.replace('/play')}>Back to Play</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Match Found Lobby</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Review details with your opponent, then start or cancel.
        </p>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Opponent" />
        <div className="space-y-2">
          <p className="font-semibold">{opponent?.displayName ?? 'Opponent'}</p>
          <p className="text-xs text-[var(--color-text-faint)] font-mono">{opponent?.id}</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Match Settings" />
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{formatEnum(match.examTrack)}</Badge>
          <Badge variant="default">Category: {formatEnum(match.preferredSubject)}</Badge>
          <Badge variant="default">Difficulty: {formatEnum(match.preferredDifficulty)}</Badge>
          <Badge variant="default">{match.roundTimeSeconds}s rounds</Badge>
        </div>
      </Card>

      <Card>
        <CardHeader title="Ready Check" subtitle="Both players get realtime updates on actions" />
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void startBattle()} isLoading={starting}>
            Start Match
          </Button>
          <Button variant="secondary" onClick={() => void cancelFoundMatch()} isLoading={cancelling}>
            Cancel Match
          </Button>
        </div>
      </Card>
    </div>
  );
}
