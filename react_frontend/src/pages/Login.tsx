import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  getAuthToken,
  getHomePath,
  getSessionUser,
  storeSession,
  type SessionUser,
} from '../auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const token = getAuthToken();
    const user = getSessionUser();

    if (token) {
      navigate(getHomePath(user), { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api('/sessions', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = (await res.json()) as SessionUser & { token: string };
        storeSession(data);
        navigate(getHomePath(data), { replace: true });
      } else {
        setError('Email ou senha inválidos');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: 'background.main',
      }}
    >
      <Box
        component="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          handleLogin();
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: 4,
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: 3,
          width: 360,
        }}
      >
        <Typography variant="h5" textAlign="center">
          Login
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          fullWidth
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          size="medium"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || !email || !password}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </Box>
    </Box>
  );
}
