import type { ChargesBootstrapResponse } from '@/lib/charges-api-schemas';

export type ChargesSaveDraftRow = {
  bags: number;
  recv: number;
  recvManual: boolean;
  paid: number;
  method: 'CASH' | 'UPI' | 'OTHER' | '';
};

export type RowDraft = ChargesSaveDraftRow & { bagsError?: string; methodError?: string };

type ChargesData = ChargesBootstrapResponse['data'];

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildDraftRecord(d: ChargesData): Record<string, RowDraft> {
  const existingByPct = Object.fromEntries(d.existing.map((e) => [e.product_charge_type_id, e]));
  const out: Record<string, RowDraft> = {};
  for (const row of d.charge_rows) {
    const ex = existingByPct[row.product_charge_type_id];
    let bags = row.is_transport ? 0 : ex?.num_bags ?? row.default_bags ?? 0;
    bags = Number.isFinite(bags) ? Math.max(0, Math.floor(bags)) : 0;
    const rate = row.rate_per_bag ?? 0;
    const recvManual = ex?.receivable_manual ?? false;
    const recv = row.is_transport
      ? round2(ex?.charge_amount ?? 0)
      : recvManual
        ? round2(ex?.charge_amount ?? 0)
        : round2(bags * (rate || 0));
    const paid = round2(Math.max(0, ex?.legacy_amount_paid ?? 0));
    let method: RowDraft['method'] = '';
    if (paid > 0 && row.has_labor) method = ex?.labor_payment_method ?? 'CASH';
    out[row.product_charge_type_id] = { bags, recv, recvManual, paid, method };
  }
  return out;
}
