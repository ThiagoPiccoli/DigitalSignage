import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import {
  Alert,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const trimmedEmail = email.trim();
  const trimmedUsername = username.trim();
  const isEmailValid = /^\S+@\S+\.\S+$/.test(trimmedEmail);
  const profileChanged =
    trimmedEmail !== (user?.email ?? '') ||
    trimmedUsername !== (user?.username ?? '');
  const isProfileSaveDisabled =
    !user ||
    !trimmedEmail ||
    !trimmedUsername ||
    !isEmailValid ||
    !profileChanged;

  const isPasswordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isPasswordTooShort = newPassword.length > 0 && newPassword.length < 6;
  const isPasswordSaveDisabled =
    !oldPassword ||
    !newPassword ||
    !confirmPassword ||
    isPasswordMismatch ||
    isPasswordTooShort;

  const getPasswordAdornment = (
    visible: boolean,
    onToggle: () => void,
    label: string,
  ) => (
    <InputAdornment position="end">
      <IconButton edge="end" onClick={onToggle} aria-label={label}>
        {visible ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  const handleProfileSave = async () => {
    if (!user) {
      return;
    }

    try {
      const res = await api(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          email: trimmedEmail,
          username: trimmedUsername,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const data = (await res.json().catch(() => null)) as {
        user?: { email?: string; username?: string };
      } | null;

      updateSessionUser({
        email: data?.user?.email ?? trimmedEmail,
        username: data?.user?.username ?? trimmedUsername,
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
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={email.length > 0 && !isEmailValid}
              helperText={
                email.length > 0 && !isEmailValid
                  ? 'Email incompleto ou inválido.'
                  : 'Obrigatório'
              }
            />
            <TextField
              label="Nome de Usuário"
              fullWidth
              value={username}
              onChange={e => setUsername(e.target.value)}
              helperText="Obrigatório"
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: 'none', alignSelf: 'flex-end' }}
              onClick={handleProfileSave}
              disabled={isProfileSaveDisabled}
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
              type={showOldPassword ? 'text' : 'password'}
              fullWidth
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              helperText="Obrigatório"
              slotProps={{
                input: {
                  endAdornment: getPasswordAdornment(
                    showOldPassword,
                    () => setShowOldPassword(prev => !prev),
                    showOldPassword
                      ? 'Ocultar senha atual'
                      : 'Mostrar senha atual',
                  ),
                },
              }}
            />
            <Divider />
            <TextField
              label="Nova Senha"
              type={showNewPassword ? 'text' : 'password'}
              fullWidth
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              error={isPasswordTooShort}
              helperText={
                isPasswordTooShort
                  ? 'A nova senha deve ter pelo menos 6 caracteres.'
                  : 'Mínimo de 6 caracteres'
              }
              slotProps={{
                input: {
                  endAdornment: getPasswordAdornment(
                    showNewPassword,
                    () => setShowNewPassword(prev => !prev),
                    showNewPassword
                      ? 'Ocultar nova senha'
                      : 'Mostrar nova senha',
                  ),
                },
              }}
            />
            <TextField
              label="Confirmar Nova Senha"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              error={isPasswordMismatch}
              helperText={
                isPasswordMismatch ? 'As senhas não coincidem' : 'Obrigatório'
              }
              slotProps={{
                input: {
                  endAdornment: getPasswordAdornment(
                    showConfirmPassword,
                    () => setShowConfirmPassword(prev => !prev),
                    showConfirmPassword
                      ? 'Ocultar confirmação de senha'
                      : 'Mostrar confirmação de senha',
                  ),
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: 'none', alignSelf: 'flex-end' }}
              onClick={handlePasswordSave}
              disabled={isPasswordSaveDisabled}
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
