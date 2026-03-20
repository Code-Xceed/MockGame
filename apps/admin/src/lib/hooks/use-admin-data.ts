'use client';

import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

function useAdminQuery<T>(path: string): QueryState<T> {
  const { token, isAuthenticated } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    api<T>(path, { token })
      .then((resp) => {
        if (mounted) setData(resp);
      })
      .catch((err: unknown) => {
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Request failed';
          setError(message);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, path, token]);

  return { data, loading, error };
}

export type AdminStats = {
  users: { total: number };
  matches: { total: number; active: number; completed: number; cancelled: number };
  questions: { total: number; active: number };
  antiCheat: { unresolved: number; highSeverity: number };
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  examTrack: string;
  createdAt: string;
  ratings: Array<{
    hiddenMmr: number;
    visibleTier: string;
    matchesPlayed: number;
  }>;
};

export type AdminMatch = {
  id: string;
  examTrack: string;
  status: string;
  playerAScore: number | null;
  playerBScore: number | null;
  createdAt: string;
  playerA: { id: string; displayName: string };
  playerB: { id: string; displayName: string };
};

export type AdminQuestion = {
  id: string;
  examTrack: string;
  subject: string;
  difficulty: string;
  body: string;
  correctOption: string;
  isActive: boolean;
};

export type AntiCheatFlag = {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; displayName: string; email: string } | null;
  match: { id: string; examTrack: string; status: string };
};

type Paginated<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function useAdminStats() {
  return useAdminQuery<AdminStats>('/admin/stats');
}

export function useAdminUsers() {
  return useAdminQuery<Paginated<AdminUser>>('/admin/users');
}

export function useAdminMatches() {
  return useAdminQuery<Paginated<AdminMatch>>('/admin/matches');
}

export function useAdminQuestions() {
  return useAdminQuery<Paginated<AdminQuestion>>('/admin/questions?includeInactive=true');
}

export function useAntiCheatFlags() {
  return useAdminQuery<Paginated<AntiCheatFlag>>('/admin/anti-cheat/flags');
}
