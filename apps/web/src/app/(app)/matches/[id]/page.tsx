'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api, getErrorMessage } from '@/lib/api';
import { useMatchDetail } from '@/lib/hooks/use-matches';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getGameSocket } from '@/lib/socket';

type RoundAnswer = 'A' | 'B' | 'C' | 'D';

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const { data: match, isLoading } = useMatchDetail(matchId);

  const [starting, setStarting] = useState(false);
  const [submittingRound, setSubmittingRound] = useState<number | null>(null);
  const [answerSelection, setAnswerSelection] = useState<Record<number, RoundAnswer | null>>({});
  const [error, setError] = useState('');
  const roundSeenAtRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const socket = getGameSocket();
    if (!socket || !matchId) {
      return;
    }

    const join = () => {
      socket.emit('join_match', { matchId });
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    return () => {
      socket.off('connect', join);
    };
  }, [matchId]);

  const isPlayerA = useMemo(() => match?.playerAId === user?.id, [match?.playerAId, user?.id]);
  const myAnswerField = isPlayerA ? 'playerAAnswer' : 'playerBAnswer';

  const activeRound = useMemo(() => {
    if (!match) return null;
    return (
      match.rounds
        .filter((round) => round[myAnswerField] === null)
        .sort((a, b) => a.roundNumber - b.roundNumber)[0] ?? null
    );
  }, [match, myAnswerField]);

  useEffect(() => {
    if (!activeRound) return;
    if (!roundSeenAtRef.current[activeRound.roundNumber]) {
      roundSeenAtRef.current[activeRound.roundNumber] = Date.now();
    }
  }, [activeRound]);

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
      toast('Battle started. Round 1 is live.', 'success');
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
    const timeMs = Math.max(0, Date.now() - startedAt);

    setError('');
    setSubmittingRound(roundNumber);

    try {
      await api(`/battles/${match.id}/answer`, {
        method: 'POST',
        token,
        body: {
          roundNumber,
          answer: selected,
          timeMs,
        },
      });
      toast(`Round ${roundNumber} answer submitted.`, 'success');
      await queryClient.invalidateQueries({ queryKey: ['match', match.id] });
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit answer.'));
    } finally {
      setSubmittingRound(null);
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
      <div className="text-center py-20">
        <p className="text-[var(--color-text-muted)]">Match not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/matches">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} /> Back to Matches
        </Button>
      </Link>

      <h1 className="text-2xl font-bold">Match Detail</h1>

      {error ? (
        <Card>
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title={`Match #${match.id.slice(0, 8)}`}
          action={
            <Badge
              variant={
                match.status === 'COMPLETED'
                  ? 'success'
                  : match.status === 'ACTIVE'
                    ? 'warning'
                    : 'default'
              }
            >
              {match.status}
            </Badge>
          }
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div
            className={`p-4 rounded-[var(--radius-md)] border ${
              isPlayerA
                ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary-muted)]/20'
                : 'border-[var(--color-border)] bg-[var(--color-bg-subtle)]'
            }`}
          >
            <p className="text-xs text-[var(--color-text-faint)] uppercase tracking-wider mb-2">
              Player A {isPlayerA && '(You)'}
            </p>
            <p className="font-mono text-sm mb-1">{match.playerAId}</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              MMR Before:{' '}
              <span className="font-mono font-semibold text-[var(--color-text)]">
                {match.playerAMmrBefore}
              </span>
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Score:{' '}
              <span className="font-mono font-semibold text-[var(--color-text)]">
                {match.playerAScore ?? '-'}
              </span>
            </p>
          </div>

          <div
            className={`p-4 rounded-[var(--radius-md)] border ${
              !isPlayerA
                ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary-muted)]/20'
                : 'border-[var(--color-border)] bg-[var(--color-bg-subtle)]'
            }`}
          >
            <p className="text-xs text-[var(--color-text-faint)] uppercase tracking-wider mb-2">
              Player B {!isPlayerA && '(You)'}
            </p>
            <p className="font-mono text-sm mb-1">{match.playerBId}</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              MMR Before:{' '}
              <span className="font-mono font-semibold text-[var(--color-text)]">
                {match.playerBMmrBefore}
              </span>
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Score:{' '}
              <span className="font-mono font-semibold text-[var(--color-text)]">
                {match.playerBScore ?? '-'}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {match.status === 'FOUND' ? (
        <Card>
          <CardHeader title="Battle Control" subtitle="Start match to begin round flow" />
          <Button onClick={() => void startBattle()} isLoading={starting}>
            Start Battle
          </Button>
        </Card>
      ) : null}

      {match.status === 'ACTIVE' && activeRound ? (
        <Card glow>
          <CardHeader
            title={`Live Round ${activeRound.roundNumber}`}
            subtitle="Server-authoritative scoring is active"
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

            <div className="flex gap-3">
              <Button
                onClick={() => void submitAnswer(activeRound.roundNumber)}
                isLoading={submittingRound === activeRound.roundNumber}
              >
                Submit Answer
              </Button>
              <p className="text-xs text-[var(--color-text-faint)] self-center">
                Submit once. Server records timing and correctness.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Rounds" subtitle="Authoritative round ledger" />
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
                  {round.playerACorrect === null ? '-' : round.playerACorrect ? 'Yes' : 'No'} |{' '}
                  Time: {round.playerATimeMs ?? '-'} ms
                </div>
                <div>
                  B: {round.playerBAnswer ?? '-'} | Correct:{' '}
                  {round.playerBCorrect === null ? '-' : round.playerBCorrect ? 'Yes' : 'No'} |{' '}
                  Time: {round.playerBTimeMs ?? '-'} ms
                </div>
              </div>
              {round.question.correctOption ? (
                <p className="mt-2 text-xs">
                  Correct Option: <span className="font-semibold">{round.question.correctOption}</span>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {match.antiCheat ? (
        <Card>
          <CardHeader title="Integrity Signals" />
          <p className="text-sm text-[var(--color-text-muted)]">
            Unresolved anti-cheat flags for this match: {match.antiCheat.unresolvedFlags}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
