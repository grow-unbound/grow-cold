import { z } from 'zod';
import {
  CUSTOMER_CATEGORY,
  DELIVERY_STATUS,
  LOT_STATUS,
  PAYMENT_METHOD,
  RENTAL_MODE,
  USER_ROLE,
} from '../constants';

export const uuidSchema = z.string().uuid();

export const lotStatusSchema = z.enum(LOT_STATUS);

export const userRoleSchema = z.enum(USER_ROLE);

export const rentalModeSchema = z.enum(RENTAL_MODE);

export const customerCategorySchema = z.enum(CUSTOMER_CATEGORY);

export const deliveryStatusSchema = z.enum(DELIVERY_STATUS);

export const paymentMethodSchema = z.enum(PAYMENT_METHOD);

export const timestampsSchema = z.object({
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
