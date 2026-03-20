import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import React from 'react';
import ScheduleFields, {
  DEFAULT_SCHEDULE,
  type Schedule,
} from './ScheduleFields';

export type ContadorRow = {
  nome: string;
  deadlineISO: string;
  schedule: Schedule;
};

interface ContadorDialogProps {
  row: ContadorRow | null;
  onClose: () => void;
  onSave: (values: ContadorRow) => void;
}

export default function ContadorDialog({
  row,
  onClose,
  onSave,
}: ContadorDialogProps) {
  const [values, setValues] = React.useState<ContadorRow | null>(null);

  React.useEffect(() => {
    setValues(
      row ? { ...row, schedule: row.schedule ?? DEFAULT_SCHEDULE } : null,
    );
  }, [row]);

  const handleChange =
    (field: keyof ContadorRow) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(v => (v ? { ...v, [field]: e.target.value } : v));
    };

  return (
    <Dialog open={Boolean(row)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Criar Contador</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
      >
        <TextField
          label="Título"
          fullWidth
          value={values?.nome ?? ''}
          onChange={handleChange('nome')}
          sx={{ mt: 1 }}
        />
        <TextField
          label="Data e Hora Limite"
          fullWidth
          type="datetime-local"
          value={values?.deadlineISO ?? ''}
          onChange={handleChange('deadlineISO')}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={() => values && onSave(values)}
          variant="contained"
          color="primary"
          disabled={!values?.nome || !values?.deadlineISO}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
