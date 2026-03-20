import { create } from 'zustand';

export type QueueState = 'idle' | 'queuing' | 'match_found';

type QueueStore = {
  state: QueueState;
  examTrack: string;
  matchId: string | null;
  opponentId: string | null;
  setState: (s: QueueState) => void;
  setExamTrack: (t: string) => void;
  matchFound: (matchId: string, opponentId: string) => void;
  reset: () => void;
};

export const useQueueStore = create<QueueStore>((set) => ({
  state: 'idle',
  examTrack: 'JEE_MAIN',
  matchId: null,
  opponentId: null,
  setState: (state) => set({ state }),
  setExamTrack: (examTrack) => set({ examTrack }),
  matchFound: (matchId, opponentId) =>
    set({ state: 'match_found', matchId, opponentId }),
  reset: () =>
    set({ state: 'idle', matchId: null, opponentId: null }),
}));
