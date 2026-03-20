'use client';

import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/hooks/use-profile';
import { Card, CardHeader } from '@/components/ui/card';
import { TierBadge } from '@/components/ui/tier-badge';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const examTrackOptions = [
  { value: 'JEE_MAIN', label: 'JEE Main' },
  { value: 'JEE_ADVANCED', label: 'JEE Advanced' },
  { value: 'BITSAT', label: 'BITSAT' },
];

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    examTrack: 'JEE_MAIN',
    timezone: 'Asia/Kolkata',
    region: 'IN',
  });
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setForm({
      displayName: profile?.displayName ?? '',
      examTrack: profile?.examTrack ?? 'JEE_MAIN',
      timezone: 'Asia/Kolkata',
      region: 'IN',
    });
    setEditing(true);
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await api('/profile/me', { method: 'PATCH', token, body: form });
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* User card */}
      <Card>
        <div className="flex items-start gap-5">
          <Avatar name={user?.displayName ?? 'P'} size="lg" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.displayName}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary">{user?.role}</Badge>
              <Badge>{user?.examTrack?.replace('_', ' ')}</Badge>
            </div>
          </div>
          {!editing && (
            <Button variant="secondary" size="sm" onClick={startEdit}>
              Edit Profile
            </Button>
          )}
        </div>
      </Card>

      {/* Edit form */}
      {editing && (
        <Card>
          <CardHeader title="Edit Profile" />
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={form.displayName}
              onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
            />
            <Select
              label="Exam Track"
              options={examTrackOptions}
              value={form.examTrack}
              onChange={(e) => setForm((p) => ({ ...p, examTrack: e.target.value }))}
            />
            <div className="flex gap-3">
              <Button isLoading={saving} onClick={() => void saveProfile()}>Save Changes</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Ratings */}
      <Card>
        <CardHeader title="Ratings" subtitle="Your ranking across exam tracks" />
        {profile?.ratings && profile.ratings.length > 0 ? (
          <div className="space-y-3">
            {profile.ratings.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]"
              >
                <div className="flex items-center gap-3">
                  <TierBadge tier={r.visibleTier} />
                  <span className="text-sm font-medium">{r.examTrack.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-[var(--color-text-muted)]">
                    {r.hiddenMmr} MMR
                  </span>
                  <span className="text-xs text-[var(--color-text-faint)]">
                    {r.matchesPlayed} matches
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-faint)] py-4 text-center">
            No ratings yet.
          </p>
        )}
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader title="Account" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--color-text-faint)] mb-1">Joined</p>
            <p className="font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-[var(--color-text-faint)] mb-1">User ID</p>
            <p className="font-mono text-xs truncate">{user?.id}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
