'use client';

import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Swords,
  Trophy,
  History,
  User,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/play', label: 'Play', icon: Swords },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/matches', label: 'Matches', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <aside className="w-[240px] h-full border-r border-[var(--color-border)] bg-[var(--color-bg-subtle)] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--color-border)]">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <span className="text-lg font-bold tracking-tight">MockGame</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary-hover)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-active)] flex items-center justify-center text-xs font-bold">
            {user?.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName ?? 'Player'}</p>
            <p className="text-xs text-[var(--color-text-faint)] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => void handleLogout()}
          className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface)] transition-all w-full cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
