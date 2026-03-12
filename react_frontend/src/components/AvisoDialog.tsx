import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import React from 'react';

export type AvisoRow = { nome: string; aviso: string };

interface AvisoDialogProps {
  row: AvisoRow | null;
  onClose: () => void;
  onSave: (values: AvisoRow) => void;
}

export default function AvisoDialog({
  row,
  onClose,
  onSave,
}: AvisoDialogProps) {
  const [values, setValues] = React.useState<AvisoRow | null>(null);

  React.useEffect(() => {
    setValues(row ? { ...row } : null);
  }, [row]);

  const handleChange =
    (field: keyof AvisoRow) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(v => (v ? { ...v, [field]: e.target.value } : v));
    };

  return (
    <Dialog open={Boolean(row)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Criar Aviso</DialogTitle>
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
          label="Mensagem do Aviso"
          fullWidth
          multiline
          minRows={3}
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
