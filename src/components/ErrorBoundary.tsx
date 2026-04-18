import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030a07] text-[#4ADE80] font-pixel p-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl text-red-500 mb-4">SYSTEM FAILURE</h1>
          <p className="text-sm mb-8 text-[#A5D6B7]">An unexpected error occurred in the UI layer.</p>
          <pre className="bg-[#0a140f] border border-red-900 p-4 text-left max-w-2xl overflow-auto text-xs text-red-400">
            {this.state.error?.message}
          </pre>
          <button 
            className="mt-8 border border-[#4ADE80] px-4 py-2 hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors"
            onClick={() => window.location.reload()}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
