import { Box, Button, TextField, Typography } from '@mui/material';
import React from 'react';

export type Schedule = {
  days: string[];
  start: string;
  end: string;
  tz: string;
};

export const DEFAULT_SCHEDULE: Schedule = {
  days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  start: '00:00',
  end: '23:59',
  tz: 'America/Sao_Paulo',
};

const DAYS_OPTIONS = [
  { label: 'Seg', value: 'mon' },
  { label: 'Ter', value: 'tue' },
  { label: 'Qua', value: 'wed' },
  { label: 'Qui', value: 'thu' },
  { label: 'Sex', value: 'fri' },
  { label: 'Sab', value: 'sat' },
  { label: 'Dom', value: 'sun' },
] as const;

const ALL_DAYS = DAYS_OPTIONS.map(item => item.value);

interface ScheduleFieldsProps {
  value: Schedule;
  onChange: (next: Schedule) => void;
  title?: string;
  dayAction?: React.ReactNode;
}

export default function ScheduleFields({
  value,
  onChange,
  title = 'Horário de Exibição',
  dayAction,
}: ScheduleFieldsProps) {
  const toggleDay = (day: string) => {
    const days = value.days.includes(day)
      ? value.days.filter(item => item !== day)
      : [...value.days, day];

    onChange({ ...value, days });
  };

  const selectAllDays = () => {
    onChange({ ...value, days: [...ALL_DAYS] });
  };

  const clearDays = () => {
    onChange({ ...value, days: [] });
  };

  const hasAllDays = ALL_DAYS.every(day => value.days.includes(day));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="subtitle2">{title}</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="text"
            sx={{ textTransform: 'none', minWidth: 0, px: 1 }}
            onClick={selectAllDays}
            disabled={hasAllDays}
          >
            Todos
          </Button>
          <Button
            size="small"
            variant="text"
            color="inherit"
            sx={{ textTransform: 'none', minWidth: 0, px: 1 }}
            onClick={clearDays}
            disabled={value.days.length === 0}
          >
            Limpar
          </Button>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Selecione os dias em que o conteúdo deve aparecer.
      </Typography>
      <Box
        sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
          {DAYS_OPTIONS.map(({ label, value: day }) => (
            <Button
              key={day}
              variant={value.days.includes(day) ? 'contained' : 'outlined'}
              size="small"
              sx={{ textTransform: 'none', minWidth: 48 }}
              onClick={() => toggleDay(day)}
            >
              {label}
            </Button>
          ))}
        </Box>
        {dayAction && <Box sx={{ display: 'flex' }}>{dayAction}</Box>}
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Início"
          type="time"
          fullWidth
          value={value.start}
          onChange={e => onChange({ ...value, start: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Fim"
          type="time"
          fullWidth
          value={value.end}
          onChange={e => onChange({ ...value, end: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>
    </Box>
  );
}
