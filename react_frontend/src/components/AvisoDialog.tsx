import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import React from 'react';
import ScheduleFields, {
  DEFAULT_SCHEDULE,
  type Schedule,
} from './ScheduleFields';

export type AvisoRow = {
  nome: string;
  aviso: string;
  schedule: Schedule;
  bgColor: string;
  rawHtml?: string;
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
  const [useRawHtml, setUseRawHtml] = React.useState(false);

  const isSaveDisabled =
    !values?.nome.trim() ||
    (!useRawHtml && !values?.aviso.trim()) ||
    (useRawHtml && !values?.rawHtml?.trim());

  React.useEffect(() => {
    if (row) {
      setValues({
        ...row,
        schedule: row.schedule ?? DEFAULT_SCHEDULE,
        bgColor: row.bgColor || '#000000',
        rawHtml: '',
      });
    } else {
      setValues(null);
    }
    setUseRawHtml(false);
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
        {!useRawHtml && (
          <>
            <TextField
              label="Mensagem do Aviso"
              fullWidth
              multiline
              minRows={3}
              value={values?.aviso ?? ''}
              onChange={handleChange('aviso')}
              helperText="Obrigatório"
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
          </>
        )}
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

        <Accordion
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px !important',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="body2" fontWeight={600}>
              Opções Avançadas
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={useRawHtml}
                  onChange={e => {
                    setUseRawHtml(e.target.checked);
                    if (!e.target.checked) {
                      setValues(v => (v ? { ...v, rawHtml: '' } : v));
                    }
                  }}
                />
              }
              label="Usar HTML personalizado"
            />
            {useRawHtml && (
              <TextField
                label="Código HTML"
                fullWidth
                multiline
                minRows={8}
                value={values?.rawHtml ?? ''}
                onChange={handleChange('rawHtml')}
                helperText="O HTML será renderizado diretamente no player. Este aviso não poderá ser editado após o envio."
                slotProps={{
                  input: {
                    sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                  },
                }}
              />
            )}
          </AccordionDetails>
        </Accordion>
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
