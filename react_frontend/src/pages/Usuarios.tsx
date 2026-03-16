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
import React from 'react';
import TablePagination from '@mui/material/TablePagination';

import DeleteDialog from '../components/DeleteDialog';
import SuccessSnackbar from '../components/SuccessSnackbar';

type User = {
  id: number;
  email: string;
  username: string;
  isAdmin: boolean;
};

const MOCK_USERS: User[] = [
  {
    id: 1,
    email: 'thiago@email.com',
    username: 'Thiago Piccoli',
    isAdmin: true,
  },
  { id: 2, email: 'joao@email.com', username: 'João Silva', isAdmin: false },
  { id: 3, email: 'maria@email.com', username: 'Maria Souza', isAdmin: false },
];

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
  const [createSuccess, setCreateSuccess] = React.useState(false);

  // Edit dialog
  const [editUser, setEditUser] = React.useState<User | null>(null);
  const [editEmail, setEditEmail] = React.useState('');
  const [editUsername, setEditUsername] = React.useState('');
  const [editSuccess, setEditSuccess] = React.useState(false);

  // Delete dialog
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null);
  const [deleteSuccess, setDeleteSuccess] = React.useState(false);

  // Admin reset password dialog
  const [resetUser, setResetUser] = React.useState<User | null>(null);
  const [resetPassword, setResetPassword] = React.useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = React.useState('');
  const [resetSuccess, setResetSuccess] = React.useState(false);

  const filteredUsers = MOCK_USERS.filter(
    u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenEdit = (user: User) => {
    setEditUser(user);
    setEditEmail(user.email);
    setEditUsername(user.username);
  };

  const handleEditSave = () => {
    console.log('User updated:', {
      id: editUser?.id,
      email: editEmail,
      username: editUsername,
    });
    setEditUser(null);
    setEditSuccess(true);
  };

  const handleCreateSave = () => {
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
    setCreateSuccess(true);
  };

  const handleDeleteConfirm = () => {
    console.log('User deleted:', deleteUser);
    setDeleteUser(null);
    setDeleteSuccess(true);
  };

  const handleResetSave = () => {
    console.log('Password reset for:', resetUser?.id, 'new:', resetPassword);
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
              onClick={() => setCreateOpen(true)}
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
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEdit(user)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() => setResetUser(user)}
                        >
                          Resetar Senha
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
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
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
          <Button onClick={() => setCreateOpen(false)} color="inherit">
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

      {/* Edit user dialog */}
      <Dialog
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <TextField
            label="Nome de Usuário"
            fullWidth
            value={editUsername}
            onChange={e => setEditUsername(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={editEmail}
            onChange={e => setEditEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin reset password dialog */}
      <Dialog
        open={Boolean(resetUser)}
        onClose={() => setResetUser(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Resetar Senha — {resetUser?.username}</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
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
          <Button onClick={() => setResetUser(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleResetSave}
            variant="contained"
            color="warning"
            disabled={!resetPassword || resetPassword !== resetPasswordConfirm}
          >
            Resetar
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
        open={editSuccess}
        onClose={() => setEditSuccess(false)}
        message="Usuário atualizado com sucesso!"
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
