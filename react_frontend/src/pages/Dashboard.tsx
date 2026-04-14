import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import {
  Button,
  ButtonGroup,
  Chip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {
  AccessTimeRounded,
  FileUpload,
  MenuBookRounded,
  PhotoCameraRounded,
  PlayCircleRounded,
  SearchRounded,
} from '@mui/icons-material';
import React, { useEffect } from 'react';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import EditDialog, {
  type Row,
  type EditPayload,
} from '../components/EditDialog';
import DeleteDialog from '../components/DeleteDialog';
import SuccessSnackbar from '../components/SuccessSnackbar';
import PopperMenu from '../components/PopperMenu';
import AvisoDialog, { type AvisoRow } from '../components/AvisoDialog';
import ContadorDialog, { type ContadorRow } from '../components/ContadorDialog';
import MediaUploadDialog, {
  type MediaUploadData,
} from '../components/MediaUploadDialog';
import { DEFAULT_SCHEDULE, type Schedule } from '../components/ScheduleFields';
import { api } from '../api';
import { getAuthToken } from '../auth';
import { isScheduleActive } from '../scheduleUtils';

const FILTER_OPTIONS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Ativos', value: 'ativos' },
  { label: 'Inativos', value: 'inativos' },
  { label: 'Avisos', value: 'aviso' },
  { label: 'Contadores', value: 'contador' },
  { label: 'Vídeos', value: 'video' },
  { label: 'Imagens', value: 'imagem' },
] as const;

interface DashboardProps {
  adminMode?: boolean;
}

