'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Swords,
  FileQuestion,
  Shield,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/matches', label: 'Matches', icon: Swords },
  { href: '/questions', label: 'Questions', icon: FileQuestion },
  { href: '/anti-cheat', label: 'Anti-Cheat', icon: AlertTriangle },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--text-muted)' }}>Loading admin session...</p>
      </main>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/dashboard" className="logo">
          <Shield size={18} />
          MockGame
          <span className="badge">ADMIN</span>
        </Link>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(pathname.startsWith(item.href) && 'active')}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '8px' }}>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => {
              void logout().then(() => {
                router.push('/login');
              });
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
