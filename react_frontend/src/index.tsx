import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

const theme = createTheme({
  palette: {
    // No 'mode' property — MUI is light by default and stays light always
    primary: {
      main: '#42A5F5', // light blue — AppBar, buttons, active tabs
      dark: '#1976D2', // deeper blue — hover/pressed states
      light: '#90CAF9', // pale blue — highlighted inner surfaces
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E3EAF2', // light gray — search bar, subtle chip backgrounds
      contrastText: '#1A2637',
    },
    background: {
      default: '#EAEEF3', // medium gray — page background
      paper: '#FFFFFF', // white — card / Paper surfaces
    },
    text: {
      primary: '#1A2637', // near-black — main readable text on white
      secondary: '#546E7A', // slate — captions, secondary labels
    },
    divider: '#CFD8DC', // light gray border
    success: { main: '#2E7D32' },
    error: { main: '#C62828' },
    warning: { main: '#F57F17' },
    info: { main: '#0277BD' },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
