export function formatLotLocationLabel(
  orderedIds: string[],
  locs: { id: string; name: string }[] | null | undefined,
  legacy: string | null | undefined,
): string {
  if (orderedIds.length > 0 && locs && locs.length > 0) {
    const map = new Map(locs.map((l) => [l.id, l.name]));
    const names = orderedIds.map((id) => map.get(id)).filter((n): n is string => Boolean(n));
    if (names.length > 0) return names.join(', ');
  }
  const leg = legacy?.trim();
  if (leg) return leg;
  return '—';
}
