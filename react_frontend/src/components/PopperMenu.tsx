import { Button, ClickAwayListener, Paper, Popper } from '@mui/material';

interface PopperMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  items: { label: string; onClick?: () => void }[];
  placement?: 'bottom-start' | 'bottom-end';
  width?: number;
}

export default function PopperMenu({
  anchorEl,
  onClose,
  items,
  placement = 'bottom-end',
  width = 160,
}: PopperMenuProps) {
  if (!anchorEl) return null;

  return (
    <Popper
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      placement={placement}
      style={{ zIndex: 1300 }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper sx={{ p: 1, mt: 1, width }}>
          {items.map(({ label, onClick }) => (
            <Button
              key={label}
              fullWidth
              variant="text"
              color="primary"
              sx={{ textTransform: 'none' }}
              onClick={() => {
                onClick?.();
                onClose();
              }}
            >
              {label}
            </Button>
          ))}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}
