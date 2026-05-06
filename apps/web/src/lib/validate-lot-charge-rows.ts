import type { SaveChargesRowSchema } from '@/lib/charges-api-schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@growcold/shared';
import type { z } from 'zod';

type SB = SupabaseClient<Database>;
type LotRow = Database['public']['Tables']['lots']['Row'];
type SaveRow = z.infer<typeof SaveChargesRowSchema>;

function normalizeChargeCode(c: string): string {
  return c.trim().toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
}

export interface ValidateLotChargeRowsOptions {
  /** Max bags for non-transport rows (default: lot.original_bags) */
  maxBagsNonTransport?: number;
}

/**
 * Mirrors POST /charges row checks. Returns whether any row has receivable or labor > 0.
 */
export async function validateLotChargeRows(
  supabase: SB,
  lot: LotRow,
  rows: SaveRow[],
  options?: ValidateLotChargeRowsOptions,
): Promise<
  | { ok: true; hasPositive: boolean }
  | { ok: false; status: number; message: string; code: string }
> {
  const maxBags = options?.maxBagsNonTransport ?? lot.original_bags;

  const pctIds = new Set(rows.map((r) => r.product_charge_type_id));
  if (pctIds.size === 0) {
    return { ok: true, hasPositive: false };
  }

  const { data: pcsVerify } = await supabase
    .from('product_charges')
    .select(
      `
      product_charge_type_id,
      charge_types!inner(code, tenant_id, is_active)
    `,
    )
    .eq('product_id', lot.product_id)
    .in('product_charge_type_id', [...pctIds]);

  const pctOk = new Set((pcsVerify ?? []).map((p) => p.product_charge_type_id));
  const byPct = Object.fromEntries(
    (pcsVerify ?? []).map((p) => {
      const ct = p.charge_types as unknown as { code: string; tenant_id: string; is_active: boolean };
      return [p.product_charge_type_id, ct];
    }),
  );

  let hasPositive = false;
  for (const r of rows) {
    const recv = Number(Number(r.receivable_amount).toFixed(2));
    const paid = Number(Number(r.labor_paid).toFixed(2));
    if (!pctOk.has(r.product_charge_type_id)) {
      return { ok: false, status: 400, message: 'Invalid charge row', code: 'VALIDATION_ERROR' };
    }
    const meta = byPct[r.product_charge_type_id];
    if (
      !meta?.is_active ||
      meta.tenant_id !== lot.tenant_id ||
      meta.code.trim().toUpperCase() === 'RENT'
    ) {
      return { ok: false, status: 400, message: 'Invalid charge type', code: 'VALIDATION_ERROR' };
    }
    if (normalizeChargeCode(r.charge_type_code) !== normalizeChargeCode(meta.code)) {
      return { ok: false, status: 400, message: 'Charge code mismatch', code: 'VALIDATION_ERROR' };
    }

    const transport = normalizeChargeCode(meta.code) === 'TRANSPORT';
    if (transport !== r.is_transport) {
      return { ok: false, status: 400, message: 'Transport flag mismatch', code: 'VALIDATION_ERROR' };
    }
    if (!transport && (r.bags == null || r.bags < 0 || r.bags > maxBags)) {
      return { ok: false, status: 400, message: 'Bags exceed allowed max', code: 'VALIDATION_ERROR' };
    }
    if (transport && r.bags != null && r.bags !== 0) {
      return { ok: false, status: 400, message: 'Transport has no bags', code: 'VALIDATION_ERROR' };
    }
    if (!transport && paid > 0 && !r.labor_payment_method) {
      return {
        ok: false,
        status: 400,
        message: 'Labor payment method required',
        code: 'VALIDATION_ERROR',
      };
    }
    if (recv > 0 || paid > 0) hasPositive = true;
  }

  return { ok: true, hasPositive };
}
