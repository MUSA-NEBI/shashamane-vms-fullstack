import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try { return format(typeof date === 'string' ? parseISO(date) : date, fmt); }
  catch { return '—'; }
};

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, HH:mm');
export const formatTime     = (date) => formatDate(date, 'HH:mm');
export const formatRelative = (date) => {
  if (!date) return '—';
  try { return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true }); }
  catch { return '—'; }
};

export const formatCurrency = (amount, currency = 'ETB') => {
  if (amount == null) return '—';
  return `${currency} ${Number(amount).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const statusLabel = (status) =>
  status ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';
