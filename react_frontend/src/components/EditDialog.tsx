import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import React from 'react';

export type Row = { nome: string; tipo: string; data: string; criador: string };

interface EditDialogProps {
  row: Row | null;
  onClose: () => void;
  onSave: (values: Row) => void;
}

export default function EditDialog({ row, onClose, onSave }: EditDialogProps) {
  const [values, setValues] = React.useState<Row | null>(null);

  React.useEffect(() => {
    setValues(row ? { ...row } : null);
  }, [row]);

  const handleChange =
    (field: keyof Row) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(v => (v ? { ...v, [field]: e.target.value } : v));
    };

  return (
    <Dialog open={Boolean(row)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Mídia</DialogTitle>
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
          label="Tipo"
          fullWidth
          value={values?.tipo ?? ''}
          onChange={handleChange('tipo')}
        />
        <TextField
          label="Data"
          fullWidth
          type="date"
          value={values?.data ?? ''}
          onChange={handleChange('data')}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Criador"
          fullWidth
          value={values?.criador ?? ''}
          onChange={handleChange('criador')}
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
