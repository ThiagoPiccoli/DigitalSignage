import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function Login() {
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
        <TextField label="Email" type="email" fullWidth />
        <TextField label="Senha" type="password" fullWidth />
        <Button size="medium" variant="contained" color="primary" fullWidth>
          Entrar
        </Button>
      </Box>
    </Box>
  );
}
