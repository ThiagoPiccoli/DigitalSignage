import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import React from 'react';

export type CardapioRuRow = {
  id?: number;
  nome: string;
  unidade: string;
  bgColor: string;
};

interface CardapioRuDialogProps {
  row: CardapioRuRow | null;
  onClose: () => void;
  onSave: (values: CardapioRuRow) => void;
}

const UNIDADES = [
  { value: 'CENTRO', label: 'Centro' },
  { value: 'CAMPUS', label: 'Capão do Leão' },
  { value: 'ANGLO', label: 'Anglo' },
];

export default function CardapioRuDialog({
  row,
  onClose,
  onSave,
}: CardapioRuDialogProps) {
  const [values, setValues] = React.useState<CardapioRuRow | null>(null);
  const isSaveDisabled = !values?.nome.trim();

  React.useEffect(() => {
    setValues(
      row
        ? {
            ...row,
            bgColor: row.bgColor || '#0f172a',
            unidade: row.unidade || 'CENTRO',
          }
        : null,
    );
  }, [row]);

  const handleChange =
    (field: keyof CardapioRuRow) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(v => (v ? { ...v, [field]: e.target.value } : v));
    };

  const isEditing = Boolean(row?.id);

  return (
    <Dialog open={Boolean(row)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEditing ? 'Atualizar Cardápio RU' : 'Criar Cardápio RU'}
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
      >
        <TextField
          label="Nome"
          fullWidth
          value={values?.nome ?? ''}
          onChange={handleChange('nome')}
          autoFocus
          helperText="Nome do item no mural"
          sx={{ mt: 1 }}
        />
        <TextField
          select
          label="Unidade"
          fullWidth
          value={values?.unidade ?? 'CENTRO'}
          onChange={handleChange('unidade')}
          helperText="Unidade do Restaurante Universitário"
        >
          {UNIDADES.map(u => (
            <MenuItem key={u.value} value={u.value}>
              {u.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Cor de fundo"
          fullWidth
          type="color"
          value={values?.bgColor ?? '#0f172a'}
          onChange={handleChange('bgColor')}
          slotProps={{ inputLabel: { shrink: true } }}
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
          disabled={isSaveDisabled}
        >
          {isEditing ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
