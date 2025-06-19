import React, { createContext, useContext } from 'react';
import { THEMES } from '../../shared/constants';

type ThemeName = keyof typeof THEMES;

interface Theme {
  colors: {
    background: string;
    foreground: string;
    border: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    gray: string;
    selection: string;
    cyan: string;
  };
}

const ThemeContext = createContext<Theme | null>(null);

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
};

interface ThemeProviderProps {
  theme: ThemeName;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => {
  const baseTheme = THEMES[theme];
  
  // 추가 색상 정의
  const fullTheme: Theme = {
    colors: {
      ...baseTheme,
      gray: '#808080',
      selection: theme === 'dark' ? '#2d2d30' : '#e0e0e0',
      cyan: '#00bcd4',
    },
  };
  
  return (
    <ThemeContext.Provider value={fullTheme}>
      {children}
    </ThemeContext.Provider>
  );
};