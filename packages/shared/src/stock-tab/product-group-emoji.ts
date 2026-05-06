/** Map product_groups.name (or normalized key) to display emoji per Stock tab spec. */
const NORMALIZED: Record<string, string> = {
  chillies: '🌶️',
  chilli: '🌶️',
  tamarind: '🍋',
  turmeric: '🟡',
  jaggery: '🍯',
  rice: '🌾',
  pulses: '🫘',
  pulse: '🫘',
  spices: '⭐',
  spice: '⭐',
  seeds: '🌰',
  seed: '🌰',
  grains: '🌽',
  grain: '🌽',
};

function normalizeKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Returns emoji for a product group label (name from DB). */
export function productGroupToEmoji(productGroupName: string | null | undefined): string {
  if (!productGroupName) return '📦';
  const key = normalizeKey(productGroupName);
  if (NORMALIZED[key]) return NORMALIZED[key];
  const first = key.split(/[\s/]+/)[0] ?? key;
  if (NORMALIZED[first]) return NORMALIZED[first];
  return '📦';
}
