'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api, getErrorMessage } from '@/lib/api';
import { useMatchDetail } from '@/lib/hooks/use-matches';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { getGameSocket } from '@/lib/socket';
import { useQueueStore } from '@/lib/stores/queue-store';

type RoundAnswer = 'A' | 'B' | 'C' | 'D';

export default function LiveBattlePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const { reset } = useQueueStore();
  const matchId = params.id as string;
  const { data: match, isLoading } = useMatchDetail(matchId);

  const [starting, setStarting] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [submittingRound, setSubmittingRound] = useState<number | null>(null);
  const [answerSelection, setAnswerSelection] = useState<Record<number, RoundAnswer | null>>({});
  const [error, setError] = useState('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const roundSeenAtRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const socket = getGameSocket();
    if (!socket || !matchId) {
      return;
    }

    const join = () => {
      socket.emit('join_match', { matchId });
    };

    const onAbandoned = (payload: { matchId: string }) => {
      if (payload.matchId !== matchId) return;
      reset();
      toast('Battle ended because a player quit.', 'info');
      router.replace('/play');
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    socket.on('battle_abandoned', onAbandoned);

    return () => {
      socket.off('connect', join);
      socket.off('battle_abandoned', onAbandoned);
    };
  }, [matchId, reset, router, toast]);

  const isPlayerA = useMemo(() => match?.playerAId === user?.id, [match?.playerAId, user?.id]);
  const myAnswerField = isPlayerA ? 'playerAAnswer' : 'playerBAnswer';

  const activeRound = useMemo(() => {
    if (!match || match.status !== 'ACTIVE') return null;
    return (
      match.rounds
        .filter((round) => round[myAnswerField] === null)
        .sort((a, b) => a.roundNumber - b.roundNumber)[0] ?? null
    );
  }, [match, myAnswerField]);

  useEffect(() => {
    if (match?.status === 'FOUND') {
      router.replace(`/play/found/${match.id}`);
    }
  }, [match?.status, match?.id, router]);

  useEffect(() => {
    if (!activeRound || !match) return;

    const roundNumber = activeRound.roundNumber;
    if (!roundSeenAtRef.current[roundNumber]) {
      roundSeenAtRef.current[roundNumber] = Date.now();
    }

    const tick = () => {
      const startedAt = roundSeenAtRef.current[roundNumber];
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, match.roundTimeSeconds - elapsed);
      setTimeLeftSeconds(left);
    };

    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [activeRound, match]);

  async function startBattle() {
    if (!token || !match) return;
    setError('');
    setStarting(true);
    try {
      await api(`/battles/${match.id}/start`, {
        method: 'POST',
        token,
        body: {},
      });
      toast('Battle started.', 'success');
      await queryClient.invalidateQueries({ queryKey: ['match', match.id] });
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to start battle.'));
    } finally {
      setStarting(false);
    }
  }

  async function submitAnswer(roundNumber: number) {
    if (!token || !match) return;
    const selected = answerSelection[roundNumber];
    if (!selected) {
      setError('Select an option before submitting.');
      return;
    }

    const startedAt = roundSeenAtRef.current[roundNumber] ?? Date.now();
    const elapsedMs = Date.now() - startedAt;
    const cappedMs = Math.min(match.roundTimeSeconds * 1000, Math.max(0, elapsedMs));

    setError('');
    setSubmittingRound(roundNumber);

    try {
      await api(`/battles/${match.id}/answer`, {
        method: 'POST',
        token,
        body: {
          roundNumber,
          answer: selected,
          timeMs: cappedMs,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['match', match.id] });
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit answer.'));
    } finally {
      setSubmittingRound(null);
    }
  }

  async function quitBattle() {
    if (!token || !match) return;
    setError('');
    setQuitting(true);

    try {
      await api(`/battles/${match.id}/quit`, {
        method: 'POST',
        token,
      });
      reset();
      toast('You left the battle.', 'info');
      router.replace('/play');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to quit battle.'));
    } finally {
      setQuitting(false);
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
        <p className="text-sm text-[var(--color-text-muted)]">Battle not found.</p>
        <Button onClick={() => router.replace('/play')}>Back to Play</Button>
      </Card>
    );
  }

  if (match.status === 'FOUND') {
    return null;
  }

  if (match.status === 'CANCELLED') {
    return (
      <Card>
        <CardHeader title="Battle Cancelled" />
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          This battle was cancelled before completion.
        </p>
        <Button onClick={() => router.replace('/play')}>Return to Play</Button>
      </Card>
    );
  }

  if (match.status === 'COMPLETED') {
    return (
      <Card>
        <CardHeader title="Battle Completed" />
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Final Score: {match.playerAScore ?? 0} - {match.playerBScore ?? 0}
        </p>
        <div className="flex gap-3">
          <Button onClick={() => router.replace('/play')}>Play Again</Button>
          <Button variant="secondary" onClick={() => router.replace(`/matches/${match.id}`)}>
            Open Match Detail
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Live Battle Arena</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Realtime synced battle. If a player quits, both are returned to Play.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="warning">{match.examTrack.replace('_', ' ')}</Badge>
          <Badge variant="default">{match.roundTimeSeconds}s rounds</Badge>
          <Badge variant={match.status === 'ACTIVE' ? 'success' : 'default'}>{match.status}</Badge>
        </div>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </Card>
      ) : null}

      {match.status === 'FOUND' ? (
        <Card>
          <CardHeader title="Battle Control" subtitle="Start when both players are ready" />
          <Button onClick={() => void startBattle()} isLoading={starting}>
            Start Battle
          </Button>
        </Card>
      ) : null}

      {match.status === 'ACTIVE' && activeRound ? (
        <Card glow>
          <CardHeader
            title={`Round ${activeRound.roundNumber} / 3`}
            subtitle="Submit one answer before timer expires"
            action={<Badge variant={timeLeftSeconds <= 10 ? 'warning' : 'default'}>{timeLeftSeconds}s</Badge>}
          />

          <div className="space-y-4">
            <p className="text-sm">{activeRound.question.body}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['A', 'B', 'C', 'D'] as RoundAnswer[]).map((optionKey) => {
                const text = activeRound.question[`option${optionKey}` as const];
                const selected = answerSelection[activeRound.roundNumber] === optionKey;
                return (
                  <button
                    key={optionKey}
                    type="button"
                    className={`text-left px-3 py-2 rounded-[var(--radius-md)] border transition-colors ${
                      selected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-muted)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-subtle)]'
                    }`}
                    onClick={() =>
                      setAnswerSelection((prev) => ({
                        ...prev,
                        [activeRound.roundNumber]: optionKey,
                      }))
                    }
                  >
                    <span className="font-semibold mr-2">{optionKey}.</span>
                    {text}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => void submitAnswer(activeRound.roundNumber)}
                isLoading={submittingRound === activeRound.roundNumber}
              >
                Submit Answer
              </Button>
              <Button variant="secondary" onClick={() => void quitBattle()} isLoading={quitting}>
                Quit Match
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Round Ledger" />
        <div className="space-y-3">
          {match.rounds.map((round) => (
            <div
              key={round.id}
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)]"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">Round {round.roundNumber}</p>
                <Badge variant={round.question.correctOption ? 'success' : 'default'}>
                  {round.question.correctOption ? 'Resolved' : 'Hidden'}
                </Badge>
              </div>
              <p className="text-sm mb-2">{round.question.body}</p>
              <div className="grid md:grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
                <div>
                  A: {round.playerAAnswer ?? '-'} | Correct:{' '}
                  {round.playerACorrect === null ? '-' : round.playerACorrect ? 'Yes' : 'No'} | Time:{' '}
                  {round.playerATimeMs ?? '-'} ms
                </div>
                <div>
                  B: {round.playerBAnswer ?? '-'} | Correct:{' '}
                  {round.playerBCorrect === null ? '-' : round.playerBCorrect ? 'Yes' : 'No'} | Time:{' '}
                  {round.playerBTimeMs ?? '-'} ms
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
