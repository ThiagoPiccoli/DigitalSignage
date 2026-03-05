import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PermMedia from '@mui/icons-material/PermMedia';
import { Button, InputAdornment, TextField } from '@mui/material';
import { FileUpload, SearchRounded } from '@mui/icons-material';

export default function Header() {
  return (
    <Box>
      <AppBar
        position="sticky"
        sx={{ bgcolor: 'primary.main', display: 'flex' }}
      >
        <Toolbar sx={{ gap: 3 }}>
          <PermMedia />
          <Typography
            variant="h6"
            fontWeight="bold"
            display="flex"
            flexGrow={1}
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
            <Box>
              <Typography variant="body2" fontWeight="bold" flex={2}>
                Thiago Piccoli
              </Typography>
            </Box>
            <ArrowDropDownIcon />
          </Box>
          <Button variant="contained" color="secondary">
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, px: 4 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Paper
            elevation={10}
            sx={{
              flex: 2,
              p: 2,
              borderRadius: 3,
              minHeight: '50vh',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Pesquisar no mural..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  flex: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ flex: 1, borderRadius: 2, textTransform: 'none' }}
                startIcon={<FileUpload />}
              >
                Novo Aviso
              </Button>
            </Box>
          </Paper>
          <Paper
            elevation={10}
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 3,
              minHeight: '50vh',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h4" gutterBottom>
              Box 2
            </Typography>
            <Paper
              elevation={10}
              sx={{
                backgroundColor: 'primary.light',
                flex: 1,
                p: 2,
                borderRadius: 3,
                minHeight: '50vh',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h4" gutterBottom>
                Box 2
              </Typography>
            </Paper>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
