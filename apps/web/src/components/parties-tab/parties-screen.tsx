'use client';

import type { PartiesListRowDto } from '@growcold/shared';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/session-store';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { usePartiesList, usePartiesReceivables } from '@/lib/shell-queries';
import { ContactSheet } from './contact-sheet';
import { CustomerCard } from './customer-card';
import { PartiesFilterChips, type PartiesListFilter } from './parties-filter-chips';
import { ReceivablesCard } from './receivables-card';

const STORAGE_KEY = 'partiesTabFilter';

function readStoredFilter(): PartiesListFilter {
  if (typeof window === 'undefined') return 'active';
  const s = sessionStorage.getItem(STORAGE_KEY);
  if (s === 'all' || s === 'active' || s === 'pending') return s;
  return 'active';
}

export function PartiesScreen() {
  const { t } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState<PartiesListFilter>(readStoredFilter);
  const [statusExpanded, setStatusExpanded] = useState(true);
  const [contact, setContact] = useState<{ code: string; phone: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEY, filter);
  }, [filter]);

  const receivablesQ = usePartiesReceivables(warehouseId);
  const listQ = usePartiesList(warehouseId, filter, debouncedSearch, 50);

  const flat = useMemo(
    () => listQ.data?.pages.flatMap((p) => p.items) ?? [],
    [listQ.data],
  );

  const filterTotal = listQ.data?.pages[0]?.filterTotal ?? 0;
  const scopeKey =
    filter === 'all' ? 'scope_all' : filter === 'active' ? 'scope_active' : 'scope_pending';

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchNext = listQ.fetchNextPage;
  const hasNext = listQ.hasNextPage;
  const isFetchingNext = listQ.isFetchingNextPage;

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNext) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNext();
      },
      { rootMargin: '120px' },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [hasNext, fetchNext, flat.length]);

  const onPhone = useCallback((row: PartiesListRowDto) => {
    const phone = (row.phone ?? '').trim() || (row.mobile ?? '').trim();
    if (!phone) return;
    setContact({ code: row.customerCode, phone });
  }, []);

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{t('select_warehouse')}</p>
      </div>
    );
  }

  const searching = debouncedSearch.trim().length > 0;

  return (
    <div className="relative flex min-h-0 w-full max-w-none flex-col bg-[#F9FAFB]">
      <div className="w-full space-y-2 bg-[#F9FAFB] pb-2 pt-2">
        <div className="relative h-12">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            className="input-base h-12 w-full rounded-xl border-0 bg-[#F3F4F6] py-3 pl-10 pr-10 text-base"
            placeholder={t('parties.search_placeholder')}
            aria-label={t('parties.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-neutral-500 hover:bg-neutral-200/80"
              aria-label="Clear"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <ReceivablesCard
          data={receivablesQ.data ?? null}
          isLoading={receivablesQ.isPending}
          expanded={statusExpanded}
          onToggle={() => setStatusExpanded((e) => !e)}
        />

        <PartiesFilterChips value={filter} onChange={setFilter} />

        <h2 className="text-label font-semibold tracking-wide text-neutral-500">
          {t('parties.customers_section', { count: filterTotal, scope: t(`parties.${scopeKey}`) })}
        </h2>
      </div>

      <div className="mt-2 space-y-2 pb-12">
        {searching && (
          <p className="text-sm text-neutral-600">
            {filterTotal > 0
              ? t('parties.showing_customers', { count: filterTotal, query: debouncedSearch })
              : t('parties.no_results', { query: debouncedSearch })}
          </p>
        )}
        {searching && filterTotal === 0 && !listQ.isPending && (
          <p className="text-caption text-neutral-500">{t('parties.no_results_hint')}</p>
        )}

        {listQ.isError && <p className="text-danger-600 text-body-sm">{t('error_load')}</p>}

        {!listQ.isPending && !searching && flat.length === 0 && (
          <div className="card w-full py-8 text-center">
            <p className="text-body-sm text-neutral-700">{t('parties.empty_customers')}</p>
            <p className="mt-1 text-caption text-neutral-500">{t('parties.empty_customers_hint')}</p>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {flat.map((row) => (
            <li key={row.customerId}>
              <CustomerCard row={row} onPhone={onPhone} />
            </li>
          ))}
        </ul>

        <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />
        {isFetchingNext && <p className="text-center text-caption text-neutral-500">{t('parties.load_more')}</p>}
      </div>

      <ContactSheet
        open={contact !== null}
        onClose={() => setContact(null)}
        code={contact?.code ?? ''}
        phoneDigits={contact?.phone ?? ''}
      />
    </div>
  );
}
