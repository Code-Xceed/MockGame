'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Admin login failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={(e) => void onSubmit(e)} className="card w-full max-w-sm">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1>Admin Login</h1>
          <p>Sign in with an admin account.</p>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <input
            className="input"
            placeholder="Admin email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error ? <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p> : null}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </main>
  );
}
