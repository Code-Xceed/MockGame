'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQueueStore } from '@/lib/stores/queue-store';
import { api, getErrorMessage } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Swords, Loader2 } from 'lucide-react';

const examTrackOptions = [
  { value: 'JEE_MAIN', label: 'JEE Main' },
  { value: 'JEE_ADVANCED', label: 'JEE Advanced' },
  { value: 'BITSAT', label: 'BITSAT' },
];

const subjectOptions = [
  { value: '', label: 'Any Category' },
  { value: 'PHYSICS', label: 'Physics' },
  { value: 'CHEMISTRY', label: 'Chemistry' },
  { value: 'MATHEMATICS', label: 'Mathematics' },
];

const difficultyOptions = [
  { value: '', label: 'Any Difficulty' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const roundTimeOptions = [
  { value: '30', label: '30 sec / round' },
  { value: '45', label: '45 sec / round' },
  { value: '60', label: '60 sec / round' },
];

type QueueSettings = {
  subject: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  roundTimeSeconds: number;
};

type QueueResponse = {
  status: 'QUEUED' | 'MATCH_FOUND';
  examTrack: string;
  match?: { id: string };
  opponentId?: string;
  hiddenMmr?: number;
  settings?: QueueSettings;
};

type QueueStatusResponse = {
  inQueue: boolean;
  examTrack: string | null;
  hiddenMmr: number | null;
  currentMatch: {
    id: string;
    status: 'FOUND' | 'ACTIVE';
    examTrack: string;
    opponentId: string;
    settings?: QueueSettings;
  } | null;
};

export default function PlayPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { state, examTrack, matchId, setExamTrack, setState, matchFound, reset } = useQueueStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [roundTimeSeconds, setRoundTimeSeconds] = useState<'30' | '45' | '60'>('45');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissedMatchIdRef = useRef<string | null>(null);

  const syncFromQueueStatus = useCallback(
    async (silent = true) => {
      if (!token) return;

      try {
        const status = await api<QueueStatusResponse>('/matchmaking/queue/status', { token });

        if (status.examTrack) {
          setExamTrack(status.examTrack);
        }

        if (status.currentMatch?.settings) {
          setSubject(status.currentMatch.settings.subject ?? '');
          setDifficulty(status.currentMatch.settings.difficulty ?? '');
          const seconds = status.currentMatch.settings.roundTimeSeconds;
          if (seconds === 30 || seconds === 45 || seconds === 60) {
            setRoundTimeSeconds(String(seconds) as '30' | '45' | '60');
          }
        }

        if (status.currentMatch?.status === 'FOUND') {
          if (dismissedMatchIdRef.current === status.currentMatch.id) {
            if (state !== 'idle') {
              reset();
            }
            return;
          }

          dismissedMatchIdRef.current = null;
          matchFound(status.currentMatch.id, status.currentMatch.opponentId);
          router.replace(`/play/found/${status.currentMatch.id}`);
          return;
        }

        if (status.currentMatch?.status === 'ACTIVE') {
          if (state !== 'idle') {
            reset();
          }
          router.replace(`/play/live/${status.currentMatch.id}`);
          return;
        }

        if (status.inQueue && state !== 'queuing') {
          setState('queuing');
        }

        if (!status.inQueue && !status.currentMatch && state !== 'idle') {
          reset();
        }
      } catch (err) {
        if (!silent) {
          setError(getErrorMessage(err, 'Failed to sync queue state.'));
        }
      }
    },
    [token, state, setExamTrack, matchFound, router, setState, reset],
  );

  useEffect(() => {
    if (state === 'queuing') {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  useEffect(() => {
    void syncFromQueueStatus(true);
  }, [syncFromQueueStatus]);

  useEffect(() => {
    if (state !== 'queuing') {
      return;
    }

    const interval = setInterval(() => {
      void syncFromQueueStatus(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [state, syncFromQueueStatus]);

  useEffect(() => {
    if (state === 'match_found' && matchId) {
      router.replace(`/play/found/${matchId}`);
    }
  }, [state, matchId, router]);

  async function joinQueue() {
    setError('');
    setLoading(true);
    dismissedMatchIdRef.current = null;

    try {
      const resp = await api<QueueResponse>('/matchmaking/queue/join', {
        method: 'POST',
        token,
        body: {
          examTrack,
          subject: subject || undefined,
          difficulty: difficulty || undefined,
          roundTimeSeconds: Number(roundTimeSeconds),
        },
      });

      if (resp.status === 'MATCH_FOUND' && resp.match) {
        matchFound(resp.match.id, resp.opponentId ?? '');
        router.replace(`/play/found/${resp.match.id}`);
      } else {
        setState('queuing');
        await syncFromQueueStatus(true);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to join queue.'));
    } finally {
      setLoading(false);
    }
  }

  async function leaveQueue() {
    setLoading(true);
    try {
      await api('/matchmaking/queue/leave', {
        method: 'POST',
        token,
        body: { examTrack },
      });
    } catch {
      // UI state should still reset even if network call fails.
    } finally {
      reset();
      setElapsed(0);
      setLoading(false);
    }
  }

  function formatTime(s: number) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Competitive Queue</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Configure match settings, queue up, and move into Found and Live battle stages.
          </p>
        </div>
        <Badge variant="warning">Realtime Matchmaking</Badge>
      </div>

      {state === 'idle' && (
        <Card className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Exam Track"
              options={examTrackOptions}
              value={examTrack}
              onChange={(e) => setExamTrack(e.target.value)}
            />
            <Select
              label="Category"
              options={subjectOptions}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Select
              label="Difficulty"
              options={difficultyOptions}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
            <Select
              label="Round Time"
              options={roundTimeOptions}
              value={roundTimeSeconds}
              onChange={(e) => setRoundTimeSeconds(e.target.value as '30' | '45' | '60')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => void joinQueue()} isLoading={loading}>
              <Swords size={18} />
              Join Queue
            </Button>
            <Badge variant="default">{examTrack.replace('_', ' ')}</Badge>
            <Badge variant="default">{subject || 'Any Category'}</Badge>
            <Badge variant="default">{difficulty || 'Any Difficulty'}</Badge>
            <Badge variant="default">{roundTimeSeconds} sec rounds</Badge>
          </div>

          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        </Card>
      )}

      {state === 'queuing' && (
        <Card className="text-center py-12">
          <div className="max-w-md mx-auto space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center animate-pulse-glow">
              <Loader2 size={32} className="text-[var(--color-primary)] animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Finding Opponent...</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Matching on exam, MMR window, and selected battle settings.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Badge variant="primary">In Queue</Badge>
              <span className="text-2xl font-mono font-bold text-[var(--color-text)]">
                {formatTime(elapsed)}
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <Badge variant="default">{examTrack.replace('_', ' ')}</Badge>
              <Badge variant="default">{subject || 'Any Category'}</Badge>
              <Badge variant="default">{difficulty || 'Any Difficulty'}</Badge>
              <Badge variant="default">{roundTimeSeconds} sec rounds</Badge>
            </div>
            <div>
              <Button variant="secondary" onClick={() => void leaveQueue()} isLoading={loading}>
                Leave Queue
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <h3 className="text-sm font-bold mb-1">1. Configure</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Select exam, category, difficulty and round timer.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-bold mb-1">2. Found Lobby</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Review match details, start or cancel before battle starts.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-bold mb-1">3. Live Battle</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Round-by-round realtime sync for both players with quit handling.
          </p>
        </Card>
      </div>
    </div>
  );
}
