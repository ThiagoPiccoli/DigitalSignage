import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TopBar from '../components/TopBar';
import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { SearchRounded, PersonAdd } from '@mui/icons-material';
import React, { useEffect } from 'react';
import TablePagination from '@mui/material/TablePagination';

import DeleteDialog from '../components/DeleteDialog';
import SuccessSnackbar from '../components/SuccessSnackbar';
import { api } from 'api';

type User = {
  id: number;
  email: string;
  username: string;
  isAdmin: boolean;
};

export default function Usuarios() {
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 10;
  const [search, setSearch] = React.useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [newUsername, setNewUsername] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newIsAdmin, setNewIsAdmin] = React.useState(false);
  const [createError, setCreateError] = React.useState('');
  const [createSuccess, setCreateSuccess] = React.useState(false);

  // Delete dialog
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null);
  const [deleteSuccess, setDeleteSuccess] = React.useState(false);

  // Admin reset password dialog
  const [resetUser, setResetUser] = React.useState<User | null>(null);
  const [resetPassword, setResetPassword] = React.useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = React.useState('');
  const [resetError, setResetError] = React.useState('');
  const [resetSuccess, setResetSuccess] = React.useState(false);

  const [users, setUsers] = React.useState<User[]>([]);

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await api('/users', { method: 'GET' });
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = (await res.json()) as { users: User[] };
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateSave = async () => {
    setCreateError('');

    const trimmedEmail = newEmail.trim();
    const trimmedUsername = newUsername.trim();

    if (!trimmedEmail || !trimmedUsername || !newPassword) {
      setCreateError('Preencha nome, email e senha.');
      return;
    }

    const isEmailValid = /^\S+@\S+\.\S+$/.test(trimmedEmail);
    if (!isEmailValid) {
      setCreateError('Email incompleto ou invalido.');
      return;
    }

    if (newPassword.length < 6) {
      setCreateError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const res = await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: trimmedEmail,
          username: trimmedUsername,
          password: newPassword,
          isAdmin: newIsAdmin,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
          errors?: Array<{ message?: string }>;
        } | null;
        const firstError = data?.errors?.[0]?.message;
        setCreateError(
          firstError ?? data?.message ?? 'Falha ao criar usuario.',
        );
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        user?: User;
      } | null;
      if (data?.user) {
        setUsers(prevUsers => [data.user!, ...prevUsers]);
      } else {
        await fetchUsers();
      }

      console.log('User created:', {
        email: newEmail,
        username: newUsername,
        password: newPassword,
        isAdmin: newIsAdmin,
      });

      setCreateOpen(false);
      setNewEmail('');
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setCreateError('');
      setPage(0);
      setCreateSuccess(true);
    } catch (error) {
      console.error('Error creating user:', error);
      setCreateError('Erro ao conectar com o servidor.');
    }
  };

  const handleDeleteConfirm = () => {
    console.log('User deleted:', deleteUser);
    if (!deleteUser) {
      return;
    }

    api(`/users/${deleteUser.id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to delete user');
        }
        setUsers(users.filter(u => u.id !== deleteUser.id));
      })
      .catch(error => {
        console.error('Error deleting user:', error);
      });
    setDeleteUser(null);
    setDeleteSuccess(true);
  };

  const handleResetPassword = async () => {
    setResetError('');

    console.log('Password reset for:', resetUser?.id, 'new:', resetPassword);
    const userId = resetUser?.id;

    if (!userId) {
      return;
    }

    try {
      const res = await api(`/change-password/admin/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          newPassword: resetPassword,
          confirmPassword: resetPasswordConfirm,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setResetError(data?.message ?? 'Falha ao resetar a senha');
        return;
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setResetError('Erro ao conectar com o servidor');
      return;
    }
    setResetUser(null);
    setResetPassword('');
    setResetPasswordConfirm('');
    setResetSuccess(true);
  };

  return (
    <Box>
      <TopBar />

      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Paper
          elevation={10}
          sx={{
            p: 2,
            borderRadius: 3,
            height: '80vh',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextField
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              placeholder="Pesquisar usuários..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                flex: 3,
                '& .MuiOutlinedInput-root': { borderRadius: 8 },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ flex: 1, borderRadius: 2, textTransform: 'none' }}
              startIcon={<PersonAdd />}
              onClick={() => {
                setCreateError('');
                setCreateOpen(true);
              }}
            >
              Novo Usuário
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="users table">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="center">Tipo</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(user => (
                    <TableRow key={user.id}>
                      <TableCell component="th" scope="row">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={user.isAdmin ? 'Admin' : 'Usuário'}
                          color={user.isAdmin ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() => setResetUser(user)}
                        >
                          Alterar Senha
                        </Button>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => setDeleteUser(user)}
                        >
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[]}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
          />
        </Paper>
      </Container>

      {/* Create user dialog */}
      <Dialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError('');
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          {createError && (
            <Chip label={createError} color="error" variant="outlined" />
          )}
          <TextField
            label="Nome de Usuário"
            fullWidth
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={newIsAdmin}
                onChange={(_e, checked) => setNewIsAdmin(checked)}
              />
            }
            label="Administrador"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateOpen(false);
              setCreateError('');
            }}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateSave}
            variant="contained"
            color="primary"
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin reset password dialog */}
      <Dialog
        open={Boolean(resetUser)}
        onClose={() => {
          setResetUser(null);
          setResetError('');
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Resetar Senha — {resetUser?.username}</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          {resetError && (
            <Chip label={resetError} color="error" variant="outlined" />
          )}
          <TextField
            label="Nova Senha"
            type="password"
            fullWidth
            value={resetPassword}
            onChange={e => setResetPassword(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Confirmar Nova Senha"
            type="password"
            fullWidth
            value={resetPasswordConfirm}
            onChange={e => setResetPasswordConfirm(e.target.value)}
            error={
              resetPasswordConfirm.length > 0 &&
              resetPassword !== resetPasswordConfirm
            }
            helperText={
              resetPasswordConfirm.length > 0 &&
              resetPassword !== resetPasswordConfirm
                ? 'As senhas não coincidem'
                : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setResetUser(null);
              setResetError('');
            }}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            color="warning"
            disabled={!resetPassword || resetPassword !== resetPasswordConfirm}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <DeleteDialog
        open={Boolean(deleteUser)}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o usuário "${deleteUser?.username}"?`}
        onCancel={() => setDeleteUser(null)}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Excluir"
        confirmColor="error"
      />

      <SuccessSnackbar
        open={createSuccess}
        onClose={() => setCreateSuccess(false)}
        message="Usuário criado com sucesso!"
      />
      <SuccessSnackbar
        open={deleteSuccess}
        onClose={() => setDeleteSuccess(false)}
        message="Usuário excluído com sucesso!"
      />
      <SuccessSnackbar
        open={resetSuccess}
        onClose={() => setResetSuccess(false)}
        message="Senha resetada com sucesso!"
      />
    </Box>
  );
}
