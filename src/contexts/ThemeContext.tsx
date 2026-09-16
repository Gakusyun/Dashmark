import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useData } from './DataContext';

type ActualMode = 'light' | 'dark';

interface ThemeContextType {
  mode: 'light' | 'dark' | 'auto';
  actualMode: ActualMode;
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
  const [systemMode, setSystemMode] = useState<ActualMode>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  // 派生状态：直接使用 data.settings.darkMode
  const mode = data.settings.darkMode;

  // 计算实际模式
  const actualMode = useMemo<ActualMode>(() => {
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

  // 同步到 <html> 的 class，供 Tailwind dark: 变体使用
  useEffect(() => {
    const root = document.documentElement;
    if (actualMode === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [actualMode]);

  const setMode = (newMode: 'light' | 'dark' | 'auto') => {
    updateSettings({ darkMode: newMode });
  };

  return (
    <ThemeContext.Provider value={{ mode, actualMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
