'use client';

import type { PartiesListRowDto } from '@growcold/shared';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartiesList } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';

const inrFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatINR(n: number): string {
  return inrFormat.format(n);
}

function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
}

export default function PartiesPage() {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [search, setSearch] = useState('');

  const listQ = usePartiesList(warehouseId, 'all', search, 200);

  const flat: PartiesListRowDto[] = useMemo(
    () => listQ.data?.pages.flatMap((p) => p.items) ?? [],
    [listQ.data],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return flat;
    const q = search.toLowerCase();
    return flat.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerCode.toLowerCase().includes(q),
    );
  }, [flat, search]);

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-small text-text-secondary">{t('select_warehouse')}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Page title */}
      <h2 className="font-display text-h2 font-semibold text-text-primary">
        {t('parties.title')}
      </h2>

      {/* Search bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden
        />
        <input
          type="search"
          placeholder={t('parties.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Loading skeletons */}
      {listQ.isPending && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {listQ.isError && (
        <p className="text-small text-outward">{t('error_load')}</p>
      )}

      {/* Empty state */}
      {!listQ.isPending && filtered.length === 0 && !listQ.isError && (
        <div className="card w-full py-8 text-center">
          <p className="text-small text-text-secondary">{t('parties.empty_customers')}</p>
          {search && (
            <p className="mt-1 text-small text-text-tertiary">
              {t('parties.no_results', { query: search })}
            </p>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* Mobile: card list */}
          <ul className="flex flex-col gap-2 lg:hidden">
            {filtered.map((row) => (
              <li key={row.customerId}>
                <Link
                  href={`/parties/${row.customerId}`}
                  className="block rounded-xl border border-border bg-white p-3 shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="type-label text-text-tertiary">
                        {row.customerCode}
                        {row.lastActivityDate && (
                          <> · {formatDate(row.lastActivityDate)}</>
                        )}
                      </p>
                      <p className="mt-0.5 font-display text-[20px] font-semibold leading-tight text-text-primary">
                        {row.customerName}
                      </p>
                      {row.lotCount > 0 && (
                        <p className="mt-1 text-small text-text-secondary">
                          {t('parties.lots_bags_line', { lots: row.lotCount, bags: row.bagCount })}
                        </p>
                      )}
                      {row.outstanding > 0 && (
                        <span className="mt-1.5 inline-block rounded-full bg-outward/10 px-2 py-0.5 text-[12px] font-medium text-outward">
                          {formatINR(row.outstanding)} {t('parties.due', { defaultValue: 'due' })}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-[24px] font-bold leading-none tabular-nums text-text-primary">
                        {row.lotCount}
                      </p>
                      <p className="type-label mt-0.5 text-text-tertiary">lots</p>
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
                    { key: 'party', label: 'Party' },
                    { key: 'code', label: 'Code' },
                    { key: 'outstanding', label: 'Outstanding' },
                    { key: 'lots', label: 'Active Lots' },
                    { key: 'bags', label: 'Bags' },
                    { key: 'last_activity', label: 'Last Activity' },
                  ].map((h) => (
                    <th key={h.key} className="type-label px-4 py-3 text-left">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row) => (
                  <tr
                    key={row.customerId}
                    className="cursor-pointer bg-surface transition-colors hover:bg-surface-subtle"
                    onClick={() => router.push(`/parties/${row.customerId}`)}
                  >
                    <td className="px-4 py-3 font-display font-semibold text-text-primary">
                      {row.customerName}
                    </td>
                    <td className="px-4 py-3 font-mono text-small text-brand-text">
                      {row.customerCode}
                    </td>
                    <td className="px-4 py-3 text-small tabular-nums">
                      {row.outstanding > 0 ? (
                        <span className="font-medium text-outward">
                          {formatINR(row.outstanding)}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-small text-text-primary tabular-nums">
                      {row.lotCount}
                    </td>
                    <td className="px-4 py-3 text-small text-text-secondary tabular-nums">
                      {row.bagCount}
                    </td>
                    <td className="px-4 py-3 text-small text-text-tertiary">
                      {formatDate(row.lastActivityDate) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Contextual FAB — always visible */}
      <Link
        href="/parties/new"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-ui text-white shadow-lg transition-transform hover:bg-brand-hover active:scale-95 lg:bottom-6"
        aria-label={t('parties.add_party', { defaultValue: 'Add party' })}
      >
        <Plus className="h-6 w-6" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}
