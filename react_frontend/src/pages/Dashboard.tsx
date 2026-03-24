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
import { FileUpload, SearchRounded } from '@mui/icons-material';
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

const FILTER_OPTIONS = [
  { label: 'Todos os conteúdos', value: 'todos' },
  { label: 'Avisos', value: 'aviso' },
  { label: 'Contadores', value: 'contador' },
  { label: 'Vídeos', value: 'video' },
  { label: 'Imagens', value: 'imagem' },
] as const;

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
const WEEKDAY_MAP: Record<string, string> = {
  sun: 'sun',
  mon: 'mon',
  tue: 'tue',
  wed: 'wed',
  thu: 'thu',
  fri: 'fri',
  sat: 'sat',
};

function parseTimeToMinutes(input: string, fallback: number) {
  const match = String(input || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return fallback;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallback;
  }

  return hours * 60 + minutes;
}

function getCurrentDayAndMinutes(timeZone?: string) {
  const now = new Date();

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || DEFAULT_TIMEZONE,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const weekday = parts.find(part => part.type === 'weekday')?.value;
    const hour = Number(parts.find(part => part.type === 'hour')?.value ?? NaN);
    const minute = Number(
      parts.find(part => part.type === 'minute')?.value ?? NaN,
    );

    if (!weekday || Number.isNaN(hour) || Number.isNaN(minute)) {
      throw new Error('Could not parse date parts');
    }

    const dayKey = WEEKDAY_MAP[weekday.toLowerCase().slice(0, 3)] || 'sun';
    return {
      dayKey,
      minutes: hour * 60 + minute,
    };
  } catch {
    const fallbackDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
      now.getDay()
    ];
    return {
      dayKey: fallbackDay,
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

function isScheduleActive(schedule?: Schedule) {
  if (!schedule) {
    return true;
  }

  const { dayKey, minutes } = getCurrentDayAndMinutes(schedule.tz);
  const validDays = Array.isArray(schedule.days)
    ? schedule.days.map(day => String(day).toLowerCase())
    : [];

  if (validDays.length > 0 && !validDays.includes(dayKey)) {
    return false;
  }

  const startMinutes = parseTimeToMinutes(schedule.start, 0);
  const endMinutes = parseTimeToMinutes(schedule.end, 23 * 60 + 59);

  if (startMinutes === endMinutes) {
    return true;
  }

  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes <= endMinutes;
  }

  return minutes >= startMinutes || minutes <= endMinutes;
}

interface DashboardProps {
  adminMode?: boolean;
}

export default function Dashboard({ adminMode = false }: DashboardProps) {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 10;

  // Admin IP address state
  const [serverIps, setServerIps] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (adminMode) {
      api('/admin/local-ip')
        .then(res => res.json())
        .then(data => setServerIps(data.ips ?? []))
        .catch(() => setServerIps([]));
    }
  }, [adminMode]);

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
          textColor: values.textColor,
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
          textColor: values.textColor,
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
    <Box>
      <TopBar />

      <Container maxWidth="lg" sx={{ mt: 6 }}>
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
              <Typography variant="h6" fontWeight="bold">
                Conteúdos do Player
              </Typography>
              <Typography color="text.secondary">
                Visualize os itens enviados para reprodução: vídeos, imagens,
                avisos e contadores.
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{ textTransform: 'none' }}
              onClick={() => navigate('/player')}
            >
              Abrir Tela do Player
            </Button>
          </Box>
        </Paper>

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
                  Gerencie usuários e configurações globais do mural a partir
                  daqui.
                </Typography>
                {serverIps.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>IP do Servidor:</strong> {serverIps.join(', ')}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                  onClick={() => navigate('/usuarios')}
                >
                  Lista de Usuários
                </Button>
                <Button
                  variant="contained"
                  sx={{ textTransform: 'none' }}
                  onClick={() => navigate('/configuracoes')}
                >
                  Configurações
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

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

            <TableContainer component={Paper} sx={{ mt: 2 }}>
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
          {
            label: 'Aviso',
            onClick: () =>
              setAviso({
                nome: '',
                aviso: '',
                schedule: DEFAULT_SCHEDULE,
                textColor: '#ffffff',
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
                textColor: '#ffffff',
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
