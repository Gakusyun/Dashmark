import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type ActualMode = 'light' | 'dark';

interface ThemeContextType {
  /** 实际生效的主题（始终跟随系统） */
  actualMode: ActualMode;
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

/**
 * 主题固定跟随系统（prefers-color-scheme），不提供手动切换。
 * 监听系统变化并同步到 <html> 的 .dark class，供 Tailwind dark: 变体使用。
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [systemMode, setSystemMode] = useState<ActualMode>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemMode(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 同步到 <html> 的 class，供 Tailwind dark: 变体使用
  useEffect(() => {
    const root = document.documentElement;
    if (systemMode === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [systemMode]);

  const value = useMemo<ThemeContextType>(() => ({ actualMode: systemMode }), [systemMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
