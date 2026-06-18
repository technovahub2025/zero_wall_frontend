import { format } from 'date-fns';

export const INDIA_TIME_ZONE = 'Asia/Kolkata';

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  const date = toDate(value);
  return date ? format(date, pattern) : '-';
}

function formatParts(value, options = {}) {
  const date = toDate(value);
  if (!date) return '-';

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIME_ZONE,
    ...options,
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  const hour = parts.hour || '00';
  const minute = parts.minute || '00';
  const second = parts.second ? `:${parts.second}` : '';
  const dayPeriod = parts.dayPeriod ? ` ${parts.dayPeriod.toUpperCase()}` : '';

  if (options.year && options.month && options.day && (options.hour || options.minute)) {
    return `${parts.day} ${parts.month} ${parts.year}, ${hour}:${minute}${second}${dayPeriod}`;
  }

  if (options.hour || options.minute) {
    return `${hour}:${minute}${second}${dayPeriod}`;
  }

  return `${parts.day} ${parts.month} ${parts.year}`;
}

export function formatIndiaDate(value) {
  return formatParts(value, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatIndiaTime(value) {
  return formatParts(value, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatIndiaDateTime(value) {
  return formatParts(value, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatIndiaMinutesToTime(minutes = 0) {
  const total = Number(minutes || 0);
  if (!Number.isFinite(total)) return '-';
  const hours = Math.floor(total / 60);
  const mins = Math.round(total % 60);
  const normalizedHours = ((hours % 24) + 24) % 24;
  const period = normalizedHours >= 12 ? 'PM' : 'AM';
  const displayHours = normalizedHours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
}

export function parseIndiaTimeInput(value) {
  const input = String(value || '').trim().toLowerCase();
  if (!input) return null;

  const match = input.match(/^(\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return null;

  if (meridiem) {
    const isPM = meridiem.toLowerCase() === 'pm';
    if (hours === 12) hours = isPM ? 12 : 0;
    else if (isPM) hours += 12;
  }

  if (hours > 23 || hours < 0) return null;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatCurrency(value, prefix = 'Rs.', suffix = 'L') {
  const amount = Number(value || 0);
  return `${prefix} ${amount.toFixed(2)}${suffix ? ` ${suffix}` : ''}`.trim();
}

export function formatPercent(value) {
  const number = Number(value || 0);
  return `${Math.round(number)}%`;
}

export function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? new Intl.NumberFormat('en-IN').format(number) : '0';
}
