'use client';

import { useTranslation } from 'react-i18next';

export function AllocationBreakdown() {
  const { t } = useTranslation('pages');
  return (
    <section className="mt-6" aria-labelledby="allocation-heading">
      <h2 id="allocation-heading" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {t('transaction_detail.section_allocation')}
      </h2>
      <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4 text-center">
        <p className="text-sm font-semibold text-neutral-500">{t('transaction_detail.allocation_future_title')}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{t('transaction_detail.allocation_future_body')}</p>
      </div>
    </section>
  );
}
