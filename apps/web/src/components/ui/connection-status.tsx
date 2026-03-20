'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
        if (mounted) setStatus(res.ok ? 'connected' : 'disconnected');
      } catch {
        if (mounted) setStatus('disconnected');
      }
    }

    void check();
    const interval = setInterval(() => void check(), 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (status === 'checking') return null;

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
        <Wifi size={12} />
        <span className="hidden sm:inline">API Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--color-danger)]">
      <WifiOff size={12} />
      <span className="hidden sm:inline">API Offline</span>
    </div>
  );
}
