import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-2xl border border-[#E8E8E8] shadow-lg p-8 max-w-lg w-full space-y-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#111111]">Something went wrong</h2>
              <p className="text-sm text-[#6B6B6B]">
                An unexpected runtime error occurred in the application.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left font-mono text-xs text-red-600 overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#C4005A] text-white font-semibold text-sm rounded-lg hover:bg-[#B0004F] transition-all cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-slate-100 text-[#111111] font-semibold text-sm rounded-lg hover:bg-slate-200 transition-all cursor-pointer border border-[#E8E8E8]"
              >
                Clear Local Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
