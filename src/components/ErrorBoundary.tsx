import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

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
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 记录错误到控制台
    console.error('ErrorBoundary 捕获到错误:', error);
    console.error('错误信息:', errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null
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
        <Container
          maxWidth="md"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3
            }}
          >
            <ErrorOutline
              sx={{
                fontSize: 80,
                color: 'error.main'
              }}
            />

            <Typography variant="h4" component="h1" gutterBottom>
              出错了
            </Typography>

            <Typography variant="body1" color="text.secondary">
              应用程序遇到了意外错误。您可以尝试重新加载页面。
            </Typography>

            {this.state.error && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  mt: 2,
                  px: 2,
                  py: 1,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  maxWidth: '100%',
                  overflow: 'auto',
                  textOverflow: 'ellipsis'
                }}
              >
                {this.state.error.message}
              </Typography>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={this.handleRetry}
              sx={{ mt: 2 }}
            >
              重试
            </Button>

            <Typography variant="caption" color="text.secondary">
              如果问题持续存在，请刷新页面或联系技术支持
            </Typography>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
