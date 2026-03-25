import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

type ManifestDefaults = {
  imageDurationMs: number;
  htmlDurationMs: number;
  fitMode: 'fit' | 'fill' | 'stretch';
  bgColor: string;
  mute: boolean;
  volume: number;
};

type ManifestResponse = {
  defaults?: Partial<ManifestDefaults>;
};

const DEFAULT_MANIFEST: ManifestDefaults = {
  imageDurationMs: FALLBACK_IMAGE_DURATION_MS,
  htmlDurationMs: FALLBACK_HTML_DURATION_MS,
  fitMode: 'fit',
  bgColor: '#000000',
  mute: true,
  volume: 1,
};

function resolveObjectFit(fitMode: ManifestDefaults['fitMode']) {
  if (fitMode === 'fill') {
    return 'cover';
  }

  if (fitMode === 'stretch') {
    return 'fill';
  }

  return 'contain';
}

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
  const [searchParams] = useSearchParams();
  const isEmbedMode = searchParams.get('embed') === '1';
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<ManifestDefaults>(DEFAULT_MANIFEST);
  const [showEscHint, setShowEscHint] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

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

      let nextDefaults = DEFAULT_MANIFEST;
      try {
        const manifestRes = await api('/manifest');
        if (manifestRes.ok) {
          const manifestData = (await manifestRes.json()) as ManifestResponse;
          const serverDefaults = manifestData.defaults;
          nextDefaults = {
            imageDurationMs:
              Number(serverDefaults?.imageDurationMs) > 0
                ? Number(serverDefaults?.imageDurationMs)
                : DEFAULT_MANIFEST.imageDurationMs,
            htmlDurationMs:
              Number(serverDefaults?.htmlDurationMs) > 0
                ? Number(serverDefaults?.htmlDurationMs)
                : DEFAULT_MANIFEST.htmlDurationMs,
            fitMode:
              serverDefaults?.fitMode === 'fill' ||
              serverDefaults?.fitMode === 'stretch'
                ? serverDefaults.fitMode
                : 'fit',
            bgColor: serverDefaults?.bgColor || DEFAULT_MANIFEST.bgColor,
            mute:
              typeof serverDefaults?.mute === 'boolean'
                ? serverDefaults.mute
                : DEFAULT_MANIFEST.mute,
            volume:
              typeof serverDefaults?.volume === 'number' &&
              serverDefaults.volume >= 0 &&
              serverDefaults.volume <= 1
                ? serverDefaults.volume
                : DEFAULT_MANIFEST.volume,
          };
        }
      } catch (manifestError) {
        console.warn('Could not load manifest defaults:', manifestError);
      }

      setDefaults(nextDefaults);

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
              : nextDefaults.imageDurationMs,
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
          durationMs: nextDefaults.htmlDurationMs,
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

    const currentDuration = currentItem.durationMs || defaults.imageDurationMs;

    const timeoutId = window.setTimeout(() => {
      goToNext();
    }, currentDuration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [playlistItems, currentIndex, goToNext, defaults.imageDurationMs]);

  useEffect(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo) {
      return;
    }

    currentVideo.muted = defaults.mute;
    if (!defaults.mute) {
      currentVideo.volume = defaults.volume;
    }
  }, [currentIndex, defaults.mute, defaults.volume]);

  useEffect(() => {
    if (!loading && !error && !isEmbedMode) {
      setShowEscHint(true);
    }
  }, [loading, error, isEmbedMode]);

  const currentItem = useMemo(
    () => playlistItems[currentIndex],
    [playlistItems, currentIndex],
  );

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        bgcolor: defaults.bgColor,
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
          sx={{
            width: '100%',
            height: '100%',
            objectFit: resolveObjectFit(defaults.fitMode),
          }}
        />
      )}

      {!loading && currentItem?.type === 'video' && (
        <Box
          component="video"
          key={currentItem.id}
          ref={videoRef}
          src={currentItem.url}
          autoPlay
          muted={defaults.mute}
          playsInline
          onEnded={goToNext}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: resolveObjectFit(defaults.fitMode),
          }}
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

      <Snackbar
        open={!loading && !error && !isEmbedMode && showEscHint}
        autoHideDuration={3200}
        onClose={() => setShowEscHint(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setShowEscHint(false)}
          sx={{ width: '100%', bgcolor: 'rgba(0,0,0,0.85)', color: '#fff' }}
        >
          Pressione ESC para sair
        </Alert>
      </Snackbar>
    </Box>
  );
}
