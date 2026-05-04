import type { RecordDeliveryChargeRow } from '@growcold/shared';
import type { ChargesBootstrapResponse } from '@/lib/charges-api-schemas';
import type { RowDraft } from '@/lib/movement-charges-draft';

type ChargesData = ChargesBootstrapResponse['data'];

/** Map draft + templates to API `charge_rows` (same row shape as SaveCharges). */
export function buildRecordDeliveryChargeRows(
  data: ChargesData,
  draft: Record<string, RowDraft>,
): RecordDeliveryChargeRow[] {
  function laborPay(
    tplHasLabor: boolean,
    paid: number,
    m: RowDraft['method'],
  ): 'CASH' | 'UPI' | 'OTHER' | undefined {
    if (!tplHasLabor || paid <= 0) return undefined;
    return m === 'CASH' || m === 'UPI' || m === 'OTHER' ? m : undefined;
  }

  return data.charge_rows.map((tpl) => {
    const dr = draft[tpl.product_charge_type_id];
    const paid = tpl.has_labor ? dr?.paid ?? 0 : 0;
    return {
      product_charge_type_id: tpl.product_charge_type_id,
      charge_type_code: tpl.charge_type_code,
      bags: tpl.is_transport ? null : dr?.bags ?? 0,
      receivable_amount: dr?.recv ?? 0,
      receivable_manual: !!(dr?.recvManual ?? false),
      labor_paid: tpl.has_labor ? paid : 0,
      labor_payment_method: laborPay(tpl.has_labor, paid, dr?.method ?? ''),
      is_transport: tpl.is_transport,
    };
  });
}
