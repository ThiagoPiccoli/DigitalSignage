import { Alert, Snackbar } from '@mui/material';

interface SuccessSnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
}

export default function SuccessSnackbar({
  open,
  onClose,
  message,
}: SuccessSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="success" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
