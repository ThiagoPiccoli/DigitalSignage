import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Avatar, Button, Divider, TextField } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import PopperMenu from '../components/PopperMenu';
import SuccessSnackbar from '../components/SuccessSnackbar';

export default function Perfil() {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  // Profile fields
  const [email, setEmail] = React.useState('thiago@email.com');
  const [username, setUsername] = React.useState('Thiago Piccoli');
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

  const togglePopper =
    (setter: React.Dispatch<React.SetStateAction<HTMLElement | null>>) =>
    (e: React.MouseEvent<HTMLElement>) =>
      setter(prev => (prev ? null : e.currentTarget));

  const handleProfileSave = () => {
    console.log('Profile updated:', { email, username });
    setProfileSuccess(true);
  };

  const handlePasswordSave = () => {
    console.log('Password changed:', {
      oldPassword,
      newPassword,
      confirmPassword,
    });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(true);
  };

  return (
    <Box>
      <AppBar
        position="sticky"
        sx={{ bgcolor: 'primary.main', display: 'flex' }}
      >
        <Toolbar sx={{ gap: 3 }}>
          <Avatar
            alt="CdTec"
            src="/logo_ufpel.png"
            variant="square"
            sx={{ width: 85, height: 85 }}
          />
          <Typography
            variant="h6"
            fontWeight="bold"
            display="flex"
            flexGrow={1}
            fontFamily="sans-serif"
          >
            Mural Digital
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
            }}
          >
            <Button
              onClick={togglePopper(setMenuAnchor)}
              variant="text"
              color="secondary"
              size="large"
              startIcon={<ArrowDropDownIcon />}
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
              Thiago Piccoli
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 6 }}>
        {/* Profile info */}
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Meus Dados
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <TextField
              label="Nome de Usuário"
              fullWidth
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: 'none', alignSelf: 'flex-end' }}
              onClick={handleProfileSave}
            >
              Salvar
            </Button>
          </Box>
        </Paper>

        {/* Change password */}
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Alterar Senha
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Senha Atual"
              type="password"
              fullWidth
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
            />
            <Divider />
            <TextField
              label="Nova Senha"
              type="password"
              fullWidth
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirmar Nova Senha"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: 'none', alignSelf: 'flex-end' }}
              onClick={handlePasswordSave}
            >
              Alterar Senha
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Popper: user menu */}
      <PopperMenu
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        placement="bottom-end"
        width={140}
        items={[
          { label: 'Perfil', onClick: () => navigate('/perfil') },
          { label: 'Configurações', onClick: () => navigate('/configuracoes') },
          { label: 'Sair', onClick: () => navigate('/login') },
        ]}
      />

      <SuccessSnackbar
        open={profileSuccess}
        onClose={() => setProfileSuccess(false)}
        message="Dados atualizados com sucesso!"
      />
      <SuccessSnackbar
        open={passwordSuccess}
        onClose={() => setPasswordSuccess(false)}
        message="Senha alterada com sucesso!"
      />
    </Box>
  );
}
