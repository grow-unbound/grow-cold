import { z } from 'zod';
import { lotDetailRowSchema } from './lots';

/** Labor line matches Add Charges rows (reuse validation shape). */
export const RecordDeliveryChargeRowSchema = z
  .object({
    product_charge_type_id: z.string().uuid(),
    charge_type_code: z.string(),
    bags: z.number().int().nonnegative().nullable(),
    receivable_amount: z.number().finite().nonnegative(),
    receivable_manual: z.boolean(),
    labor_paid: z.number().finite().nonnegative(),
    labor_payment_method: z.enum(['CASH', 'UPI', 'OTHER']).nullish(),
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

export type RecordDeliveryChargeRow = z.infer<typeof RecordDeliveryChargeRowSchema>;

export const RecordDeliveryRequestSchema = z.object({
  warehouse_id: z.string().uuid(),
  num_bags_out: z.number().int().positive(),
  /** Non-empty subset of lot.location_ids */
  location_ids: z.array(z.string().uuid()).min(1),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).optional(),
  /** Applied to each labor operational_payment row; defaults server-side to delivery_date or today. */
  labor_payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  charge_rows: z.array(RecordDeliveryChargeRowSchema).optional(),
});

export type RecordDeliveryRequest = z.infer<typeof RecordDeliveryRequestSchema>;

export const recordDeliveryHttpPath = (lotId: string) => `/api/lots/${lotId}/deliveries` as const;

export const RecordDeliveryResponseSchema = z.object({
  data: z.object({
    delivery_id: z.string().uuid(),
    lot: lotDetailRowSchema,
  }),
});

export type RecordDeliveryResponse = z.infer<typeof RecordDeliveryResponseSchema>;
