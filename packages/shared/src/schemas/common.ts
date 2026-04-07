import { z } from 'zod';
import {
  CHARGE_TYPE,
  LOT_STATUS,
  PAYMENT_METHOD,
  RENTAL_MODE,
  USER_ROLE,
} from '../constants';

export const uuidSchema = z.string().uuid();

export const lotStatusSchema = z.enum(LOT_STATUS);

export const userRoleSchema = z.enum(USER_ROLE);

export const rentalModeSchema = z.enum(RENTAL_MODE);

export const chargeTypeSchema = z.enum(CHARGE_TYPE);

export const paymentMethodSchema = z.enum(PAYMENT_METHOD);

export const timestampsSchema = z.object({
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
