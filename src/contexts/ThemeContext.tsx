import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { PaletteMode } from '@mui/material/styles';
import { useData } from './DataContext';

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
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { data, updateSettings } = useData();
  const [systemMode, setSystemMode] = useState<PaletteMode>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  // 派生状态：直接使用 data.settings.darkMode
  const mode = data.settings.darkMode;

  // 计算实际模式（使用 useMemo 避免在 effect 中同步 setState）
  const actualMode = useMemo((): PaletteMode => {
    if (mode === 'auto') {
      return systemMode;
    }
    return mode;
  }, [mode, systemMode]);

  // 监听系统主题变化（仅在 auto 模式下）
  useEffect(() => {
    if (mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        setSystemMode(mediaQuery.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [mode]);

  const setMode = (newMode: 'light' | 'dark' | 'auto') => {
    updateSettings({ darkMode: newMode });
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
        'MiSans',
        '"PingFang SC"',
        '"Microsoft YaHei"',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
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
