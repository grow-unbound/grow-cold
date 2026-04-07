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

export const CHARGE_TYPE = [
  'HAMALI',
  'PLATFORM',
  'KATA_COOLIE',
  'MAMULLE',
] as const;

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
export type ChargeType = (typeof CHARGE_TYPE)[number];
export type PaymentMethod = (typeof PAYMENT_METHOD)[number];
