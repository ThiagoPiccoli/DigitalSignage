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

export type MediaUploadData = {
  file: File | null;
  title: string;
  durationMs: number;
  schedule: Schedule;
};

interface MediaUploadDialogProps {
  open: boolean;
  type: 'video' | 'image';
  onClose: () => void;
  onSave: (values: MediaUploadData) => void;
}

const ACCEPT_MAP = {
  video: 'video/mp4,video/webm,video/ogg,video/quicktime,.mov',
  image:
    'image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/svg+xml,.jpg,.jpeg',
};

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

const ALLOWED_EXTENSIONS: Record<'video' | 'image', string[]> = {
  video: ['mp4', 'webm', 'ogg', 'mov'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'],
};

const LABEL_MAP = {
  video: 'Vídeo',
  image: 'Imagem',
};

export default function MediaUploadDialog({
  open,
  type,
  onClose,
  onSave,
}: MediaUploadDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState('');
  const [schedule, setSchedule] = React.useState<Schedule>(DEFAULT_SCHEDULE);
  const [fileError, setFileError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isSaveDisabled = !file || Boolean(fileError) || !title.trim();

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setTitle('');
      setSchedule(DEFAULT_SCHEDULE);
      setFileError('');
    }
  }, [open, type]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFilePickerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      setFileError('');
      return;
    }

    const ext = selected.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS[type].includes(ext)) {
      setFile(null);
      setFileError(
        type === 'video'
          ? 'Formato invalido. Envie MP4, WebM, OGG ou MOV.'
          : 'Formato invalido. Envie PNG, JPG, JPEG, GIF, WebP, BMP ou SVG.',
      );
      e.target.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setFileError('Arquivo muito grande. O limite maximo e 500MB.');
      e.target.value = '';
      return;
    }

    setFileError('');
    setFile(selected);
    if (selected && !title) {
      setTitle(selected.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSave = () => {
    if (!file || !title.trim() || fileError) {
      return;
    }

    onSave({
      file,
      title: title.trim(),
      durationMs: type === 'video' ? 0 : 10000,
      schedule,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Enviar {LABEL_MAP[type]}</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_MAP[type]}
          hidden
          onChange={handleFileChange}
        />

        {/* Upload area */}
        <Box
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={handleFilePickerKeyDown}
          sx={{
            mt: 1,
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
            <>
              <Typography variant="body1" color="text.secondary">
                Clique para selecionar um arquivo
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {type === 'video'
                  ? 'MP4, WebM, OGG, MOV (máx. 500MB)'
                  : 'PNG, JPG, JPEG, GIF, WebP, BMP, SVG (máx. 500MB)'}
              </Typography>
            </>
          )}
        </Box>

        <TextField
          label="Título"
          fullWidth
          value={title}
          onChange={e => setTitle(e.target.value)}
          helperText="Obrigatório"
        />

        <ScheduleFields value={schedule} onChange={setSchedule} />

        {fileError && (
          <Typography variant="body2" color="error">
            {fileError}
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
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
