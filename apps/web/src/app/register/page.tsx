'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const examTrackOptions = [
  { value: 'JEE_MAIN', label: 'JEE Main' },
  { value: 'JEE_ADVANCED', label: 'JEE Advanced' },
  { value: 'BITSAT', label: 'BITSAT' },
];

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    examTrack: 'JEE_MAIN',
    timezone: 'Asia/Kolkata',
    region: 'IN',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,var(--color-primary-glow),transparent_70%)] pointer-events-none opacity-30" />

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-[var(--color-text-muted)]">Join the competitive arena</p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-4 p-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <Input
            label="Display Name"
            placeholder="Your battle name"
            value={form.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
            minLength={6}
          />
          <Select
            label="Exam Track"
            options={examTrackOptions}
            value={form.examTrack}
            onChange={(e) => update('examTrack', e.target.value)}
          />

          {error && (
            <div className="text-sm text-[var(--color-danger)] bg-[rgba(225,112,85,0.1)] px-3 py-2 rounded-[var(--radius-md)]">
              {error}
            </div>
          )}

          <Button type="submit" isLoading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--color-primary)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
