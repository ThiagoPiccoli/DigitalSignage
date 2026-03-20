import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getHomePath } from '../auth';

type PlayerMediaItem = {
  id: number;
  title: string;
  fileType: 'video' | 'image';
  fileUrl: string;
  durationMs: number;
  createdAt: string;
};

type HtmlItem = {
  id: number;
  title: string;
  fileType: 'aviso' | 'contador';
  htmlUrl: string;
  createdAt: string;
};

type PlaylistItem = {
  id: number;
  title: string;
  type: 'video' | 'image' | 'aviso' | 'contador';
  url: string;
  durationMs: number;
  createdAt: string;
};

const FALLBACK_IMAGE_DURATION_MS = 10000;
const FALLBACK_HTML_DURATION_MS = 15000;

function normalizeMediaUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      const isLocalHost =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

      if (isLocalHost) {
        parsed.hostname = window.location.hostname;
      }

      return parsed.toString();
    } catch {
      return url;
    }
  }

  return `http://${window.location.hostname}:3333${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function Player() {
  const navigate = useNavigate();
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEscHint, setShowEscHint] = useState(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      navigate(getHomePath(), { replace: true });
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navigate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowEscHint(false);
    }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % playlistItems.length);
  }, [playlistItems.length]);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [mediaRes, htmlRes] = await Promise.all([
        api('/player'),
        api('/html'),
      ]);

      if (!mediaRes.ok || !htmlRes.ok) {
        throw new Error('Não foi possível carregar os conteúdos do player.');
      }

      const mediaData = (await mediaRes.json()) as PlayerMediaItem[];
      const htmlData = (await htmlRes.json()) as HtmlItem[];

      const normalizedMediaItems: PlaylistItem[] = mediaData
        .filter(item => item.fileType === 'image' || item.fileType === 'video')
        .map(item => ({
          id: item.id,
          title: item.title,
          type: item.fileType,
          url: normalizeMediaUrl(item.fileUrl),
          durationMs:
            Number(item.durationMs) > 0
              ? Number(item.durationMs)
              : FALLBACK_IMAGE_DURATION_MS,
          createdAt: item.createdAt,
        }));

      const normalizedHtmlItems: PlaylistItem[] = htmlData
        .filter(
          item => item.fileType === 'aviso' || item.fileType === 'contador',
        )
        .map(item => ({
          id: item.id,
          title: item.title,
          type: item.fileType,
          url: normalizeMediaUrl(item.htmlUrl),
          durationMs: FALLBACK_HTML_DURATION_MS,
          createdAt: item.createdAt,
        }));

      const merged = [...normalizedMediaItems, ...normalizedHtmlItems].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      setPlaylistItems(merged);
      setCurrentIndex(0);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Falha ao carregar os conteúdos. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (playlistItems.length <= 1) {
      return;
    }

    const currentItem = playlistItems[currentIndex];
    if (!currentItem || currentItem.type === 'video') {
      return;
    }

    const currentDuration =
      currentItem.durationMs || FALLBACK_IMAGE_DURATION_MS;

    const timeoutId = window.setTimeout(() => {
      goToNext();
    }, currentDuration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [playlistItems, currentIndex, goToNext]);

  const currentItem = useMemo(
    () => playlistItems[currentIndex],
    [playlistItems, currentIndex],
  );

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        bgcolor: '#000',
        overflow: 'hidden',
      }}
    >
      {error && (
        <Alert
          severity="error"
          sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}
        >
          {error}
        </Alert>
      )}

      {showEscHint && (
        <Alert
          severity="info"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 2,
            bgcolor: 'rgba(20,20,20,0.85)',
            color: 'grey.100',
            '& .MuiAlert-icon': { color: 'grey.100' },
          }}
        >
          Pressione ESC para voltar ao painel
        </Alert>
      )}

      {loading && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ width: '100%', height: '100%' }}
        >
          <CircularProgress />
        </Stack>
      )}

      {!loading && playlistItems.length === 0 && !error && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ width: '100%', height: '100%' }}
        >
          <Typography color="grey.300" variant="h5">
            Nenhum conteúdo disponível para exibição.
          </Typography>
        </Stack>
      )}

      {!loading && currentItem?.type === 'image' && (
        <Box
          component="img"
          key={currentItem.id}
          src={currentItem.url}
          alt={currentItem.title}
          sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}

      {!loading && currentItem?.type === 'video' && (
        <Box
          component="video"
          key={currentItem.id}
          src={currentItem.url}
          autoPlay
          muted
          playsInline
          onEnded={goToNext}
          sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}

      {!loading &&
        (currentItem?.type === 'aviso' || currentItem?.type === 'contador') && (
          <Box
            component="iframe"
            key={currentItem.id}
            src={currentItem.url}
            title={currentItem.title}
            sx={{ width: '100%', height: '100%', border: 0 }}
          />
        )}

      {!loading && playlistItems.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            bgcolor: 'rgba(0,0,0,0.55)',
          }}
        >
          <Typography variant="body2" color="grey.100">
            Item {currentIndex + 1} de {playlistItems.length}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
