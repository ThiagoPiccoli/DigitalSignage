import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import React from 'react';
import ScheduleFields, {
  DEFAULT_SCHEDULE,
  type Schedule,
} from './ScheduleFields';

export type Row = {
  nome: string;
  tipo: string;
  data: string;
  criador: string;
  aviso?: string;
  deadlineISO?: string;
  mediaUrl?: string;
  durationMs?: number;
  schedule?: Schedule;
};

export type EditPayload = {
  nome: string;
  tipo: string;
  aviso?: string;
  deadlineISO?: string;
  file?: File | null;
  schedule: Schedule;
};

interface EditDialogProps {
  row: Row | null;
  onClose: () => void;
  onSave: (values: EditPayload) => void;
}

const ACCEPT_MAP: Record<string, string> = {
  Vídeo: 'video/mp4,video/webm,video/ogg',
  Imagem:
    'image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/svg+xml,.jpg,.jpeg',
};

function normalizeMediaUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      const isLocalHost =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

      if (isLocalHost) {
        parsed.hostname = window.location.hostname;
      }

      return parsed.toString();
    } catch {
      return url;
    }
  }

  return `http://${window.location.hostname}:3333${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function EditDialog({ row, onClose, onSave }: EditDialogProps) {
  const [nome, setNome] = React.useState('');
  const [aviso, setAviso] = React.useState('');
  const [deadlineISO, setDeadlineISO] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [schedule, setSchedule] = React.useState<Schedule>(DEFAULT_SCHEDULE);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (row) {
      setNome(row.nome);
      setAviso(row.aviso ?? '');
      setDeadlineISO(row.deadlineISO ?? '');
      setSchedule(row.schedule ?? DEFAULT_SCHEDULE);
      setFile(null);
    }
  }, [row]);

  const isMedia = row?.tipo === 'Vídeo' || row?.tipo === 'Imagem';
  const isScheduleDisabled =
    Array.isArray(schedule.days) && schedule.days.length === 0;
  const isSaveDisabled = !row || !nome.trim();

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleFilePickerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  const handleSave = () => {
    if (!row) return;
    const trimmedNome = nome.trim();
    if (!trimmedNome) {
      return;
    }

    const payload: EditPayload = {
      nome: trimmedNome,
      tipo: row.tipo,
      schedule,
    };
    if (row.tipo === 'Aviso') payload.aviso = aviso;
    if (row.tipo === 'Contador') {
      payload.deadlineISO = deadlineISO;
    }
    if (isMedia) payload.file = file;
    onSave(payload);
  };

  return (
    <Dialog open={Boolean(row)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar {row?.tipo}</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
      >
        <TextField
          label="Nome"
          fullWidth
          value={nome}
          onChange={e => setNome(e.target.value)}
          sx={{ mt: 1 }}
        />

        {row?.tipo === 'Aviso' && (
          <TextField
            label="Mensagem do Aviso"
            fullWidth
            multiline
            minRows={3}
            value={aviso}
            onChange={e => setAviso(e.target.value)}
          />
        )}

        {row?.tipo === 'Contador' && (
          <TextField
            label="Data e Hora Limite"
            fullWidth
            type="datetime-local"
            value={deadlineISO}
            onChange={e => setDeadlineISO(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        )}

        {isMedia && (
          <>
            {row?.mediaUrl && row.tipo === 'Imagem' && (
              <Box
                component="img"
                src={normalizeMediaUrl(row.mediaUrl)}
                alt={row.nome}
                sx={{
                  width: '100%',
                  maxHeight: 180,
                  objectFit: 'contain',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                }}
              />
            )}
            {row?.mediaUrl && row.tipo === 'Vídeo' && (
              <Box
                component="video"
                src={normalizeMediaUrl(row.mediaUrl)}
                controls
                muted
                sx={{
                  width: '100%',
                  maxHeight: 220,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            )}
            {row?.mediaUrl && (
              <Typography variant="caption" color="text.secondary">
                Arquivo atual: {row.mediaUrl.split('/').pop()}
              </Typography>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_MAP[row!.tipo]}
              hidden
              onChange={handleFileChange}
            />
            <Box
              onClick={openFilePicker}
              role="button"
              tabIndex={0}
              onKeyDown={handleFilePickerKeyDown}
              sx={{
                border: '2px dashed',
                borderColor: file ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                bgcolor: file ? 'primary.light' : 'background.default',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.light',
                },
              }}
            >
              <CloudUpload
                sx={{
                  fontSize: 48,
                  color: file ? 'primary.main' : 'text.secondary',
                }}
              />
              {file ? (
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {file.name}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Clique para substituir o arquivo (opcional)
                </Typography>
              )}
            </Box>
          </>
        )}

        <ScheduleFields value={schedule} onChange={setSchedule} />
        {isScheduleDisabled && (
          <Typography variant="caption" color="warning.main">
            Conteúdo desativado para todos os dias. Use "Todos" para reativar ou
            clique em Salvar para aplicar.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={isSaveDisabled}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
