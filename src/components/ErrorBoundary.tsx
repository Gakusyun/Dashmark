import { Component, type ReactNode } from 'react';
import { ErrorIcon } from './Icons';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，显示友好的错误提示
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary 捕获到错误:', error);
    console.error('错误信息:', errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认的错误 UI
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/40">
            <ErrorIcon size={28} />
          </span>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">出了点问题</h1>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            应用遇到了意外错误。可以尝试重试，如果问题持续存在请刷新页面。
          </p>
          {this.state.error && (
            <p className="max-w-full overflow-auto rounded-lg bg-slate-100 px-3.5 py-2 font-mono text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {this.state.error.message}
            </p>
          )}
          <Button variant="primary" size="lg" className="mt-1" onClick={this.handleRetry}>
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
