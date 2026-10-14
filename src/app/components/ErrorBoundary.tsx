"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Peaky ErrorBoundary caught unhandled error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none font-sans">
          <div className="w-[320px] bg-black text-white rounded-b-[20px] border-b border-x border-rose-500/30 p-3 shadow-lg shadow-rose-950/20 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Peaky recovered from an error</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono text-center max-w-[280px] truncate">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
            >
              Reload Notch
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
