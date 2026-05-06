import type { ChargeNotesAugment } from '@/lib/charge-notes';
import { mergeChargeNotes } from '@/lib/charge-notes';
import type { SaveChargesRowSchema } from '@/lib/charges-api-schemas';
import { fetchStockMovementPaymentTypeId } from '@/lib/stock-movement-payment-type';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@growcold/shared';
import type { z } from 'zod';

type SB = SupabaseClient<Database>;
type LotRow = Database['public']['Tables']['lots']['Row'];
type SaveRow = z.infer<typeof SaveChargesRowSchema>;

function isTransportRow(row: SaveRow): boolean {
  return row.is_transport === true;
}

export async function deleteAndInsertChargesForLotMovement(params: {
  supabase: SB;
  userId: string;
  lot: LotRow;
  lotId: string;
  movement: 'lodgement' | 'delivery';
  deliveryId: string | null;
  chargeDateYYYYMMDD: string;
  rows: SaveRow[];
  laborPaymentDateYYYYMMDD: string;
}): Promise<{ ok: true } | { error: string; code: string; status?: number }> {
  const {
    supabase,
    userId,
    lot,
    lotId,
    movement,
    deliveryId,
    chargeDateYYYYMMDD,
    rows,
    laborPaymentDateYYYYMMDD,
  } = params;

  const paymentTypeId = await fetchStockMovementPaymentTypeId(supabase, lot.tenant_id);
  if (!paymentTypeId) {
    return { error: 'Missing payment_types seed for STOCK_MOVEMENT', code: 'DB_ERROR', status: 500 };
  }

  let delTc = supabase.from('transaction_charges').delete().eq('lot_id', lotId).eq('charge_date', chargeDateYYYYMMDD);
  delTc = movement === 'lodgement' ? delTc.is('delivery_id', null) : delTc.eq('delivery_id', deliveryId!);

  let delOp = supabase
    .from('operational_payments')
    .delete()
    .eq('lot_id', lotId)
    .eq('warehouse_id', lot.warehouse_id)
    .eq('payment_type_id', paymentTypeId);
  delOp = movement === 'lodgement' ? delOp.is('delivery_id', null) : delOp.eq('delivery_id', deliveryId!);

  const [{ error: delTcErr }, { error: delOpErr }] = await Promise.all([delTc, delOp]);
  if (delTcErr) {
    console.error(delTcErr);
    return { error: 'Delete transaction_charges failed', code: 'DB_ERROR', status: 500 };
  }
  if (delOpErr) {
    console.error(delOpErr);
    return { error: 'Delete operational_payments failed', code: 'DB_ERROR', status: 500 };
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
        lot_id: lotId,
        delivery_id: movement === 'lodgement' ? null : deliveryId,
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
      opInserts.push({
        warehouse_id: lot.warehouse_id,
        tenant_id: lot.tenant_id,
        payment_type_id: paymentTypeId,
        status: 'PAID',
        payment_date: laborPaymentDateYYYYMMDD,
        amount: paid,
        payment_method: r.labor_payment_method,
        delivery_id: movement === 'lodgement' ? null : deliveryId,
        lot_id: lotId,
        product_charge_type_id: r.product_charge_type_id,
        recorded_by: userId,
      });
    }
  }

  if (tcInserts.length > 0) {
    const { error: tcErr } = await supabase.from('transaction_charges').insert(tcInserts);
    if (tcErr) {
      console.error(tcErr);
      return { error: tcErr.message, code: 'DB_ERROR', status: 500 };
    }
  }
  if (opInserts.length > 0) {
    const { error: opErr } = await supabase.from('operational_payments').insert(opInserts);
    if (opErr) {
      console.error(opErr);
      return { error: opErr.message, code: 'DB_ERROR', status: 500 };
    }
  }

  return { ok: true };
}
