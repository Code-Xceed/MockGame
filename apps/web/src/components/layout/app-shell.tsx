'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out
        lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="lg:ml-[240px]">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          showMenu
        />
        <main className="p-4 md:p-6 max-w-[1200px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
