'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../auth';

export type MatchSummary = {
  id: string;
  examTrack: string;
  status: string;
  preferredSubject: string | null;
  preferredDifficulty: string | null;
  roundTimeSeconds: number;
  playerAId: string;
  playerBId: string;
  winnerId: string | null;
  playerAScore: number | null;
  playerBScore: number | null;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
};

type MatchRound = {
  id: string;
  roundNumber: number;
  playerAAnswer: string | null;
  playerBAnswer: string | null;
  playerACorrect: boolean | null;
  playerBCorrect: boolean | null;
  playerATimeMs: number | null;
  playerBTimeMs: number | null;
  question: {
    id: string;
    body: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string | null;
    subject: string;
    difficulty: string;
  };
};

export type MatchDetail = MatchSummary & {
  playerAMmrBefore: number;
  playerBMmrBefore: number;
  playerA: { id: string; displayName: string; examTrack: string };
  playerB: { id: string; displayName: string; examTrack: string };
  rounds: MatchRound[];
  antiCheat?: {
    unresolvedFlags: number;
  };
};

type MatchListResponse = {
  data: MatchSummary[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function useMatches() {
  const { token, isAuthenticated } = useAuth();

  return useQuery<MatchSummary[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const resp = await api<MatchListResponse>('/matches', { token });
      return resp.data;
    },
    enabled: isAuthenticated,
  });
}

export function useMatchDetail(matchId: string | null) {
  const { token, isAuthenticated } = useAuth();

  return useQuery<MatchDetail>({
    queryKey: ['match', matchId],
    queryFn: () => api<MatchDetail>(`/matches/${matchId}`, { token }),
    enabled: isAuthenticated && !!matchId,
  });
}
