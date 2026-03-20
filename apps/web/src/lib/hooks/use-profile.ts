'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../auth';

type ProfileData = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  examTrack: string;
  timezone?: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
  ratings: {
    id: string;
    examTrack: string;
    hiddenMmr: number;
    visibleTier: string;
    matchesPlayed: number;
    updatedAt: string;
  }[];
};

export function useProfile() {
  const { token, isAuthenticated } = useAuth();

  return useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => api<ProfileData>('/profile/me', { token }),
    enabled: isAuthenticated,
  });
}
