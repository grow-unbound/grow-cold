import type { ListLotRow, LotDetailChargeRow, LotDetailData, LotDetailDeliveryRow } from '../api/endpoints/lots';

function decStr(n: number): string {
  return String(n);
}

export interface MapLotDetailChargeInput {
  id: string;
  charge_type_label: string;
  charge_amount: number;
  is_paid: boolean;
  charge_date: string;
}

export interface MapLotDetailInput {
  lotRow: ListLotRow;
  customer_code: string;
  location_label: string;
  deliveries: LotDetailDeliveryRow[];
  charges: MapLotDetailChargeInput[];
}

/** Sort deliveries newest first; stringify charge amounts for API shape. */
export function mapToLotDetailData(input: MapLotDetailInput): LotDetailData {
  const deliveries = [...input.deliveries].sort((a, b) => b.delivery_date.localeCompare(a.delivery_date));
  const delivered_bags_sum = deliveries.reduce((s, d) => s + d.num_bags_out, 0);
  const delivery_count = deliveries.length;

  const charges: LotDetailChargeRow[] = input.charges.map((c) => ({
    id: c.id,
    charge_type_label: c.charge_type_label,
    charge_amount: decStr(c.charge_amount),
    is_paid: c.is_paid,
    charge_date: c.charge_date,
  }));

  return {
    ...input.lotRow,
    customer_code: input.customer_code,
    location_label: input.location_label,
    delivered_bags_sum,
    delivery_count,
    deliveries,
    charges,
  };
}
