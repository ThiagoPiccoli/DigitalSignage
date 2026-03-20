import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { clearSession, getHomePath, getSessionUser } from '../auth';

interface TopBarProps {
  username?: string;
}

export default function TopBar({ username = 'Thiago Piccoli' }: TopBarProps) {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const displayName = sessionUser?.username ?? username;

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Box
          onClick={() => navigate(getHomePath(sessionUser))}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            '&:hover': { opacity: 0.85 },
          }}
        >
          <Avatar
            alt="CdTec"
            src="/logo_ufpel.png"
            variant="square"
            sx={{ width: 85, height: 85 }}
          />
          <Box
            component="span"
            sx={{
              fontWeight: 'bold',
              fontSize: '1.5rem',
              color: 'inherit',
              fontFamily: 'sans-serif',
            }}
          >
            Mural Digital
          </Box>
        </Box>

        <div style={{ flexGrow: 1 }} />

        <Button
          onClick={() => navigate('/perfil')}
          variant="outlined"
          color="inherit"
          size="large"
          sx={{
            textTransform: 'none',
            fontWeight: 'bold',
            borderColor: 'white',
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
          sx={{ textTransform: 'none', fontWeight: 'bold' }}
        >
          Sair
        </Button>
      </Toolbar>
    </AppBar>
  );
}
