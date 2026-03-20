'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-[rgba(225,112,85,0.15)] flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-[var(--color-danger)]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <Button onClick={this.handleRetry}>
              <RefreshCw size={16} />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
