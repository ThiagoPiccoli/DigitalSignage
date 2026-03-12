import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import {
  Button,
  ButtonGroup,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { FileUpload, SearchRounded } from '@mui/icons-material';
import React from 'react';
import TablePagination from '@mui/material/TablePagination';
import TopBar from '../components/TopBar';
import EditDialog, { type Row } from '../components/EditDialog';
import DeleteDialog from '../components/DeleteDialog';
import SuccessSnackbar from '../components/SuccessSnackbar';
import PopperMenu from '../components/PopperMenu';
import AvisoDialog, { type AvisoRow } from '../components/AvisoDialog';
import ContadorDialog, { type ContadorRow } from '../components/ContadorDialog';
import MediaUploadDialog, {
  type MediaUploadData,
} from '../components/MediaUploadDialog';

const MOCK_ROWS: Row[] = [
  {
    nome: 'Comunicado Importante',
    tipo: 'Aviso',
    data: '2026-03-06',
    criador: 'Thiago',
  },
  {
    nome: 'Prazo do Projeto',
    tipo: 'Contador',
    data: '2026-03-06',
    criador: 'Thiago',
  },
  { nome: 'Donut', tipo: 'Vídeo', data: '2026-03-05', criador: 'João' },
  { nome: 'Éclair', tipo: 'Imagem', data: '2026-03-04', criador: 'Maria' },
];

const FILTER_OPTIONS = [
  { label: 'Todos os Avisos', value: 'todos' },
  { label: 'Avisos', value: 'aviso' },
  { label: 'Contadores', value: 'contador' },
  { label: 'Vídeos', value: 'vídeo' },
  { label: 'Imagens', value: 'imagem' },
] as const;

export default function Dashboard() {
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 10;

  const [editRow, setEditRow] = React.useState<Row | null>(null);
  const [deleteRow, setDeleteRow] = React.useState<Row | null>(null);
  const [editSuccess, setEditSuccess] = React.useState(false);
  const [deleteSuccess, setDeleteSuccess] = React.useState(false);
  const [filter, setFilter] = React.useState<string>('todos');
  const [fileTypeAnchor, setFileTypeAnchor] =
    React.useState<null | HTMLElement>(null);
  const [search, setSearch] = React.useState('');

  // Aviso dialog state
  const [aviso, setAviso] = React.useState<AvisoRow | null>(null);
  const [avisoSuccess, setAvisoSuccess] = React.useState(false);

  // Contador dialog state
  const [contador, setContador] = React.useState<ContadorRow | null>(null);
  const [contadorSuccess, setContadorSuccess] = React.useState(false);

  // Media upload dialogs
  const [uploadType, setUploadType] = React.useState<'video' | 'image' | null>(
    null,
  );
  const [uploadSuccess, setUploadSuccess] = React.useState(false);

  const filteredRows = MOCK_ROWS.filter(
    r => filter === 'todos' || r.tipo.toLowerCase() === filter,
  ).filter(r => r.nome.toLowerCase().includes(search.toLowerCase()));

  const togglePopper =
    (setter: React.Dispatch<React.SetStateAction<HTMLElement | null>>) =>
    (e: React.MouseEvent<HTMLElement>) =>
      setter(prev => (prev ? null : e.currentTarget));

  const handleEditSave = (values: Row) => {
    console.log('Saved:', values);
    setEditRow(null);
    setEditSuccess(true);
  };

  const handleDeleteConfirm = () => {
    console.log('Deleted:', deleteRow);
    setDeleteRow(null);
    setDeleteSuccess(true);
  };

  const handleAvisoSave = (values: AvisoRow) => {
    console.log('Aviso Create:', values);
    setAviso(null);
    setAvisoSuccess(true);
  };

  const handleContadorSave = (values: ContadorRow) => {
    console.log('Contador Create:', values);
    setContador(null);
    setContadorSuccess(true);
  };

  const handleUploadSave = (values: MediaUploadData) => {
    console.log('Media Upload:', values);
    setUploadType(null);
    setUploadSuccess(true);
  };

  return (
    <Box>
      <TopBar />

      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Paper
            elevation={10}
            sx={{
              flex: 2,
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
                placeholder="Pesquisar no mural..."
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
                startIcon={<FileUpload />}
                onClick={togglePopper(setFileTypeAnchor)}
              >
                Novo Aviso
              </Button>
            </Box>

            <ButtonGroup
              variant="outlined"
              aria-label="Basic button group"
              fullWidth
              sx={{ flexGrow: 1, mr: 1, borderRadius: 8 }}
            >
              {FILTER_OPTIONS.map(({ label, value }) => (
                <Button
                  key={value}
                  sx={{ textTransform: 'none' }}
                  variant={filter === value ? 'contained' : 'outlined'}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>

            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell align="right">Tipo</TableCell>
                    <TableCell align="right">Data</TableCell>
                    <TableCell align="right">Criador</TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(row => (
                      <TableRow key={row.nome}>
                        <TableCell component="th" scope="row">
                          {row.nome}
                        </TableCell>
                        <TableCell align="right">{row.tipo}</TableCell>
                        <TableCell align="right">{row.data}</TableCell>
                        <TableCell align="right">{row.criador}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => setEditRow(row)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => setDeleteRow(row)}
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
              count={filteredRows.length}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
              page={page}
              onPageChange={(_e, p) => setPage(p)}
            />
          </Paper>
        </Box>
      </Container>

      {/* Popper: file type chooser */}
      <PopperMenu
        anchorEl={fileTypeAnchor}
        onClose={() => setFileTypeAnchor(null)}
        placement="bottom-start"
        width={300}
        items={[
          { label: 'Aviso', onClick: () => setAviso({ nome: '', aviso: '' }) },
          {
            label: 'Contador',
            onClick: () => setContador({ nome: '', deadlineISO: '' }),
          },
          { label: 'Vídeo', onClick: () => setUploadType('video') },
          { label: 'Imagem', onClick: () => setUploadType('image') },
        ]}
      />

      {/* Edit dialog */}
      <EditDialog
        row={editRow}
        onClose={() => setEditRow(null)}
        onSave={handleEditSave}
      />

      {/* Delete confirmation */}
      <DeleteDialog
        open={Boolean(deleteRow)}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir "${deleteRow?.nome}"?`}
        onCancel={() => setDeleteRow(null)}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Excluir"
        confirmColor="error"
      />

      {/* Aviso dialog */}
      <AvisoDialog
        row={aviso}
        onClose={() => setAviso(null)}
        onSave={handleAvisoSave}
      />

      {/* Contador dialog */}
      <ContadorDialog
        row={contador}
        onClose={() => setContador(null)}
        onSave={handleContadorSave}
      />

      {/* Media upload dialog (Video / Image) */}
      <MediaUploadDialog
        open={Boolean(uploadType)}
        type={uploadType ?? 'video'}
        onClose={() => setUploadType(null)}
        onSave={handleUploadSave}
      />

      {/* Success snackbars */}
      <SuccessSnackbar
        open={editSuccess}
        onClose={() => setEditSuccess(false)}
        message="Mídia atualizada com sucesso!"
      />
      <SuccessSnackbar
        open={deleteSuccess}
        onClose={() => setDeleteSuccess(false)}
        message="Mídia excluída com sucesso!"
      />
      <SuccessSnackbar
        open={avisoSuccess}
        onClose={() => setAvisoSuccess(false)}
        message="Aviso criado com sucesso!"
      />
      <SuccessSnackbar
        open={contadorSuccess}
        onClose={() => setContadorSuccess(false)}
        message="Contador criado com sucesso!"
      />
      <SuccessSnackbar
        open={uploadSuccess}
        onClose={() => setUploadSuccess(false)}
        message="Mídia enviada com sucesso!"
      />
    </Box>
  );
}
