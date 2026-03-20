'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Glow background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,var(--color-primary-glow),transparent_70%)] pointer-events-none opacity-30" />

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-[var(--color-text-muted)]">Sign in to continue competing</p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-4 p-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="text-sm text-[var(--color-danger)] bg-[rgba(225,112,85,0.1)] px-3 py-2 rounded-[var(--radius-md)]">
              {error}
            </div>
          )}

          <Button type="submit" isLoading={loading} className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[var(--color-primary)] hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
