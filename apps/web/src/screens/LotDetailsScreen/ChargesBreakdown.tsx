'use client';

import type { LotDetailChargeRow } from '@growcold/shared';
import { formatINR, summarizeCharges } from '@growcold/shared';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function ChargesBreakdown({ charges }: { charges: LotDetailChargeRow[] }) {
  const { t } = useTranslation('pages');

  if (charges.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
        <p className="text-base font-medium text-neutral-900">{t('lot_detail.charges_empty_title')}</p>
        <p className="text-sm text-neutral-500">{t('lot_detail.charges_empty_body')}</p>
      </div>
    );
  }

  const numeric = charges.map((c) => ({
    charge_amount: Number(c.charge_amount),
    is_paid: c.is_paid,
  }));
  const { total, collected, pending } = summarizeCharges(numeric);

  return (
    <div className="px-4 pb-6 pt-2">
      <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        {t('lot_detail.charges_title')}
      </h3>
      <ul className="mt-3 flex flex-col gap-3">
        {charges.map((c) => {
          const amt = Number(c.charge_amount);
          return (
            <li
              key={c.id}
              className="flex flex-col gap-1 border-b border-neutral-200 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <span className="text-sm text-neutral-800">{c.charge_type_label}</span>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="text-sm font-semibold text-neutral-900">{formatINR(amt)}</span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    c.is_paid ? 'text-[#16A34A]' : 'text-[#DC2626]',
                  )}
                >
                  {c.is_paid ? t('lot_detail.charge_paid') : t('lot_detail.charge_pending')}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t border-neutral-200 pt-4">
        <div className="flex justify-between text-base font-semibold text-neutral-900">
          <span>{t('lot_detail.total_charges')}</span>
          <span>{formatINR(total)}</span>
        </div>
        <div className="mt-2 flex justify-between text-base font-semibold text-neutral-900">
          <span>{t('lot_detail.collected')}</span>
          <span className="text-[#16A34A]">{formatINR(collected)}</span>
        </div>
        <div className="mt-2 flex justify-between text-base font-semibold text-neutral-900">
          <span>{t('lot_detail.pending')}</span>
          <span className="text-[#DC2626]">{formatINR(pending)}</span>
        </div>
      </div>
    </div>
  );
}
