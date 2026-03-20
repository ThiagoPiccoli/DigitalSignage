import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TopBar from '../components/TopBar';
import {
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
} from '@mui/material';
import React from 'react';

import SuccessSnackbar from '../components/SuccessSnackbar';

export default function Configuracoes() {
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Manifest defaults
  const [fitMode, setFitMode] = React.useState('fit');
  const [bgColor, setBgColor] = React.useState('#000000');
  const [mute, setMute] = React.useState(true);
  const [volume, setVolume] = React.useState(1.0);

  // Server info
  const [serverIps] = React.useState<string[]>([]);

  const handleSave = () => {
    console.log('Settings saved:', {
      fitMode,
      bgColor,
      mute,
      volume,
    });
    setSaveSuccess(true);
  };

  return (
    <Box>
      <TopBar />

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

      <SuccessSnackbar
        open={saveSuccess}
        onClose={() => setSaveSuccess(false)}
        message="Configurações salvas com sucesso!"
      />
    </Box>
  );
}
