import React from 'react';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import OpenInFullRounded from '@mui/icons-material/OpenInFullRounded';
import { useNavigate } from 'react-router-dom';

const PIP_WIDTH = 300;
const PIP_HEIGHT = 170;
const MARGIN = 16;

type Position = {
  x: number;
  y: number;
};

function clampPosition(x: number, y: number) {
  const maxX = Math.max(MARGIN, window.innerWidth - PIP_WIDTH - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - PIP_HEIGHT - MARGIN);

  return {
    x: Math.min(Math.max(MARGIN, x), maxX),
    y: Math.min(Math.max(MARGIN, y), maxY),
  };
}

export default function PlayerPiP() {
  const navigate = useNavigate();
  const [position, setPosition] = React.useState<Position>(() => ({
    x: Math.max(MARGIN, window.innerWidth - PIP_WIDTH - MARGIN),
    y: Math.max(MARGIN, window.innerHeight - PIP_HEIGHT - MARGIN),
  }));
  const dragOffsetRef = React.useRef<Position>({ x: 0, y: 0 });
  const dragStartRef = React.useRef<Position>({ x: 0, y: 0 });
  const didDragRef = React.useRef(false);

  React.useEffect(() => {
    const handleResize = () => {
      setPosition(current => clampPosition(current.x, current.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.closest('button')) {
      return;
    }

    didDragRef.current = false;
    dragStartRef.current = { x: event.clientX, y: event.clientY };

    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    const movedX = Math.abs(event.clientX - dragStartRef.current.x);
    const movedY = Math.abs(event.clientY - dragStartRef.current.y);
    if (movedX > 4 || movedY > 4) {
      didDragRef.current = true;
    }

    const nextX = event.clientX - dragOffsetRef.current.x;
    const nextY = event.clientY - dragOffsetRef.current.y;

    setPosition(clampPosition(nextX, nextY));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <Paper
      elevation={14}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: PIP_WIDTH,
        height: PIP_HEIGHT,
        zIndex: theme => theme.zIndex.modal + 1,
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        cursor: 'grab',
        touchAction: 'none',
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <Box sx={{ flex: 1, bgcolor: '#000', position: 'relative' }}>
        <Box
          onClick={() => {
            if (didDragRef.current) {
              didDragRef.current = false;
              return;
            }
            navigate('/player');
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            cursor: 'pointer',
          }}
        />

        <Tooltip title="Abrir em tela cheia">
          <IconButton
            size="small"
            onClick={() => navigate('/player')}
            aria-label="Abrir player em tela cheia"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              width: 28,
              height: 28,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.65)',
              bgcolor: 'rgba(0,0,0,0.35)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.6)',
                borderColor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            <OpenInFullRounded sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>

        <Box
          component="iframe"
          src="/player?embed=1"
          title="Mini Player"
          sx={{ width: '100%', height: '100%', border: 0 }}
        />
      </Box>
    </Paper>
  );
}
