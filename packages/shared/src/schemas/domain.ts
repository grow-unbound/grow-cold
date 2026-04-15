import { z } from 'zod';
import {
  chargeTypeSchema,
  lotStatusSchema,
  paymentMethodSchema,
  rentalModeSchema,
  uuidSchema,
} from './common';

export const customerSchema = z.object({
  id: uuidSchema,
  warehouse_id: uuidSchema,
  tenant_id: uuidSchema,
  customer_name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().nullable().optional(),
  gstin: z.string().nullable().optional(),
  credit_limit: z.string().nullable(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const productSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  product_name: z.string().min(1),
  product_group_id: uuidSchema.nullable().optional(),
  stale_days_limit: z.number().int().positive().nullable().optional(),
  storage_temperature: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const lotSchema = z.object({
  id: uuidSchema,
  warehouse_id: uuidSchema,
  tenant_id: uuidSchema,
  customer_id: uuidSchema,
  product_id: uuidSchema,
  original_bags: z.number().int().nonnegative(),
  balance_bags: z.number().int().nonnegative(),
  lodgement_date: z.string(),
  rental_mode: rentalModeSchema,
  rental_amount: z.string(),
  status: lotStatusSchema,
  charges_frozen: z.boolean(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const deliverySchema = z.object({
  id: uuidSchema,
  lot_id: uuidSchema,
  num_bags_out: z.number().int().positive(),
  delivery_date: z.string(),
  status: z.string(),
  blocked_reason: z.string().nullable().optional(),
  overridden_by: uuidSchema.nullable().optional(),
  override_reason: z.string().nullable().optional(),
  override_at: z.string().datetime({ offset: true }).nullable().optional(),
  delivery_notes: z.string().nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const transactionChargeSchema = z.object({
  id: uuidSchema,
  delivery_id: uuidSchema,
  lot_id: uuidSchema,
  charge_type: chargeTypeSchema,
  charge_amount: z.string(),
  rate_per_unit: z.string().nullable().optional(),
  is_paid: z.boolean(),
  paid_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const rentAccrualSchema = z.object({
  id: uuidSchema,
  lot_id: uuidSchema,
  accrual_date: z.string(),
  rental_amount: z.string(),
  rental_mode: rentalModeSchema,
  is_paid: z.boolean(),
  paid_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const customerReceiptSchema = z.object({
  id: uuidSchema,
  customer_id: uuidSchema,
  warehouse_id: uuidSchema,
  tenant_id: uuidSchema,
  receipt_date: z.string(),
  total_amount: z.string(),
  payment_method: paymentMethodSchema.nullable().optional(),
  reference_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  recorded_by: uuidSchema.nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const receiptAllocationSchema = z.object({
  id: uuidSchema,
  receipt_id: uuidSchema,
  rent_accrual_id: uuidSchema.nullable().optional(),
  charge_id: uuidSchema.nullable().optional(),
  amount: z.string(),
  allocated_by: uuidSchema.nullable().optional(),
  allocated_manually: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
