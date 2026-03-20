'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../auth';

type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  hiddenMmr: number;
  visibleTier: string;
  matchesPlayed: number;
  updatedAt: string;
  examTrack: string;
};

export function useLeaderboard(examTrack: string) {
  const { token, isAuthenticated } = useAuth();

  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', examTrack],
    queryFn: () =>
      api<LeaderboardEntry[]>(`/leaderboard/top?examTrack=${examTrack}`, { token }),
    enabled: isAuthenticated,
  });
}
