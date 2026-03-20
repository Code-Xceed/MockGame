'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────────────── */

type ToastVariant = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

/* ─── Context ──────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const icons = {
    success: <CheckCircle2 size={16} className="text-[var(--color-success)]" />,
    error: <AlertCircle size={16} className="text-[var(--color-danger)]" />,
    info: <Info size={16} className="text-[var(--color-primary)]" />,
  };

  const borderColors = {
    success: 'border-l-[var(--color-success)]',
    error: 'border-l-[var(--color-danger)]',
    info: 'border-l-[var(--color-primary)]',
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-[var(--radius-md)]',
        'bg-[var(--color-surface)] border border-[var(--color-border)] border-l-4',
        'shadow-lg animate-slide-in-left',
        borderColors[toast.variant],
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.variant]}</span>
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
