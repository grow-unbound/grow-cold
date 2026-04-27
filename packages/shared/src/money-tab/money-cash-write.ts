import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../api/types';
import { CreateReceiptRequestSchema } from '../api/endpoints/receipts';
import { CreateWarehouseCashPaymentRequestSchema } from '../api/endpoints/money-tab';
import type { z } from 'zod';

type SB = SupabaseClient<Database>;

export type CreateMoneyReceiptInput = z.infer<typeof CreateReceiptRequestSchema>;
export type CreateMoneyCashPaymentInput = z.infer<typeof CreateWarehouseCashPaymentRequestSchema>;

/** Direct insert; mirrors web POST /api/receipts. */
export async function insertCustomerMoneyReceipt(
  client: SB,
  input: CreateMoneyReceiptInput,
  userId: string,
): Promise<void> {
  const p = CreateReceiptRequestSchema.parse(input);
  const totalNum = Number(p.total_amount);
  if (Number.isNaN(totalNum) || totalNum <= 0) {
    throw new Error('Invalid total_amount');
  }

  const { error } = await client.from('customer_receipts').insert({
    warehouse_id: p.warehouse_id,
    customer_id: p.customer_id,
    receipt_date: p.receipt_date,
    total_amount: totalNum,
    payment_method: p.payment_method ?? null,
    reference_number: p.reference_number ?? null,
    notes: p.notes ?? null,
    recorded_by: userId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function insertWarehouseCashPayment(
  client: SB,
  input: CreateMoneyCashPaymentInput,
  userId: string,
): Promise<{ id: string }> {
  const p = CreateWarehouseCashPaymentRequestSchema.parse(input);
  const totalNum = Number(p.total_amount);
  if (Number.isNaN(totalNum) || totalNum <= 0) {
    throw new Error('Invalid total_amount');
  }

  const { data, error } = await client
    .from('warehouse_cash_payments')
    .insert({
      warehouse_id: p.warehouse_id,
      payment_date: p.payment_date,
      total_amount: totalNum,
      payment_method: p.payment_method ?? null,
      recipient_name: p.recipient_name,
      notes: p.notes ?? null,
      recorded_by: userId,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'insert failed');
  }
  return { id: data.id };
}
