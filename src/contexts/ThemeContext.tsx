import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { PaletteMode } from '@mui/material/styles';

interface ThemeContextType {
  mode: 'light' | 'dark' | 'auto';
  setMode: (mode: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: 'light' | 'dark' | 'auto';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, defaultMode = 'auto' }) => {
  const [mode, setModeState] = useState<'light' | 'dark' | 'auto'>(defaultMode);
  const [actualMode, setActualMode] = useState<PaletteMode>('light');

  // 计算实际模式
  useEffect(() => {
    const calculateActualMode = (): PaletteMode => {
      if (mode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return mode;
    };

    setActualMode(calculateActualMode());

    // 监听系统主题变化
    if (mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => setActualMode(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [mode]);

  const setMode = (newMode: 'light' | 'dark' | 'auto') => {
    setModeState(newMode);
  };

  // MUI 主题配置 - 采用 MUI 设计风格
  const theme = createTheme({
    palette: {
      mode: actualMode,
      primary: {
        main: actualMode === 'dark' ? '#4dabf5' : '#0d6efd',
      },
      background: {
        default: actualMode === 'dark' ? '#121212' : '#ffffff',
        paper: actualMode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: [
        '"PingFang SC"',
        '"Microsoft YaHei"',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            transition: 'box-shadow 200ms ease-in-out',
            '&:hover': {
              boxShadow: 4,
            },
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
