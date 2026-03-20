import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <p className="text-6xl font-bold gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-all shadow-[0_0_20px_var(--color-primary-glow)]"
        >
          <Home size={18} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
