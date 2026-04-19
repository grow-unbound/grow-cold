export const LOT_STATUS = [
  'ACTIVE',
  'STALE',
  'DELIVERED',
  'CLEARED',
  'WRITTEN_OFF',
  'DISPUTED',
] as const;

export const USER_ROLE = ['OWNER', 'MANAGER', 'STAFF'] as const;

export const RENTAL_MODE = ['YEARLY', 'MONTHLY', 'BROUGHT_FORWARD'] as const;

/** Default `charge_types.code` values seeded per tenant (DB is source of truth). */
export const DEFAULT_CHARGE_TYPE_CODES = [
  'HAMALI',
  'PLATFORM',
  'KATA_COOLIE',
  'MAMULLE',
] as const;

export const CUSTOMER_CATEGORY = ['TRADER', 'FARMER'] as const;

export const DELIVERY_STATUS = ['SCHEDULED', 'DELIVERED', 'BLOCKED'] as const;

export const PAYMENT_METHOD = [
  'CASH',
  'BANK_TRANSFER',
  'CHEQUE',
  'UPI',
  'OTHER',
] as const;

export type LotStatus = (typeof LOT_STATUS)[number];
export type UserRole = (typeof USER_ROLE)[number];
export type RentalMode = (typeof RENTAL_MODE)[number];
export type DefaultChargeTypeCode = (typeof DEFAULT_CHARGE_TYPE_CODES)[number];
export type CustomerCategory = (typeof CUSTOMER_CATEGORY)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUS)[number];
export type PaymentMethod = (typeof PAYMENT_METHOD)[number];
