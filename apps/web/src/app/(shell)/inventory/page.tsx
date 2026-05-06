'use client';

import { LOT_STATUS, type LotStatus } from '@growcold/shared';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LotStatusBadge } from '@/components/shell/lot-status-badge';
import { useLotsList } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { t } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const role = useSessionStore((s) => s.role);
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'ALL'>('ALL');

  const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
  const lotsQ = useLotsList(warehouseId, statusParam);

  const statusChips = useMemo(() => {
    if (role === 'STAFF') return ['ALL', 'ACTIVE', 'STALE'] as const;
    return ['ALL', ...LOT_STATUS] as const;
  }, [role]);

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{t('select_warehouse')}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="h2">{t('inventory.title')}</h1>
        {role !== 'STAFF' && (
          <Link href="/inventory/new" className="btn-primary inline-flex w-full justify-center sm:w-auto">
            {t('inventory.add_lot')}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {statusChips.map((s) => (
          <button
            key={s}
            type="button"
            className={cn(
              'min-h-10 rounded-full border-2 px-3 py-1.5 text-label font-semibold transition-colors',
              statusFilter === s
                ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
            )}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? t('all_statuses') : s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {lotsQ.isPending && <p className="text-body-sm text-neutral-600">{t('loading')}</p>}
      {lotsQ.isError && <p className="text-danger-600 text-body-sm">{t('error_load')}</p>}

      {lotsQ.data && lotsQ.data.data.length === 0 && (
        <div className="card w-full">
          <p className="text-body-sm text-neutral-500">{t('empty')}</p>
        </div>
      )}

      {lotsQ.data && lotsQ.data.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {lotsQ.data.data.map((lot) => (
            <li
              key={lot.id}
              className="card-elevated flex flex-col gap-2 transition-transform active:scale-[0.99] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/inventory/${lot.id}`} className="text-sm font-semibold text-primary-600 hover:underline">
                    {lot.lot_number}
                  </Link>
                  <LotStatusBadge status={lot.status} />
                </div>
                <p className="mt-0.5 truncate text-caption text-neutral-600">
                  {lot.customer_name} · {lot.product_name}
                </p>
                <p className="text-caption text-neutral-500">
                  {t('inventory.bags')}: {lot.balance_bags}/{lot.original_bags} · {t('inventory.lodgement')}:{' '}
                  {lot.lodgement_date}
                </p>
              </div>
              <Link href={`/inventory/${lot.id}`} className="btn-secondary shrink-0 self-start sm:self-center">
                {t('view')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
