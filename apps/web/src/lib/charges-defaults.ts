/** Normalize charge type code matching (DB uses underscores). */
export function defaultBagsForChargeCode(codeRaw: string, originalBags: number): number | null {
  const code = codeRaw.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (code === 'TRANSPORT') return null;
  if (code === 'HAMALI' || code === 'MAMULLE') return originalBags;
  return 0;
}

export function chargeCodeIsTransport(codeRaw: string): boolean {
  return codeRaw.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_') === 'TRANSPORT';
}

export function isoDateYYYYMMDD(d: string): string {
  return d.includes('T') ? d.slice(0, 10) : d;
}

export function isoDateDisplayDDMMYYYY(raw: string): string {
  const d = isoDateYYYYMMDD(raw);
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return '';
  return `${day}/${m}/${y}`;
}
