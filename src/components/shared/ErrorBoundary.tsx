import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TEMPORARY: Loud logging to diagnose production crash
    console.error('========== ERROR BOUNDARY CAUGHT ==========');
    console.error('ERROR MESSAGE:', error?.message);
    console.error('ERROR STACK:', error?.stack);
    console.error('COMPONENT STACK:', errorInfo?.componentStack);
    console.error('============================================');
    // Also show in an alert for visibility
    try {
      const msg = `CRASH: ${error?.message}\n\nStack: ${error?.stack?.slice(0, 500)}`;
      alert(msg);
    } catch {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-100 dark:bg-error-900/20 mb-6">
              <AlertTriangle className="w-8 h-8 text-error-500" />
            </div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
              Something went wrong
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page or go back to home.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-surface-500 cursor-pointer hover:text-surface-700 dark:hover:text-surface-300">
                  Error details
                </summary>
                <pre className="mt-2 p-4 bg-surface-100 dark:bg-surface-800 rounded-lg text-xs overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go Home
              </Button>
              <Button
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple error message component
interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({
  title = 'Error',
  message,
  retry,
}: ErrorMessageProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
      <AlertTriangle className="w-5 h-5 text-error-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-error-800 dark:text-error-200">{title}</p>
        <p className="text-sm text-error-600 dark:text-error-300">{message}</p>
      </div>
      {retry && (
        <Button size="sm" variant="outline" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// Inline error for form fields
export function InlineError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 mt-1 text-sm text-error-500">
      <AlertTriangle className="w-3.5 h-3.5" />
      {message}
    </p>
  );
}
