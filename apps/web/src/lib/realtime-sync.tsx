'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { useAuth } from './auth';
import { useQueueStore } from './stores/queue-store';
import { connectGameSocket, disconnectGameSocket } from './socket';

type MatchFoundEvent = {
  match: { id: string };
  opponentId: string;
};

type BattleEvent = {
  matchId: string;
};

type RoundEvent = {
  matchId: string;
  roundNumber: number;
};

type MatchCancelledEvent = {
  matchId: string;
  cancelledByUserId: string | null;
  reason: 'USER_DISMISSED' | 'REQUEUED' | 'EXPIRED';
  redirectTo?: string;
};

type BattleAbandonedEvent = {
  matchId: string;
  quitterId: string;
  opponentId: string;
  reason: 'PLAYER_QUIT';
  redirectTo?: string;
};

export function RealtimeSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!token || !isAuthenticated) {
      disconnectGameSocket();
      return;
    }

    const socket = connectGameSocket(token);

    const onMatchFound = (payload: MatchFoundEvent) => {
      useQueueStore.getState().matchFound(payload.match.id, payload.opponentId);
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast('Match found. Open Play or Matches to continue.', 'success');
    };

    const onBattleStarted = (payload: BattleEvent) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['matches'] }),
        queryClient.invalidateQueries({ queryKey: ['match', payload.matchId] }),
      ]);
    };

    const onBattleFinished = (payload: BattleEvent) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['matches'] }),
        queryClient.invalidateQueries({ queryKey: ['match', payload.matchId] }),
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
      toast('Battle completed. Stats and rankings updated.', 'info');
    };

    const onRoundResult = (payload: RoundEvent) => {
      void queryClient.invalidateQueries({ queryKey: ['match', payload.matchId] });
    };

    const onMatchCancelled = (payload: MatchCancelledEvent) => {
      const queue = useQueueStore.getState();
      if (queue.matchId === payload.matchId || queue.state !== 'idle') {
        queue.reset();
      }
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast('Match was cancelled. You can queue again.', 'info');

      if (
        payload.redirectTo &&
        typeof window !== 'undefined' &&
        window.location.pathname.includes(payload.matchId)
      ) {
        window.location.assign(payload.redirectTo);
      }
    };

    const onBattleAbandoned = (payload: BattleAbandonedEvent) => {
      const queue = useQueueStore.getState();
      if (queue.state !== 'idle') {
        queue.reset();
      }

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['matches'] }),
        queryClient.invalidateQueries({ queryKey: ['match', payload.matchId] }),
      ]);

      toast('Match ended because a player quit.', 'info');

      if (
        payload.redirectTo &&
        typeof window !== 'undefined' &&
        window.location.pathname.includes(payload.matchId)
      ) {
        window.location.assign(payload.redirectTo);
      }
    };

    socket.on('match_found', onMatchFound);
    socket.on('battle_started', onBattleStarted);
    socket.on('battle_finished', onBattleFinished);
    socket.on('round_result', onRoundResult);
    socket.on('match_cancelled', onMatchCancelled);
    socket.on('battle_abandoned', onBattleAbandoned);

    return () => {
      socket.off('match_found', onMatchFound);
      socket.off('battle_started', onBattleStarted);
      socket.off('battle_finished', onBattleFinished);
      socket.off('round_result', onRoundResult);
      socket.off('match_cancelled', onMatchCancelled);
      socket.off('battle_abandoned', onBattleAbandoned);
    };
  }, [isAuthenticated, token, queryClient, toast]);

  return null;
}
