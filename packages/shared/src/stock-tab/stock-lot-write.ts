import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../api/types';
import { CreateLotRequestSchema } from '../api/endpoints/lots';
import type { z } from 'zod';

type SB = SupabaseClient<Database>;

export type CreateLotInput = z.infer<typeof CreateLotRequestSchema>;

/** Insert lot (RLS must allow; mirrors web POST /api/lots body). */
export async function insertWarehouseLot(client: SB, input: CreateLotInput): Promise<void> {
  const p = CreateLotRequestSchema.parse(input);
  const balance = p.balance_bags ?? p.original_bags;
  if (balance > p.original_bags) {
    throw new Error('balance_bags cannot exceed original_bags');
  }

  const { error } = await client.from('lots').insert({
    warehouse_id: p.warehouse_id,
    customer_id: p.customer_id,
    product_id: p.product_id,
    lot_number: p.lot_number,
    original_bags: p.original_bags,
    balance_bags: balance,
    lodgement_date: p.lodgement_date,
    rental_mode: p.rental_mode,
    location_ids: p.location_ids ?? [],
    driver_name: p.driver_name ?? null,
    vehicle_number: p.vehicle_number ?? null,
    notes: p.notes ?? null,
    status: 'ACTIVE',
  });

  if (error) {
    throw new Error(error.message);
  }
}
