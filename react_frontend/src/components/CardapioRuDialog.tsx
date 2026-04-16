import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import ScheduleFields, {
  DEFAULT_SCHEDULE,
  type Schedule,
} from './ScheduleFields';

export type CardapioRuRow = {
  id?: number;
  nome: string;
  /** ISO date YYYY-MM-DD used by the date input */
  date: string;
  unidade: string;
  bgColor: string;
  schedule: Schedule;
};

interface CardapioRuDialogProps {
  row: CardapioRuRow | null;
  onClose: () => void;
  onSave: (values: CardapioRuRow) => void;
}

const UNIDADES = [
  { value: 'CENTRO', label: 'Centro' },
  { value: 'CAMPUS', label: 'Campus' },
];

export default function CardapioRuDialog({
  row,
  onClose,
  onSave,
}: CardapioRuDialogProps) {
  const [values, setValues] = React.useState<CardapioRuRow | null>(null);
  const isSaveDisabled = !values?.nome.trim() || !values?.date;

  React.useEffect(() => {
    setValues(
      row
        ? {
            ...row,
            schedule: row.schedule ?? DEFAULT_SCHEDULE,
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
          label="Data do Cardápio"
          fullWidth
          type="date"
          value={values?.date ?? ''}
          onChange={handleChange('date')}
          helperText="Data para buscar o cardápio no Cobalto"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Cor de fundo"
          fullWidth
          type="color"
          value={values?.bgColor ?? '#0f172a'}
          onChange={handleChange('bgColor')}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        {values && (
          <Box sx={{ mt: 1 }}>
            <ScheduleFields
              value={values.schedule}
              onChange={schedule =>
                setValues(current =>
                  current ? { ...current, schedule } : current,
                )
              }
            />
          </Box>
        )}
        {isEditing && (
          <Typography variant="caption" color="text.secondary">
            Salvar buscará o cardápio atualizado do Cobalto para a data
            selecionada.
          </Typography>
        )}
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
          {isEditing ? 'Atualizar' : 'Buscar e Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
