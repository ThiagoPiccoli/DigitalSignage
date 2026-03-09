import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  Avatar,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import PopperMenu from '../components/PopperMenu';
import SuccessSnackbar from '../components/SuccessSnackbar';

const DAYS_OPTIONS = [
  { label: 'Seg', value: 'mon' },
  { label: 'Ter', value: 'tue' },
  { label: 'Qua', value: 'wed' },
  { label: 'Qui', value: 'thu' },
  { label: 'Sex', value: 'fri' },
  { label: 'Sáb', value: 'sat' },
  { label: 'Dom', value: 'sun' },
] as const;

export default function Configuracoes() {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Manifest defaults
  const [imageDurationMs, setImageDurationMs] = React.useState(10000);
  const [htmlDurationMs, setHtmlDurationMs] = React.useState(15000);
  const [fitMode, setFitMode] = React.useState('fit');
  const [bgColor, setBgColor] = React.useState('#000000');
  const [mute, setMute] = React.useState(true);
  const [volume, setVolume] = React.useState(1.0);
  const [scheduleDays, setScheduleDays] = React.useState<string[]>([
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
  ]);
  const [scheduleStart, setScheduleStart] = React.useState('00:00');
  const [scheduleEnd, setScheduleEnd] = React.useState('23:59');

  // Server info
  const [serverIps] = React.useState<string[]>([]);

  const togglePopper =
    (setter: React.Dispatch<React.SetStateAction<HTMLElement | null>>) =>
    (e: React.MouseEvent<HTMLElement>) =>
      setter(prev => (prev ? null : e.currentTarget));

  const toggleDay = (day: string) => {
    setScheduleDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const handleSave = () => {
    console.log('Settings saved:', {
      imageDurationMs,
      htmlDurationMs,
      fitMode,
      bgColor,
      mute,
      volume,
      schedule: {
        days: scheduleDays,
        start: scheduleStart,
        end: scheduleEnd,
        tz: 'America/Sao_Paulo',
      },
    });
    setSaveSuccess(true);
  };

  return (
    <Box>
      <AppBar
        position="sticky"
        sx={{ bgcolor: 'primary.main', display: 'flex' }}
      >
        <Toolbar sx={{ gap: 3 }}>
          <Avatar
            alt="CdTec"
            src="/logo_ufpel.png"
            variant="square"
            sx={{ width: 85, height: 85 }}
          />
          <Typography
            variant="h6"
            fontWeight="bold"
            display="flex"
            flexGrow={1}
            fontFamily="sans-serif"
          >
            Mural Digital
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
            }}
          >
            <Button
              onClick={togglePopper(setMenuAnchor)}
              variant="text"
              color="secondary"
              size="large"
              startIcon={<ArrowDropDownIcon />}
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
              Thiago Piccoli
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 6 }}>
        {/* Player defaults */}
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Padrões do Player
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Duração Imagem (ms)"
              type="number"
              fullWidth
              value={imageDurationMs}
              onChange={e => setImageDurationMs(Number(e.target.value))}
            />
            <TextField
              label="Duração HTML (ms)"
              type="number"
              fullWidth
              value={htmlDurationMs}
              onChange={e => setHtmlDurationMs(Number(e.target.value))}
            />
            <FormControl fullWidth>
              <InputLabel>Modo de Exibição</InputLabel>
              <Select
                value={fitMode}
                label="Modo de Exibição"
                onChange={e => setFitMode(e.target.value)}
              >
                <MenuItem value="fit">Ajustar (fit)</MenuItem>
                <MenuItem value="fill">Preencher (fill)</MenuItem>
                <MenuItem value="stretch">Esticar (stretch)</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Cor de Fundo
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{
                    width: 48,
                    height: 36,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                />
                <Typography variant="body2">{bgColor}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Audio settings */}
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Áudio
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={mute}
                  onChange={(_e, checked) => setMute(checked)}
                />
              }
              label="Mudo"
            />
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Volume
              </Typography>
              <Slider
                value={volume}
                onChange={(_e, val) => setVolume(val as number)}
                min={0}
                max={1}
                step={0.1}
                disabled={mute}
                valueLabelDisplay="auto"
                valueLabelFormat={v => `${Math.round(v * 100)}%`}
              />
            </Box>
          </Box>
        </Paper>

        {/* Schedule */}
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Horário de Exibição
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {DAYS_OPTIONS.map(({ label, value }) => (
                <Button
                  key={value}
                  variant={
                    scheduleDays.includes(value) ? 'contained' : 'outlined'
                  }
                  size="small"
                  sx={{ textTransform: 'none', minWidth: 48 }}
                  onClick={() => toggleDay(value)}
                >
                  {label}
                </Button>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Início"
                type="time"
                fullWidth
                value={scheduleStart}
                onChange={e => setScheduleStart(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Fim"
                type="time"
                fullWidth
                value={scheduleEnd}
                onChange={e => setScheduleEnd(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Server info */}
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Servidor
          </Typography>
          {serverIps.length > 0 ? (
            serverIps.map(ip => (
              <Typography
                key={ip}
                variant="body1"
                sx={{ fontFamily: 'monospace' }}
              >
                {ip}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nenhum IP local disponível
            </Typography>
          )}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ textTransform: 'none' }}
            onClick={handleSave}
          >
            Salvar Configurações
          </Button>
        </Box>
      </Container>

      {/* Popper: user menu */}
      <PopperMenu
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        placement="bottom-end"
        width={140}
        items={[
          { label: 'Perfil', onClick: () => navigate('/perfil') },
          { label: 'Configurações', onClick: () => navigate('/configuracoes') },
          { label: 'Sair', onClick: () => navigate('/login') },
        ]}
      />

      <SuccessSnackbar
        open={saveSuccess}
        onClose={() => setSaveSuccess(false)}
        message="Configurações salvas com sucesso!"
      />
    </Box>
  );
}
