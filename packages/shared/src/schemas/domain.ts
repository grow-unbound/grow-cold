import { z } from 'zod';
import {
  customerCategorySchema,
  deliveryStatusSchema,
  lotStatusSchema,
  paymentMethodSchema,
  rentalModeSchema,
  uuidSchema,
} from './common';

const customerCodeSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9./\-]+$/, 'Use letters, digits, / . - only');

export const customerSchema = z.object({
  id: uuidSchema,
  warehouse_id: uuidSchema,
  tenant_id: uuidSchema,
  customer_code: customerCodeSchema,
  customer_name: z.string().min(1),
  phone: z.string().min(1),
  mobile: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  gstin: z.string().nullable().optional(),
  category: customerCategorySchema,
  credit_limit: z.string().nullable(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const productGroupSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  name: z.string().min(1),
  parent_product_group_id: uuidSchema.nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const productSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  product_name: z.string().min(1),
  product_group_id: uuidSchema,
  bag_size: z.number().positive().nullish(),
  monthly_rent_per_kg: z.number().nullish(),
  monthly_rent_per_bag: z.number().nullish(),
  yearly_rent_per_kg: z.number().nullish(),
  yearly_rent_per_bag: z.number().nullish(),
  stale_days_limit: z.number().int().positive().nullable().optional(),
  storage_temperature: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const chargeTypeRowSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  code: z.string().min(1),
  display_name: z.string().min(1),
  sort_order: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const productChargeSchema = z.object({
  product_id: uuidSchema,
  charge_type_id: uuidSchema,
  charges_per_bag: z.string(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const locationSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  warehouse_id: uuidSchema,
  name: z.string().min(1),
  created_at: z.string().datetime({ offset: true }),
});

export const lotSchema = z.object({
  id: uuidSchema,
  lot_number: z.string().regex(/^[A-Za-z0-9]+\/[A-Za-z0-9]+$/),
  warehouse_id: uuidSchema,
  tenant_id: uuidSchema,
  customer_id: uuidSchema,
  product_id: uuidSchema,
  original_bags: z.number().int().nonnegative(),
  balance_bags: z.number().int().nonnegative(),
  lodgement_date: z.string(),
  rental_mode: rentalModeSchema,
  location_ids: z.array(uuidSchema),
  driver_name: z.string().nullable().optional(),
  vehicle_number: z.string().nullable().optional(),
  status: lotStatusSchema,
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const deliverySchema = z.object({
  id: uuidSchema,
  lot_id: uuidSchema,
  num_bags_out: z.number().int().positive(),
  delivery_date: z.string(),
  status: deliveryStatusSchema,
  blocked_reason: z.string().nullable().optional(),
  overridden_by: uuidSchema.nullable().optional(),
  override_reason: z.string().nullable().optional(),
  override_at: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().nullable().optional(),
  driver_name: z.string().nullable().optional(),
  vehicle_number: z.string().nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const transactionChargeSchema = z.object({
  id: uuidSchema,
  delivery_id: uuidSchema,
  lot_id: uuidSchema,
  charge_type_id: uuidSchema,
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
  accrual_from: z.string(),
  accrual_to: z.string(),
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
