import { z } from 'zod';

export const ChargesBootstrapMovementSchema = z.enum(['lodgement', 'delivery']);

export const ChargesBootstrapRowSchema = z.object({
  charge_type_id: z.string().uuid(),
  charge_type_code: z.string(),
  display_name: z.string(),
  product_charge_type_id: z.string().uuid(),
  /** Raw product_charges.charges_per_bag */
  charges_per_bag: z.string().nullable(),
  /** Parsed rate per bag; null if unavailable / transport */
  rate_per_bag: z.number().nullable(),
  /** Default bags for row; null = transport (no bags) */
  default_bags: z.number().int().nullable(),
  is_transport: z.boolean(),
  has_labor: z.boolean(),
});

export const ChargesBootstrapDeliverySchema = z.object({
  id: z.string().uuid(),
  num_bags_out: z.number().int(),
  delivery_date: z.string(),
});

export const ChargesBootstrapLotSchema = z.object({
  id: z.string().uuid(),
  lot_number: z.string(),
  lodgement_date: z.string(),
  original_bags: z.number().int(),
  balance_bags: z.number().int(),
  warehouse_id: z.string().uuid(),
  customer_id: z.string().uuid(),
});

export const ChargesBootstrapPartySchema = z.object({
  customer_code: z.string(),
  customer_name: z.string(),
});

export const ChargesBootstrapExistingRowSchema = z.object({
  id: z.string().uuid(),
  product_charge_type_id: z.string().uuid(),
  charge_amount: z.number(),
  num_bags: z.number().int().nullable(),
  legacy_amount_paid: z.number().nullable(),
  receivable_manual: z.boolean(),
  labor_payment_method: z.enum(['CASH', 'UPI', 'OTHER']).nullable(),
});

export const ChargesBootstrapResponseSchema = z.object({
  data: z.object({
    lot: ChargesBootstrapLotSchema,
    party: ChargesBootstrapPartySchema,
    deliveries: z.array(ChargesBootstrapDeliverySchema),
    charge_rows: z.array(ChargesBootstrapRowSchema),
    movement: ChargesBootstrapMovementSchema,
    charge_date: z.string(),
    delivery_id: z.string().uuid().nullable(),
    existing: z.array(ChargesBootstrapExistingRowSchema),
  }),
});

export type ChargesBootstrapResponse = z.infer<typeof ChargesBootstrapResponseSchema>;

export const LotDeliveriesResponseSchema = z.object({
  data: z.object({
    deliveries: z.array(ChargesBootstrapDeliverySchema),
  }),
});

const LaborPaymentSchema = z.enum(['CASH', 'UPI', 'OTHER']);

export const SaveChargesRowSchema = z
  .object({
    product_charge_type_id: z.string().uuid(),
    charge_type_code: z.string(),
    bags: z.number().int().nonnegative().nullable(),
    receivable_amount: z.number().finite().nonnegative(),
    receivable_manual: z.boolean(),
    labor_paid: z.number().finite().nonnegative(),
    labor_payment_method: LaborPaymentSchema.nullish(),
    is_transport: z.boolean(),
  })
  .superRefine((row, ctx) => {
    if (row.is_transport) return;
    if (row.labor_paid > 0 && row.labor_payment_method == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payment method required when labor paid > 0',
        path: ['labor_payment_method'],
      });
    }
  });

export const SaveChargesRequestSchema = z.object({
  movement: ChargesBootstrapMovementSchema,
  delivery_id: z.string().uuid().nullable(),
  charge_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Fallback for labor operational_payment.payment_date — defaults server-side to charge_date. */
  labor_payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rows: z.array(SaveChargesRowSchema).min(1),
});

export const SaveChargesResponseSchema = z.object({
  data: z.object({ ok: z.literal(true) }),
  error: z.null(),
});

export type SaveChargesResponse = z.infer<typeof SaveChargesResponseSchema>;
