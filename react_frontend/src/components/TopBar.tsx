import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { clearSession, getHomePath, getSessionUser } from '../auth';
import { useThemeMode } from '../ThemeContext';

interface TopBarProps {
  username?: string;
}

export default function TopBar({ username = 'Thiago Piccoli' }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionUser = getSessionUser();
  const displayName = sessionUser?.username ?? username;
  const homePath = getHomePath(sessionUser);
  const showBackButton = location.pathname !== homePath;
  const { mode, toggleMode } = useThemeMode();

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar sx={{ gap: 2, minHeight: 88 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {showBackButton && (
            <Button
              onClick={() => navigate(homePath)}
              variant="outlined"
              color="inherit"
              size="large"
              startIcon={<ArrowBackRounded />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'rgba(255,255,255,0.35)',
                bgcolor: 'rgba(255,255,255,0.08)',
                px: 1.8,
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.65)',
                  bgcolor: 'rgba(255,255,255,0.16)',
                },
              }}
            >
              Voltar
            </Button>
          )}

          <Box
            onClick={() => navigate(getHomePath(sessionUser))}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              pl: showBackButton ? 1.5 : 0,
              borderLeft: showBackButton
                ? '1px solid rgba(255,255,255,0.25)'
                : 'none',
              '&:hover': { opacity: 0.9 },
            }}
          >
            <Avatar
              alt="CdTec"
              src="/logo_ufpel.png"
              variant="square"
              sx={{ width: 72, height: 72 }}
            />
            <Box
              component="span"
              sx={{
                fontWeight: 'bold',
                fontSize: '1.35rem',
                color: 'inherit',
                fontFamily: 'sans-serif',
                display: { xs: 'none', sm: 'inline' },
              }}
            >
              Mural Digital
            </Box>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={mode === 'light' ? 'Modo escuro' : 'Modo claro'}>
            <IconButton
              onClick={toggleMode}
              color="inherit"
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.35)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.16)',
                  borderColor: 'rgba(255,255,255,0.65)',
                },
              }}
            >
              {mode === 'light' ? <DarkModeRounded /> : <LightModeRounded />}
            </IconButton>
          </Tooltip>

          <Button
            onClick={() => navigate('/perfil')}
            variant="outlined"
            color="inherit"
            size="large"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'rgba(255,255,255,0.35)',
              bgcolor: 'rgba(255,255,255,0.08)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.65)',
                bgcolor: 'rgba(255,255,255,0.16)',
              },
            }}
          >
            {displayName}
          </Button>

          <Button
            onClick={() => {
              clearSession();
              navigate('/login');
            }}
            variant="contained"
            color="secondary"
            size="large"
            sx={{ textTransform: 'none', fontWeight: 700, px: 2.25 }}
          >
            Sair
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
