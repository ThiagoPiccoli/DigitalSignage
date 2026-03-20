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

interface ScheduleFieldsProps {
  value: Schedule;
  onChange: (next: Schedule) => void;
  title?: string;
}

export default function ScheduleFields({
  value,
  onChange,
  title = 'Horario de Exibicao',
}: ScheduleFieldsProps) {
  const toggleDay = (day: string) => {
    const days = value.days.includes(day)
      ? value.days.filter(item => item !== day)
      : [...value.days, day];

    onChange({ ...value, days });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Inicio"
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
