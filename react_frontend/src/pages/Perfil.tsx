import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { Button, Divider, TextField } from '@mui/material';
import React from 'react';

import TopBar from '../components/TopBar';
import SuccessSnackbar from '../components/SuccessSnackbar';

export default function Perfil() {
  // Profile fields
  const [email, setEmail] = React.useState('thiago@email.com');
  const [username, setUsername] = React.useState('Thiago Piccoli');
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

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
      <TopBar />

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
