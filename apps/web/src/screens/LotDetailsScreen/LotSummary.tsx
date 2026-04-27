'use client';

import type { LotDetailData } from '@growcold/shared';
import { computeStorageStatus, formatYmdLong } from '@growcold/shared';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-base font-semibold text-neutral-900">{value}</span>
    </div>
  );
}

export function LotSummary({ data }: { data: LotDetailData }) {
  const { t } = useTranslation('pages');
  const { status, daysSinceLodgement } = computeStorageStatus(data.lodgement_date, data.balance_bags);

  const statusLabel =
    status === 'completed'
      ? t('lot_detail.status_completed')
      : status === 'fresh'
        ? t('lot_detail.status_fresh')
        : status === 'aging'
          ? t('lot_detail.status_aging')
          : t('lot_detail.status_stale');

  const badgeClass =
    status === 'completed' || status === 'fresh'
      ? 'border-[#16A34A] text-[#16A34A]'
      : status === 'aging'
        ? 'border-[#F59E0B] text-[#F59E0B]'
        : 'border-[#DC2626] text-[#DC2626]';

  const lodgedDate = formatYmdLong(data.lodgement_date);
  const lodgedLine = t('lot_detail.lodged_line', {
    bags: data.original_bags,
    date: lodgedDate,
  });
  const deliveredLine = t('lot_detail.bags_delivered_meta', {
    bags: data.delivered_bags_sum,
    count: data.delivery_count,
  });

  const statusText =
    status === 'completed'
      ? `✓ ${statusLabel}`
      : t('lot_detail.status_days', { label: statusLabel, days: daysSinceLodgement });

  return (
    <section
      className="rounded-xl bg-[#F9FAFB] p-4"
      aria-labelledby="lot-summary-heading"
    >
      <h2 id="lot-summary-heading" className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        {t('lot_detail.summary_title')}
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        <SummaryRow label={t('lot_detail.customer')} value={`${data.customer_code} · ${data.customer_name}`} />
        <SummaryRow label={t('lot_detail.product')} value={data.product_name} />
        <SummaryRow label={t('lot_detail.location')} value={data.location_label} />
        <SummaryRow label={t('lot_detail.lodged')} value={lodgedLine} />
        <SummaryRow label={t('lot_detail.delivered')} value={deliveredLine} />
        <SummaryRow
          label={t('lot_detail.balance')}
          value={t('lot_detail.bags_count', { count: data.balance_bags })}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-neutral-500">{t('lot_detail.status')}</span>
          <span
            className={cn(
              'inline-flex w-fit max-w-full rounded-md border px-2 py-1 text-base font-semibold',
              badgeClass,
            )}
            aria-label={statusLabel}
          >
            {statusText}
          </span>
        </div>
      </div>
    </section>
  );
}
