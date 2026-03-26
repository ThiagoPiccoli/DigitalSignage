import type { Schedule } from './components/ScheduleFields';

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

export function parseTimeToMinutes(input: string, fallback: number) {
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

export function getCurrentDayAndMinutes(timeZone?: string) {
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

export function isScheduleActive(schedule?: Schedule) {
  if (!schedule) {
    return true;
  }

  const { dayKey, minutes } = getCurrentDayAndMinutes(schedule.tz);
  const validDays = Array.isArray(schedule.days)
    ? schedule.days.map(day => String(day).toLowerCase())
    : [];

  if (validDays.length === 0) {
    return false;
  }

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
