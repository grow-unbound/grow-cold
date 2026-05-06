import type { ChargesBootstrapResponse, SaveChargesRequestSchema } from '@/lib/charges-api-schemas';
import type { ChargesSaveDraftRow } from '@/lib/movement-charges-draft';
import type { z } from 'zod';

type Movement = z.infer<typeof SaveChargesRequestSchema>['movement'];

export function buildSaveChargesBody(
  data: ChargesBootstrapResponse['data'],
  draft: Record<string, ChargesSaveDraftRow>,
  movement: Movement,
  deliveryIdSel: string | null,
): z.infer<typeof SaveChargesRequestSchema> {
  const laborPay = (
    tplHasLabor: boolean,
    paid: number,
    m: ChargesSaveDraftRow['method'],
  ): 'CASH' | 'UPI' | 'OTHER' | undefined => {
    if (!tplHasLabor || paid <= 0) return undefined;
    return m === 'CASH' || m === 'UPI' || m === 'OTHER' ? m : undefined;
  };

  return {
    movement,
    delivery_id: movement === 'lodgement' ? null : deliveryIdSel,
    charge_date: data.charge_date,
    rows: data.charge_rows.map((tpl) => {
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
    }),
  };
}
