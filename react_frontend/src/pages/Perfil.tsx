import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { Alert, Button, Divider, TextField } from '@mui/material';
import React from 'react';

import TopBar from '../components/TopBar';
import SuccessSnackbar from '../components/SuccessSnackbar';
import { api } from '../api';
import { getSessionUser, updateSessionUser } from '../auth';

export default function Perfil() {
  const user = getSessionUser();

  // Profile fields
  const [email, setEmail] = React.useState(user?.email ?? '');
  const [username, setUsername] = React.useState(user?.username ?? '');
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

  const handleProfileSave = async () => {
    if (!user) {
      return;
    }

    try {
      const res = await api(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ email, username }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const data = (await res.json().catch(() => null)) as {
        user?: { email?: string; username?: string };
      } | null;

      updateSessionUser({
        email: data?.user?.email ?? email,
        username: data?.user?.username ?? username,
      });

      setProfileSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError('');

    if (!user) {
      return;
    }

    try {
      const res = await api(`/change-password/${user.id}`, {
        method: 'POST',
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setPasswordError(data?.message ?? 'Nao foi possivel alterar a senha.');
        return;
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
    } catch {
      setPasswordError('Erro ao conectar com o servidor.');
    }
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
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
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
