import { z } from 'zod';
import { uuidSchema } from './common';

export const tenantSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  created_at: z.string().datetime({ offset: true }),
});

export const warehouseSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  warehouse_name: z.string().min(1),
  warehouse_code: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().nullable().optional(),
  manager_name: z.string().nullable().optional(),
  manager_phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  capacity_bags: z.number().int().nonnegative().default(10000),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const userProfileSchema = z.object({
  id: uuidSchema,
  phone: z.string().min(1),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const userRoleRowSchema = z.object({
  user_id: uuidSchema,
  tenant_id: uuidSchema,
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']),
});

export const userWarehouseAssignmentSchema = z.object({
  user_id: uuidSchema,
  warehouse_id: uuidSchema,
  assigned_at: z.string().datetime({ offset: true }),
});
