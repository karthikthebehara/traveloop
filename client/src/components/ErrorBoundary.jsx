import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#0b0f17]">
          <div className="max-w-md w-full p-8 rounded-xl bg-[#111827] border border-red-500/30 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred while loading this view.'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1f2937] hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
              >
                <Home size={14} />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
