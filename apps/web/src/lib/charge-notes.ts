import type { Database } from '@growcold/shared';

type PaymentMethod = Database['public']['Enums']['payment_method'];

const ALLOWED_LABOR: readonly PaymentMethod[] = ['CASH', 'UPI', 'OTHER'];

export interface ChargeNotesAugment {
  labor_payment_method?: PaymentMethod;
  receivable_manual?: boolean;
}

export function parseChargeNotes(raw: string | null): ChargeNotesAugment {
  if (!raw?.trim()) return {};
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const labor = o['labor_payment_method'];
    const manual = o['receivable_manual'];
    let labor_payment_method: PaymentMethod | undefined;
    if (typeof labor === 'string' && (ALLOWED_LABOR as readonly string[]).includes(labor))
      labor_payment_method = labor as PaymentMethod;
    return {
      labor_payment_method,
      receivable_manual: manual === true,
    };
  } catch {
    return {};
  }
}

export function mergeChargeNotes(
  existingRaw: string | null,
  patch: ChargeNotesAugment,
): string | null {
  let base: Record<string, unknown> = {};
  if (existingRaw?.trim()) {
    try {
      base = JSON.parse(existingRaw) as Record<string, unknown>;
    } catch {
      base = { gc_legacy_note: existingRaw };
    }
  }
  const next: Record<string, unknown> = { ...base, ...patch };
  for (const k of Object.keys(next)) {
    const v = next[k];
    if (v === undefined || v === null) delete next[k];
  }
  return Object.keys(next).length > 0 ? JSON.stringify(next) : null;
}
