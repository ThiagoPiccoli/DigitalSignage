import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import React from 'react';

export type HtmlRow = { nome: string; aviso: string };

interface HtmlDialogProps {
  row: HtmlRow | null;
  onClose: () => void;
  onSave: (values: HtmlRow) => void;
}

export default function HtmlDialog({ row, onClose, onSave }: HtmlDialogProps) {
  const [values, setValues] = React.useState<HtmlRow | null>(null);

  React.useEffect(() => {
    setValues(row ? { ...row } : null);
  }, [row]);

  const handleChange =
    (field: keyof HtmlRow) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(v => (v ? { ...v, [field]: e.target.value } : v));
    };

  return (
    <Dialog open={Boolean(row)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Criar Aviso HTML</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
      >
        <TextField
          label="Nome"
          fullWidth
          value={values?.nome ?? ''}
          onChange={handleChange('nome')}
          sx={{ mt: 1 }}
        />
        <TextField
          label="Aviso"
          fullWidth
          value={values?.aviso ?? ''}
          onChange={handleChange('aviso')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={() => values && onSave(values)}
          variant="contained"
          color="primary"
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
