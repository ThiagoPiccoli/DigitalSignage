import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import PopperMenu from './PopperMenu';

interface TopBarProps {
  username?: string;
}

export default function TopBar({ username = 'Thiago Piccoli' }: TopBarProps) {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const toggleMenu = (e: React.MouseEvent<HTMLElement>) =>
    setMenuAnchor(prev => (prev ? null : e.currentTarget));

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box
            onClick={() => navigate('/dashboard')}
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
            onClick={toggleMenu}
            variant="text"
            color="secondary"
            size="large"
            startIcon={<ArrowDropDownIcon />}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            {username}
          </Button>
        </Toolbar>
      </AppBar>

      <PopperMenu
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        placement="bottom-end"
        width={160}
        items={[
          { label: 'Perfil', onClick: () => navigate('/perfil') },
          { label: 'Configurações', onClick: () => navigate('/configuracoes') },
          { label: 'Sair', onClick: () => navigate('/login') },
        ]}
      />
    </>
  );
}
