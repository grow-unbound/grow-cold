import { format, formatDistanceToNow, parseISO } from 'date-fns';

/** DD/MM/YYYY for display (pass Date or ISO string). */
export function formatDate(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** e.g. "2 hours ago" — for cache / sync timestamps. */
export function formatUpdatedAgo(timestampMs: number): string {
  return formatDistanceToNow(timestampMs, { addSuffix: true });
}

/** `YYYY-MM-DD` → locale medium date (e.g. Apr 12, 2024). */
export function formatYmdLong(ymd: string, locale?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return dt.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** e.g. Apr 20, 2024 2:15 PM — for money transaction "recorded at" line. */
export function formatMoneyTransactionDateTime(iso: string): string {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'MMM d, y h:mm a');
}
