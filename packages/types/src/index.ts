export type ExamTrack = 'JEE_MAIN' | 'JEE_ADVANCED' | 'BITSAT';

export interface PlayerIdentity {
  userId: string;
  displayName: string;
  examTrack: ExamTrack;
}

export interface RatingSnapshot {
  hiddenMmr: number;
  visibleTier: string;
  updatedAt: string;
}
