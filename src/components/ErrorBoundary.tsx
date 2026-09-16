import { Component, type ReactNode } from 'react';
import { ErrorOutlineIcon } from './Icons';

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
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
          <ErrorOutlineIcon size={80} className="text-red-500" />
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">出错了</h1>
          <p className="text-slate-500 dark:text-slate-400">
            应用程序遇到了意外错误。您可以尝试重新加载页面。
          </p>
          {this.state.error && (
            <p className="max-w-full overflow-auto rounded bg-slate-100 px-4 py-2 font-mono text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-2 rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            重试
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            如果问题持续存在，请刷新页面或联系技术支持
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
