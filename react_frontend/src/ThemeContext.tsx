import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  toggleMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

const baseOverrides = {
  MuiCssBaseline: {
    styleOverrides: {
      html: { height: '100%', overflow: 'hidden' },
      body: { height: '100%', overflow: 'hidden' },
      '#root': { height: '100%', overflow: 'hidden' },
    },
  },
};

function buildTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return createTheme({
      components: baseOverrides,
      palette: {
        mode: 'dark',
        primary: {
          main: '#42A5F5',
          dark: '#1976D2',
          light: '#90CAF9',
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#2A3444',
          contrastText: '#E0E0E0',
        },
        background: {
          default: '#121212',
          paper: '#1E1E1E',
        },
        text: {
          primary: '#E0E0E0',
          secondary: '#A0A0A0',
        },
        divider: '#333333',
        success: { main: '#2E7D32' },
        error: { main: '#C62828' },
        warning: { main: '#F57F17' },
        info: { main: '#0277BD' },
      },
    });
  }

  return createTheme({
    components: baseOverrides,
    palette: {
      primary: {
        main: '#42A5F5',
        dark: '#1976D2',
        light: '#90CAF9',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#E3EAF2',
        contrastText: '#1A2637',
      },
      background: {
        default: '#EAEEF3',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#1A2637',
        secondary: '#546E7A',
      },
      divider: '#CFD8DC',
      success: { main: '#2E7D32' },
      error: { main: '#C62828' },
      warning: { main: '#F57F17' },
      info: { main: '#0277BD' },
    },
  });
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const toggleMode = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const contextValue = useMemo(() => ({ mode, toggleMode }), [mode]);

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
