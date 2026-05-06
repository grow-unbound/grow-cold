import { z } from 'zod';
import { opPaymentStatusSchema, paymentMethodSchema, uuidSchema } from '../../schemas/common';

export const listOperationalPaymentsHttpPath = '/api/operational-payments' as const;

export function getOperationalPaymentHttpPath(id: string): string {
  return `${listOperationalPaymentsHttpPath}/${id}`;
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const operationalPaymentRowSchema = z.object({
  id: uuidSchema,
  warehouse_id: uuidSchema,
  payment_type_id: uuidSchema.nullable(),
  expenditure_head: z.string().nullable(),
  status: opPaymentStatusSchema,
  due_date: z.string().nullable(),
  payment_date: z.string().nullable(),
  amount: z.union([z.number(), z.string()]).transform((v) => String(v)),
  payment_method: z.string().nullable(),
  delivery_id: uuidSchema.nullable(),
  lot_id: uuidSchema.nullable(),
  party_name: z.string().nullable(),
  party_phone: z.string().nullable(),
  notes: z.string().nullable(),
  recorded_by: uuidSchema.nullable(),
  external_reference_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type OperationalPaymentRow = z.infer<typeof operationalPaymentRowSchema>;

export const GetOperationalPaymentResponseSchema = z.object({
  data: operationalPaymentRowSchema,
});

export const CreateOperationalPaymentRequestSchema = z
  .object({
    warehouse_id: uuidSchema,
    payment_type_id: uuidSchema,
    amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
    payment_method: paymentMethodSchema,
    status: opPaymentStatusSchema,
    payment_date: isoDate,
    due_date: isoDate.optional(),
    lot_id: uuidSchema.optional(),
    delivery_id: uuidSchema.optional(),
    party_name: z.string().max(200).optional(),
    party_phone: z
      .string()
      .max(20)
      .optional()
      .refine((s) => !s || s.length === 0 || /^\d{10}$/.test(s), '10-digit mobile'),
    notes: z.string().max(2000).optional(),
    expenditure_head: z.string().max(200).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.delivery_id && !val.lot_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lot_id required when delivery_id is set' });
    }
  });

export type CreateOperationalPaymentRequest = z.infer<typeof CreateOperationalPaymentRequestSchema>;

export const CreateOperationalPaymentResponseSchema = z.object({
  data: operationalPaymentRowSchema,
});

export const UpdateOperationalPaymentRequestSchema = z
  .object({
    payment_type_id: uuidSchema.optional(),
    amount: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
    payment_method: paymentMethodSchema.optional(),
    status: opPaymentStatusSchema.optional(),
    payment_date: isoDate.nullable().optional(),
    due_date: isoDate.nullable().optional(),
    lot_id: uuidSchema.nullable().optional(),
    delivery_id: uuidSchema.nullable().optional(),
    party_name: z.string().max(200).nullable().optional(),
    party_phone: z
      .string()
      .max(20)
      .nullable()
      .optional()
      .refine((s) => s == null || s === '' || /^\d{10}$/.test(s), '10-digit mobile'),
    notes: z.string().max(2000).nullable().optional(),
    expenditure_head: z.string().max(200).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.delivery_id && !val.lot_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'lot_id required when delivery_id is set' });
    }
  });

export type UpdateOperationalPaymentRequest = z.infer<typeof UpdateOperationalPaymentRequestSchema>;

export const UpdateOperationalPaymentResponseSchema = GetOperationalPaymentResponseSchema;
