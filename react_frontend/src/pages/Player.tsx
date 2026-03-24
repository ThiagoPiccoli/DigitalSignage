import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getHomePath, getSessionUser } from '../auth';

type Schedule = {
  days: string[];
  start: string;
  end: string;
  tz: string;
};

type PlayerMediaItem = {
  id: number;
  title: string;
  fileType: 'video' | 'image';
  fileUrl: string;
  durationMs: number;
  createdAt: string;
  schedule?: Schedule;
};

type HtmlItem = {
  id: number;
  title: string;
  fileType: 'aviso' | 'contador';
  htmlUrl: string;
  createdAt: string;
  schedule?: Schedule;
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
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

const WEEKDAY_MAP: Record<string, string> = {
  sun: 'sun',
  mon: 'mon',
  tue: 'tue',
  wed: 'wed',
  thu: 'thu',
  fri: 'fri',
  sat: 'sat',
};

function parseTimeToMinutes(input: string, fallback: number) {
  const match = String(input || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return fallback;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallback;
  }

  return hours * 60 + minutes;
}

function getCurrentDayAndMinutes(timeZone?: string) {
  const now = new Date();

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || DEFAULT_TIMEZONE,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const weekday = parts.find(part => part.type === 'weekday')?.value;
    const hour = Number(parts.find(part => part.type === 'hour')?.value ?? NaN);
    const minute = Number(
      parts.find(part => part.type === 'minute')?.value ?? NaN,
    );

    if (!weekday || Number.isNaN(hour) || Number.isNaN(minute)) {
      throw new Error('Could not parse date parts');
    }

    const dayKey = WEEKDAY_MAP[weekday.toLowerCase().slice(0, 3)] || 'sun';
    return {
      dayKey,
      minutes: hour * 60 + minute,
    };
  } catch {
    const fallbackDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
      now.getDay()
    ];
    return {
      dayKey: fallbackDay,
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

function isScheduleActive(schedule?: Schedule) {
  if (!schedule) {
    return true;
  }

  const { dayKey, minutes } = getCurrentDayAndMinutes(schedule.tz);
  const validDays = Array.isArray(schedule.days)
    ? schedule.days.map(day => String(day).toLowerCase())
    : [];

  if (validDays.length > 0 && !validDays.includes(dayKey)) {
    return false;
  }

  const startMinutes = parseTimeToMinutes(schedule.start, 0);
  const endMinutes = parseTimeToMinutes(schedule.end, 23 * 60 + 59);

  if (startMinutes === endMinutes) {
    return true;
  }

  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes <= endMinutes;
  }

  return minutes >= startMinutes || minutes <= endMinutes;
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
  const sessionUser = getSessionUser();
  const exitPath = sessionUser ? getHomePath(sessionUser) : '/login';
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

      navigate(exitPath, { replace: true });
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [exitPath, navigate]);

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
        .filter(item => isScheduleActive(item.schedule))
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
        .filter(item => isScheduleActive(item.schedule))
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
          Pressione ESC para sair do player
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
    </Box>
  );
}
