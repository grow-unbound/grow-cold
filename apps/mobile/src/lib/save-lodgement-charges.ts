import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@growcold/shared';
import {
  STOCK_MOVEMENT_PAYMENT_TYPE_CATEGORY,
  STOCK_MOVEMENT_PAYMENT_TYPE_NAME,
} from '@growcold/shared';

type SB = SupabaseClient<Database>;
type PaymentMethod = Database['public']['Enums']['payment_method'];
type LotRow = Database['public']['Tables']['lots']['Row'];

const ALLOWED_LABOR: readonly PaymentMethod[] = ['CASH', 'UPI', 'OTHER'];

interface ChargeNotesAugment {
  receivable_manual?: boolean;
}

function mergeChargeNotes(existingRaw: string | null, patch: ChargeNotesAugment): string | null {
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

export interface LodgementSaveChargeRow {
  product_charge_type_id: string;
  charge_type_code: string;
  bags: number | null;
  receivable_amount: number;
  receivable_manual: boolean;
  labor_paid: number;
  labor_payment_method: 'CASH' | 'UPI' | 'OTHER' | null | undefined;
  is_transport: boolean;
}

async function fetchStockMovementPaymentTypeId(supabase: SB, tenantId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('payment_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('category', STOCK_MOVEMENT_PAYMENT_TYPE_CATEGORY)
    .eq('name', STOCK_MOVEMENT_PAYMENT_TYPE_NAME)
    .eq('is_active', true)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return data?.id ?? null;
}

function isTransportRow(row: LodgementSaveChargeRow): boolean {
  return row.is_transport === true;
}

/** Persist lodgement-side charges for a lot (same rules as web POST /api/lots/:id/charges). */
export async function saveLodgementChargesMobile(params: {
  supabase: SB;
  userId: string;
  lot: LotRow;
  chargeDateYYYYMMDD: string;
  laborPaymentDateYYYYMMDD: string;
  rows: LodgementSaveChargeRow[];
}): Promise<{ ok: true } | { error: string }> {
  const { supabase, userId, lot, chargeDateYYYYMMDD, laborPaymentDateYYYYMMDD, rows } = params;

  const paymentTypeId = await fetchStockMovementPaymentTypeId(supabase, lot.tenant_id);
  if (!paymentTypeId) {
    return { error: 'Missing payment_types seed for STOCK_MOVEMENT' };
  }

  let delTc = supabase
    .from('transaction_charges')
    .delete()
    .eq('lot_id', lot.id)
    .eq('charge_date', chargeDateYYYYMMDD)
    .is('delivery_id', null);

  let delOp = supabase
    .from('operational_payments')
    .delete()
    .eq('lot_id', lot.id)
    .eq('warehouse_id', lot.warehouse_id)
    .eq('payment_type_id', paymentTypeId)
    .is('delivery_id', null);

  const [{ error: delTcErr }, { error: delOpErr }] = await Promise.all([delTc, delOp]);
  if (delTcErr) {
    console.error(delTcErr);
    return { error: delTcErr.message };
  }
  if (delOpErr) {
    console.error(delOpErr);
    return { error: delOpErr.message };
  }

  const tcInserts: Database['public']['Tables']['transaction_charges']['Insert'][] = [];
  const opInserts: Database['public']['Tables']['operational_payments']['Insert'][] = [];

  for (const r of rows) {
    const recv = Number(Number(r.receivable_amount).toFixed(2));
    const paid = Number(Number(r.labor_paid).toFixed(2));
    if (recv <= 0 && paid <= 0) continue;

    const transport = isTransportRow(r);
    const notesPatch: ChargeNotesAugment = {};
    if (r.receivable_manual) notesPatch.receivable_manual = true;
    const notes = mergeChargeNotes(null, notesPatch);

    if (recv > 0) {
      tcInserts.push({
        lot_id: lot.id,
        delivery_id: null,
        product_charge_type_id: r.product_charge_type_id,
        charge_amount: recv,
        charge_date: chargeDateYYYYMMDD,
        num_bags: transport ? null : r.bags ?? 0,
        legacy_amount_paid: null,
        is_paid: false,
        paid_date: null,
        notes,
      });
    }

    if (!transport && paid > 0 && r.labor_payment_method) {
      const meth = r.labor_payment_method;
      if (!(ALLOWED_LABOR as readonly string[]).includes(meth)) {
        return { error: 'Invalid labor payment method' };
      }
      opInserts.push({
        warehouse_id: lot.warehouse_id,
        tenant_id: lot.tenant_id,
        payment_type_id: paymentTypeId,
        status: 'PAID',
        payment_date: laborPaymentDateYYYYMMDD,
        amount: paid,
        payment_method: meth,
        delivery_id: null,
        lot_id: lot.id,
        product_charge_type_id: r.product_charge_type_id,
        recorded_by: userId,
      });
    }
  }

  if (tcInserts.length > 0) {
    const { error: tcErr } = await supabase.from('transaction_charges').insert(tcInserts);
    if (tcErr) {
      console.error(tcErr);
      return { error: tcErr.message };
    }
  }
  if (opInserts.length > 0) {
    const { error: opErr } = await supabase.from('operational_payments').insert(opInserts);
    if (opErr) {
      console.error(opErr);
      return { error: opErr.message };
    }
  }

  return { ok: true };
}
