/**
 * AgentErrorBoundary — Graceful error handling for agent operations
 *
 * Catches rendering errors in agent-related UI and shows a recovery panel
 * instead of crashing the entire Creator Studio.
 */

import React, { type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AgentErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[OpenSaga Agent Error]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">Agent Error</h3>
            <p className="text-xs text-text-tertiary mt-1 max-w-sm">
              {this.props.fallbackMessage || 'Something went wrong with the AI agent. This won\'t affect your saved data.'}
            </p>
            {this.state.error && (
              <p className="text-[10px] text-red-400/70 mt-2 font-mono max-w-sm truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary hover:border-accent-primary/50 transition-colors"
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
