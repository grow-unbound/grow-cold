'use client';

import { formatINR } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useDashboardSummary } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { t } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const q = useDashboardSummary(warehouseId);

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{t('select_warehouse')}</p>
      </div>
    );
  }

  if (q.isPending) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{t('loading')}</p>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="card w-full">
        <p className="text-danger-600 text-body-sm">{t('error_load')}</p>
      </div>
    );
  }

  const d = q.data;
  return (
    <div className="flex w-full flex-col gap-3">
      <h1 className="h2">{t('home.title')}</h1>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatCard label={t('home.active_lots')} value={d.lot_counts.ACTIVE} />
        <StatCard label={t('home.stale_lots')} value={d.lot_counts.STALE} />
        <StatCard label={t('home.total_lots')} value={d.total_lots} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/inventory" className="btn-secondary btn-base w-full min-w-[8rem] sm:w-auto">
          {t('home.open_inventory')}
        </Link>
        <Link href="/parties" className="btn-secondary btn-base w-full min-w-[8rem] sm:w-auto">
          {t('home.open_parties')}
        </Link>
        <Link href="/transactions" className="btn-secondary btn-base w-full min-w-[8rem] sm:w-auto">
          {t('home.open_transactions')}
        </Link>
      </div>

      <section className="card w-full">
        <h2 className="h3 mb-2">{t('home.recent_deliveries')}</h2>
        {d.recent_deliveries.length === 0 ? (
          <p className="text-body-sm text-neutral-500">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {d.recent_deliveries.map((row) => (
              <li key={row.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {row.customer_name} · {row.product_name}
                  </p>
                  <p className="text-caption text-neutral-500">
                    {row.lot_number} · {row.delivery_date}
                  </p>
                </div>
                <p className="text-sm text-neutral-700">
                  {t('home.bags_out')}: {row.num_bags_out}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card w-full">
        <h2 className="h3 mb-2">{t('home.recent_receipts')}</h2>
        {d.recent_receipts.length === 0 ? (
          <p className="text-body-sm text-neutral-500">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {d.recent_receipts.map((row) => (
              <li key={row.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{row.customer_name}</p>
                  <p className="text-caption text-neutral-500">{row.receipt_date}</p>
                </div>
                <p className="text-sm font-semibold text-neutral-900">
                  {formatINR(Number(row.total_amount))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn('card flex flex-col gap-0.5 p-3')}>
      <span className="text-caption font-medium text-neutral-500">{label}</span>
      <span className="text-h2 font-bold text-neutral-900">{value}</span>
    </div>
  );
}
