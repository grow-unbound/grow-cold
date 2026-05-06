import { formatINR } from '../format/inr';

export { formatINR };

/** Indian short scale: K / L / Cr per HOME_TAB edge cases. */
export function formatIndianNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs < 1000) return `${sign}${Math.round(abs)}`;
  if (abs < 100000) return `${sign}${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (abs < 10000000) return `${sign}${(abs / 100000).toFixed(2).replace(/\.?0+$/, '')}L`;
  return `${sign}${(abs / 10000000).toFixed(2).replace(/\.?0+$/, '')}Cr`;
}

export function pctVsPrevious(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