export default function Dashboard({ adminMode = false }: DashboardProps) {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const rowsPerPage = adminMode ? 6 : 8;

  type ApiHtmlSignage = {
    id: number;
    title: string;
    fileType: 'aviso' | 'contador';
    bodyHtml: string;
    htmlUrl: string;
    schedule?: Schedule;
    createdAt: string;
    lastModified: number;
    lastModifiedUser?: {
      username: string;
    };
  };

  type ApiMediaSignage = {
    id: number;
    title: string;
    fileType: 'video' | 'image';
    fileUrl: string;
    durationMs: number;
    schedule?: Schedule;
    createdAt: string;
    lastModified: number;
    lastModifiedUser?: {
      username: string;
    };
  };

  type DashboardRow = Row & {
    id: number;
    source: 'html' | 'player';
    fileType: 'aviso' | 'contador' | 'video' | 'image';
  };

  const extractDeadlineISO = (bodyHtml: string) => {
    const match = bodyHtml.match(/Countdown to\s+(.+)/i);
    return match?.[1]?.trim() ?? '';
  };

  const normalizeSchedule = (schedule?: Schedule): Schedule => {
    if (!schedule) {
      return DEFAULT_SCHEDULE;
    }

    return {
      days: Array.isArray(schedule.days)
        ? schedule.days
        : DEFAULT_SCHEDULE.days,
      start: schedule.start || DEFAULT_SCHEDULE.start,
      end: schedule.end || DEFAULT_SCHEDULE.end,
      tz: schedule.tz || DEFAULT_SCHEDULE.tz,
    };
  };

  const [editRow, setEditRow] = React.useState<DashboardRow | null>(null);
  const [deleteRow, setDeleteRow] = React.useState<DashboardRow | null>(null);
  const [editSuccess, setEditSuccess] = React.useState(false);
  const [deleteSuccess, setDeleteSuccess] = React.useState(false);
  const [filter, setFilter] = React.useState<string>('todos');
  const [fileTypeAnchor, setFileTypeAnchor] =
    React.useState<null | HTMLElement>(null);
  const [search, setSearch] = React.useState('');
  const [signages, setSignages] = React.useState<DashboardRow[]>([]);

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

  const mapTypeToLabel = (
    type: 'aviso' | 'contador' | 'video' | 'image',
  ): Row['tipo'] => {
    if (type === 'aviso') return 'Aviso';
    if (type === 'contador') return 'Contador';
    if (type === 'video') return 'Vídeo';
    return 'Imagem';
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const formatSchedule = (schedule?: Schedule) => {
    if (!schedule) {
      return 'Sempre';
    }

    if (!Array.isArray(schedule.days) || schedule.days.length === 0) {
      return 'Desativado';
    }

    const dayLabelMap: Record<string, string> = {
      mon: 'Seg',
      tue: 'Ter',
      wed: 'Qua',
      thu: 'Qui',
      fri: 'Sex',
      sat: 'Sab',
      sun: 'Dom',
    };

    const hasAllDays =
      schedule.days.length === 7 &&
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].every(day =>
        schedule.days.includes(day),
      );

    const daysLabel = hasAllDays
      ? 'Todos os dias'
      : schedule.days.map(day => dayLabelMap[day] ?? day).join(', ');

    return `${daysLabel} | ${schedule.start} - ${schedule.end}`;
  };

  const fetchSignage = React.useCallback(async () => {
    try {
      const [htmlRes, mediaRes] = await Promise.all([
        api('/html', { method: 'GET' }),
        api('/player', { method: 'GET' }),
      ]);

      if (!htmlRes.ok) {
        throw new Error('Failed to fetch html entries');
      }

      if (!mediaRes.ok) {
        throw new Error('Failed to fetch media entries');
      }

      const htmlData = (await htmlRes.json()) as ApiHtmlSignage[];
      const mediaData = (await mediaRes.json()) as ApiMediaSignage[];

      const htmlRows: DashboardRow[] = htmlData.map(item => ({
        id: item.id,
        source: 'html',
        fileType: item.fileType,
        nome: item.title,
        tipo: mapTypeToLabel(item.fileType),
        data: formatDate(item.createdAt),
        criador: item.lastModifiedUser?.username ?? 'Desconhecido',
        aviso: item.fileType === 'aviso' ? item.bodyHtml : undefined,
        deadlineISO:
          item.fileType === 'contador'
            ? extractDeadlineISO(item.bodyHtml)
            : undefined,
        mediaUrl: item.htmlUrl,
        schedule: normalizeSchedule(item.schedule),
      }));

      const mediaRows: DashboardRow[] = mediaData.map(item => ({
        id: item.id,
        source: 'player',
        fileType: item.fileType,
        nome: item.title,
        tipo: mapTypeToLabel(item.fileType),
        data: formatDate(item.createdAt),
        criador: item.lastModifiedUser?.username ?? 'Desconhecido',
        mediaUrl: item.fileUrl,
        durationMs: item.durationMs,
        schedule: normalizeSchedule(item.schedule),
      }));

      setSignages([...htmlRows, ...mediaRows]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    fetchSignage();
  }, [fetchSignage]);

  useEffect(() => {
    setPage(0);
  }, [filter, search]);

  const filteredRows = signages
    .filter(r => {
      if (filter === 'todos') {
        return true;
      }

      if (filter === 'ativos') {
        return isScheduleActive(r.schedule);
      }

      if (filter === 'inativos') {
        return !isScheduleActive(r.schedule);
      }

      const normalizedFilter = filter === 'imagem' ? 'image' : filter;
      return r.fileType === normalizedFilter;
    })
    .filter(r => {
      const normalizedSearch = search.toLowerCase();
      return (
        r.nome.toLowerCase().includes(normalizedSearch) ||
        r.criador.toLowerCase().includes(normalizedSearch)
      );
    });

  const contentCounts = React.useMemo(() => {
    return signages.reduce(
      (acc, item) => {
        if (item.fileType === 'aviso') {
          acc.aviso += 1;
        }
        if (item.fileType === 'contador') {
          acc.contador += 1;
        }
        if (item.fileType === 'video') {
          acc.video += 1;
        }
        if (item.fileType === 'image') {
          acc.imagem += 1;
        }

        acc.total += 1;
        return acc;
      },
      { aviso: 0, contador: 0, video: 0, imagem: 0, total: 0 },
    );
  }, [signages]);

  const playerAccessUrl = `${window.location.origin}/player`;

  const togglePopper =
    (setter: React.Dispatch<React.SetStateAction<HTMLElement | null>>) =>
    (e: React.MouseEvent<HTMLElement>) =>
      setter(prev => (prev ? null : e.currentTarget));

  const handleEditSave = async (values: EditPayload) => {
    if (!editRow) {
      return;
    }

    try {
      if (editRow.source === 'html') {
        const payload: {
          title: string;
          bodyHtml?: string;
          schedule: Schedule;
        } = {
          title: values.nome,
          schedule: values.schedule,
        };

        if (values.tipo === 'Aviso' && values.aviso) {
          payload.bodyHtml = values.aviso;
        }

        const res = await api(`/html/${editRow.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error('Failed to update html content');
        }
      } else {
        const res = await api(`/player/${editRow.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: values.nome,
            schedule: values.schedule,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to update media content');
        }
      }

      await fetchSignage();
      setEditSuccess(true);
    } catch (error) {
      console.error('Error updating content:', error);
    }

    setEditRow(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) {
      return;
    }

    try {
      const endpoint =
        deleteRow.source === 'html'
          ? `/html/${deleteRow.id}`
          : `/player/${deleteRow.id}`;

      const res = await api(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete content');
      }

      setSignages(prev =>
        prev.filter(
          item =>
            !(item.id === deleteRow.id && item.source === deleteRow.source),
        ),
      );
      setDeleteSuccess(true);
    } catch (error) {
      console.error('Error deleting content:', error);
    }

    setDeleteRow(null);
  };

  const handleAvisoSave = async (values: AvisoRow) => {
    try {
      const res = await api('/html', {
        method: 'POST',
        body: JSON.stringify({
          title: values.nome,
          bodyHtml: values.aviso,
          bgColor: values.bgColor,
          schedule: values.schedule,
        }),
      });
      if (res.ok) {
        await fetchSignage();
        setAvisoSuccess(true);
      } else {
        console.error('Failed to create aviso');
      }
    } catch (error) {
      console.error('Error creating aviso:', error);
    }

    setAviso(null);
  };

  const handleContadorSave = async (values: ContadorRow) => {
    try {
      const res = await api('/html/deadline', {
        method: 'POST',
        body: JSON.stringify({
          title: values.nome,
          deadlineISO: values.deadlineISO,
          bgColor: values.bgColor,
          schedule: values.schedule,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create contador');
      }

      await fetchSignage();
      setContadorSuccess(true);
    } catch (error) {
      console.error('Error creating contador:', error);
    }

    setContador(null);
  };

  const handleUploadSave = async (values: MediaUploadData) => {
    if (!values.file || !uploadType) {
      return;
    }

    try {
      const form = new FormData();
      form.append('file', values.file);
      form.append('title', values.title);
      if (uploadType === 'image') {
        form.append('durationMs', String(values.durationMs));
      }
      form.append('schedule', JSON.stringify(values.schedule));

      const token = getAuthToken();
      const response = await api('/player', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });

      if (!response.ok) {
        throw new Error('Failed to upload media');
      }

      await fetchSignage();
      setUploadSuccess(true);
    } catch (error) {
      console.error('Error uploading media:', error);
    }

    setUploadType(null);
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', pb: 2 }}>
      <TopBar />

      <Container
        maxWidth={false}
        sx={{ mt: 3, px: { xs: 1.5, sm: 2, md: 3, lg: 4 } }}
      >
        {adminMode && (
          <Paper
            elevation={10}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Painel Administrativo
                </Typography>
                <Typography color="text.secondary">
                  Gerencie usuários do mural a partir daqui.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                  onClick={() => navigate('/usuarios')}
                >
                  Lista de Usuários
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'stretch',
            flexDirection: { xs: 'column', lg: 'row' },
            mb: 3,
          }}
        >
          <Paper
            elevation={10}
            sx={{
              order: { xs: 2, lg: 1 },
              flex: 1,
              p: 2,
              borderRadius: 3,
              height: adminMode ? '75vh' : 'calc(100vh - 104px)',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
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
                {adminMode ? 'Novo Conteúdo' : 'Novo Aviso'}
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

            <TableContainer
              component={Paper}
              sx={{ mt: 2, flex: 1, overflow: 'auto' }}
            >
              <Table sx={{ minWidth: 800 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell align="right">Tipo</TableCell>
                    <TableCell align="right">Data</TableCell>
                    <TableCell align="right">Criador</TableCell>
                    <TableCell align="right">Exibição</TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(row => (
                      <TableRow key={`${row.source}-${row.id}`}>
                        <TableCell component="th" scope="row">
                          {row.nome}
                        </TableCell>
                        <TableCell align="right">{row.tipo}</TableCell>
                        <TableCell align="right">{row.data}</TableCell>
                        <TableCell align="right">{row.criador}</TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: 0.6,
                            }}
                          >
                            <Typography variant="body2">
                              {formatSchedule(row.schedule)}
                            </Typography>
                            <Chip
                              size="small"
                              label={
                                isScheduleActive(row.schedule)
                                  ? 'Ativo agora'
                                  : 'Inativo'
                              }
                              color={
                                isScheduleActive(row.schedule)
                                  ? 'success'
                                  : 'default'
                              }
                              variant={
                                isScheduleActive(row.schedule)
                                  ? 'filled'
                                  : 'outlined'
                              }
                            />
                          </Box>
                        </TableCell>
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
              sx={{ flexShrink: 0 }}
              component="div"
              count={filteredRows.length}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
              page={page}
              onPageChange={(_e, p) => setPage(p)}
            />
          </Paper>

          <Box
            sx={{
              order: { xs: 1, lg: 2 },
              width: { xs: '100%', lg: 280 },
              height: {
                xs: 'auto',
                lg: adminMode ? '75vh' : 'calc(100vh - 104px)',
              },
              display: 'flex',
              flexDirection: { xs: 'row', lg: 'column' },
              gap: 1.5,
              '& > .MuiPaper-root': {
                flex: { xs: 1, lg: 'initial' },
                minWidth: 0,
              },
            }}
          >
            <Paper
              elevation={10}
              sx={{
                p: 2.25,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.3,
                flex: 1,
                overflow: 'auto',
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Mural disponível
              </Typography>

              <Box
                sx={{
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#000',
                  aspectRatio: '1 / 1',
                  width: '100%',
                  maxHeight: 280,
                }}
              >
                <Box
                  component="iframe"
                  src="/player?embed=1"
                  title="Preview do player"
                  scrolling="no"
                  sx={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Acesse o mural por este endereço na rede local.
              </Typography>

              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ wordBreak: 'break-all', lineHeight: 1.4 }}
                >
                  {playerAccessUrl}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                sx={{ textTransform: 'none', py: 0.9 }}
                onClick={() => navigate('/player')}
              >
                Acessar mural
              </Button>
            </Paper>

            <Paper
              elevation={10}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 1.2,
                flex: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Resumo de conteudos
                </Typography>
                <Chip
                  size="small"
                  color="primary"
                  label={`Total: ${contentCounts.total}`}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 1,
                  width: '100%',
                }}
              >
                {[
                  {
                    label: 'Avisos',
                    value: contentCounts.aviso,
                    color: '#2e7d32',
                    bg: 'rgba(46,125,50,0.1)',
                    icon: MenuBookRounded,
                  },
                  {
                    label: 'Contadores',
                    value: contentCounts.contador,
                    color: '#6a1b9a',
                    bg: 'rgba(106,27,154,0.1)',
                    icon: AccessTimeRounded,
                  },
                  {
                    label: 'Videos',
                    value: contentCounts.video,
                    color: '#ef6c00',
                    bg: 'rgba(239,108,0,0.1)',
                    icon: PlayCircleRounded,
                  },
                  {
                    label: 'Imagens',
                    value: contentCounts.imagem,
                    color: '#1565c0',
                    bg: 'rgba(21,101,192,0.1)',
                    icon: PhotoCameraRounded,
                  },
                ].map(item => (
                  <Box
                    key={item.label}
                    sx={{
                      p: 1.1,
                      borderRadius: 1.25,
                      bgcolor: item.bg,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      aspectRatio: '1 / 1',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.6,
                        width: '100%',
                      }}
                    >
                      <item.icon sx={{ fontSize: 16, color: item.color }} />
                      <Typography variant="caption" fontWeight={600}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      sx={{ color: item.color, textAlign: 'center' }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Popper: file type chooser */}
      <PopperMenu
        anchorEl={fileTypeAnchor}
        onClose={() => setFileTypeAnchor(null)}
        placement="bottom-start"
        items={[
          {
            label: 'Aviso',
            onClick: () =>
              setAviso({
                nome: '',
                aviso: '',
                schedule: DEFAULT_SCHEDULE,
                bgColor: '#000000',
              }),
          },
          {
            label: 'Contador',
            onClick: () =>
              setContador({
                nome: '',
                deadlineISO: '',
                schedule: DEFAULT_SCHEDULE,
                bgColor: '#000000',
              }),
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
