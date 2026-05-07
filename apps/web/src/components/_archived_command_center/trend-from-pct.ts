export function trendLabelFromPct(
  pct: number | null,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  if (pct === null) return t('no_compare');
  if (pct === 0) return t('trend_same');
  if (pct > 0) return t('trend_up', { pct });
  return t('trend_down', { pct: Math.abs(pct) });
}
