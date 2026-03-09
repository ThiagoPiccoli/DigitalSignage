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

export type MediaUploadData = {
  file: File | null;
  title: string;
  durationMs: number;
};

interface MediaUploadDialogProps {
  open: boolean;
  type: 'video' | 'image';
  onClose: () => void;
  onSave: (values: MediaUploadData) => void;
}

const ACCEPT_MAP = {
  video: 'video/mp4,video/webm,video/ogg',
  image: 'image/png,image/jpeg,image/gif,image/webp,image/bmp,image/svg+xml',
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
  const [durationMs, setDurationMs] = React.useState(10000);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setTitle('');
      setDurationMs(type === 'video' ? 0 : 10000);
    }
  }, [open, type]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && !title) {
      setTitle(selected.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSave = () => {
    onSave({ file, title, durationMs });
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
          onClick={() => fileInputRef.current?.click()}
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
            sx={{ fontSize: 48, color: file ? 'primary.main' : 'text.secondary' }}
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
                  ? 'MP4, WebM, OGG (máx. 500MB)'
                  : 'PNG, JPG, GIF, WebP, BMP, SVG (máx. 500MB)'}
              </Typography>
            </>
          )}
        </Box>

        <TextField
          label="Título"
          fullWidth
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {type === 'image' && (
          <TextField
            label="Duração de exibição (ms)"
            type="number"
            fullWidth
            value={durationMs}
            onChange={e => setDurationMs(Number(e.target.value))}
            helperText="Tempo que a imagem ficará na tela (padrão: 10000ms = 10s)"
          />
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
          disabled={!file}
        >
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
