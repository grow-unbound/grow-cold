/** Numeric segment before `/` for warehouse-global sequence (e.g. `000047/300` → 47). */
export function parseLotNumberPrefix(lotNumber: string): number | null {
  const slash = lotNumber.indexOf('/');
  const head = (slash === -1 ? lotNumber : lotNumber.slice(0, slash)).trim();
  if (!head) return null;
  const normalized = head.replace(/^0+/, '') || '0';
  const n = Number.parseInt(normalized, 10);
  return Number.isFinite(n) ? n : null;
}

export function suggestNextLotNumber(lotNumbers: string[], bagCount: number): string {
  let max = 0;
  for (const ln of lotNumbers) {
    const p = parseLotNumberPrefix(ln);
    if (p != null && p > max) max = p;
  }
  const next = max + 1;
  const prefix = String(next).padStart(6, '0');
  return `${prefix}/${bagCount}`;
}
