import type { TFunction } from 'i18next';

/** Map DB payment_method to `pages.money.*` labels. */
export function paymentMethodLabel(m: string | null, t: TFunction<'pages'>): string {
  if (!m) return t('money.method_none');
  if (m === 'CASH') return t('money.method_cash');
  if (m === 'UPI') return t('money.method_upi');
  if (m === 'BANK_TRANSFER') return t('money.method_bank');
  if (m === 'CHEQUE') return t('money.method_cheque');
  if (m === 'OTHER') return t('money.method_other');
  return m;
}
