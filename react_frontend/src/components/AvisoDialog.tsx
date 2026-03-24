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

export type AvisoRow = {
  nome: string;
  aviso: string;
  schedule: Schedule;
  textColor: string;
  bgColor: string;
};

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
  const isSaveDisabled = !values?.nome.trim() || !values?.aviso.trim();

  React.useEffect(() => {
    setValues(
      row
        ? {
            ...row,
            schedule: row.schedule ?? DEFAULT_SCHEDULE,
            textColor: row.textColor || '#ffffff',
            bgColor: row.bgColor || '#000000',
          }
        : null,
    );
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
          autoFocus
          helperText="Obrigatório"
          sx={{ mt: 1 }}
        />
        <TextField
          label="Mensagem do Aviso"
          fullWidth
          multiline
          minRows={3}
          value={values?.aviso ?? ''}
          onChange={handleChange('aviso')}
          helperText="Obrigatório"
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Cor do texto"
            fullWidth
            type="color"
            value={values?.textColor ?? '#ffffff'}
            onChange={handleChange('textColor')}
            helperText="Cor principal do texto"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Cor de fundo"
            fullWidth
            type="color"
            value={values?.bgColor ?? '#000000'}
            onChange={handleChange('bgColor')}
            helperText="Cor de fundo do aviso"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
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
          disabled={isSaveDisabled}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
