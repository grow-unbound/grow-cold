'use client';

import { LOT_STATUS, type LotStatus } from '@growcold/shared';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LotStatusBadge } from '@/components/shell/lot-status-badge';
import { useLotsList } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const role = useSessionStore((s) => s.role);
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
  const lotsQ = useLotsList(warehouseId, statusParam);

  const statusChips = useMemo(() => {
    if (role === 'STAFF') return ['ALL', 'ACTIVE', 'STALE'] as const;
    return ['ALL', ...LOT_STATUS] as const;
  }, [role]);

  const filtered = useMemo(() => {
    const data = lotsQ.data?.data ?? [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (l) =>
        l.lot_number.toLowerCase().includes(q) ||
        l.customer_name.toLowerCase().includes(q),
    );
  }, [lotsQ.data, search]);

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-small text-text-secondary">{t('select_warehouse')}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Page header — title only, no top-right CTA */}
      <h1 className="font-display text-h2 font-semibold text-text-primary">
        {t('inventory.title')}
      </h1>

      {/* Search bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden
        />
        <input
          type="search"
          placeholder={t('inventory.search_placeholder', { defaultValue: 'Search lots or parties…' })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {statusChips.map((s) => (
          <button
            key={s}
            type="button"
            className={cn(
              'min-h-10 rounded-full border-2 px-3 py-1.5 text-label font-semibold transition-colors',
              statusFilter === s
                ? 'border-brand-ui bg-brand-subtle text-brand-text shadow-sm'
                : 'border-border bg-white text-text-secondary hover:bg-surface-subtle',
            )}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? t('all_statuses') : s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {lotsQ.isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-lg" />
          ))}
        </div>
      )}
      {lotsQ.isError && (
        <p className="text-small text-outward">{t('error_load')}</p>
      )}

      {!lotsQ.isPending && filtered.length === 0 && (
        <div className="card w-full">
          <p className="text-small text-text-tertiary">
            {search ? `No lots matching "${search}"` : t('empty')}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* Mobile: card list */}
          <ul className="flex flex-col gap-2 lg:hidden">
            {filtered.map((lot) => (
              <li key={lot.id} className="card active:scale-[0.985] transition-transform duration-fast">
                <Link href={`/inventory/${lot.id}`} className="block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="type-label">
                        {lot.lot_number} · {lot.lodgement_date}
                      </p>
                      <p className="mt-0.5 font-display text-[20px] font-semibold leading-tight text-text-primary">
                        {lot.customer_name}
                      </p>
                      <p className="mt-1.5 text-small text-text-secondary">
                        {lot.product_name}
                      </p>
                      <div className="mt-1.5">
                        <LotStatusBadge status={lot.status} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-[28px] font-bold leading-none tabular-nums text-text-primary">
                        {lot.balance_bags}
                      </p>
                      <p className="type-label mt-0.5">bags</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
            <table className="w-full">
              <thead className="bg-surface-subtle">
                <tr>
                  {[
                    { key: 'lot', label: 'Lot #' },
                    { key: 'party', label: 'Party' },
                    { key: 'product', label: 'Product' },
                    { key: 'bags', label: 'Bags' },
                    { key: 'status', label: 'Status' },
                    { key: 'lodged', label: 'Lodged' },
                  ].map((h) => (
                    <th key={h.key} className="type-label px-4 py-3 text-left">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lot) => (
                  <tr
                    key={lot.id}
                    className="cursor-pointer bg-surface transition-colors hover:bg-surface-subtle"
                    onClick={() => router.push(`/inventory/${lot.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-small text-brand-text">
                      {lot.lot_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {lot.customer_name}
                    </td>
                    <td className="px-4 py-3 text-small text-text-secondary">
                      {lot.product_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-small text-text-primary">
                      {lot.balance_bags}
                    </td>
                    <td className="px-4 py-3">
                      <LotStatusBadge status={lot.status} />
                    </td>
                    <td className="px-4 py-3 text-small text-text-tertiary">
                      {lot.lodgement_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Contextual FAB — non-STAFF only */}
      {role !== 'STAFF' && (
        <Link
          href="/inventory/new"
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-ui text-white shadow-lg transition-transform hover:bg-brand-hover active:scale-95 lg:bottom-6"
          aria-label={t('inventory.add_lot')}
        >
          <Plus className="h-6 w-6" strokeWidth={2} aria-hidden />
        </Link>
      )}
    </div>
  );
}
