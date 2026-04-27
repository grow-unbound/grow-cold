import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../api/types';
import {
  CreateStockDeliveryRequestSchema,
  StockTabMovementRowSchema,
} from '../api/endpoints/stock-tab';
import type { z } from 'zod';
import { productGroupToEmoji } from './product-group-emoji';

type SB = SupabaseClient<Database>;

export type CreateStockDeliveryInput = z.infer<typeof CreateStockDeliveryRequestSchema>;

/** Insert delivery and decrement lot balance (RLS must allow). Returns movement row for UI. */
export async function completeStockDelivery(
  client: SB,
  input: CreateStockDeliveryInput,
): Promise<z.infer<typeof StockTabMovementRowSchema>> {
  const p = CreateStockDeliveryRequestSchema.parse(input);

  const { data: lot, error: lotErr } = await client
    .from('lots')
    .select('id, warehouse_id, balance_bags, customer_id, product_id, lot_number')
    .eq('id', p.lot_id)
    .single();

  if (lotErr || !lot) {
    throw new Error('Lot not found');
  }
  if (lot.warehouse_id !== p.warehouse_id) {
    throw new Error('Lot is not in this warehouse');
  }
  if (p.num_bags_out > lot.balance_bags) {
    throw new Error('num_bags_out exceeds balance_bags');
  }

  const { data: inserted, error: insErr } = await client
    .from('deliveries')
    .insert({
      lot_id: p.lot_id,
      num_bags_out: p.num_bags_out,
      delivery_date: p.delivery_date,
      notes: p.notes ?? null,
      driver_name: p.driver_name ?? null,
      vehicle_number: p.vehicle_number ?? null,
      location_ids: p.location_ids ?? [],
      status: 'DELIVERED',
    })
    .select('id, lot_id, delivery_date, created_at, num_bags_out')
    .single();

  if (insErr || !inserted) {
    throw new Error(insErr?.message ?? 'Could not create delivery');
  }

  const newBal = lot.balance_bags - p.num_bags_out;
  const lotUpdate: { balance_bags: number; status?: 'DELIVERED' } = { balance_bags: newBal };
  if (newBal === 0) {
    lotUpdate.status = 'DELIVERED';
  }

  const { error: upErr } = await client.from('lots').update(lotUpdate).eq('id', p.lot_id);
  if (upErr) {
    throw new Error(upErr.message);
  }

  const [{ data: cust }, { data: prod }] = await Promise.all([
    client.from('customers').select('customer_code, customer_name').eq('id', lot.customer_id).single(),
    client.from('products').select('product_name, product_group_id').eq('id', lot.product_id).single(),
  ]);

  let pgName = '';
  if (prod?.product_group_id) {
    const { data: g } = await client
      .from('product_groups')
      .select('name')
      .eq('id', prod.product_group_id)
      .single();
    pgName = g?.name ?? '';
  }

  return StockTabMovementRowSchema.parse({
    kind: 'delivery',
    id: `delivery:${inserted.id}`,
    lotId: inserted.lot_id,
    transactionDate: inserted.delivery_date,
    createdAt: inserted.created_at,
    customerCode: cust?.customer_code ?? '—',
    customerName: cust?.customer_name ?? 'Unknown',
    productName: prod?.product_name ?? 'Unknown',
    productGroupName: pgName,
    productGroupEmoji: productGroupToEmoji(pgName),
    lotNumber: lot.lot_number,
    numBags: inserted.num_bags_out,
  });
}
