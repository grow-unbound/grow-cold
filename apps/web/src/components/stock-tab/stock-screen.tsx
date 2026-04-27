'use client';

import type { StockTabMovementRowDto } from '@growcold/shared';
import { format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns';
import { ChevronDown, ChevronRight, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/session-store';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useStockMovements, useStockSummary } from '@/lib/shell-queries';
import { RecordTransactionDialog } from './record-transaction-dialog';
import { StockFilterChips, type StockMovementFilter } from './stock-filter-chips';
import { StockStatusCard } from './stock-status-card';
import { StockTransactionCard } from './stock-transaction-card';

const GREEN = '#00B14F';

function sectionKeyForRow(row: StockTabMovementRowDto): string {
  const d = startOfDay(parseISO(row.transactionDate));
  if (isToday(d)) return '__today__';
  if (isYesterday(d)) return '__yesterday__';
  return row.transactionDate;
}

function sectionLabel(key: string): string {
  if (key === '__today__') return 'TODAY';
  if (key === '__yesterday__') return 'YESTERDAY';
  const d = startOfDay(parseISO(key));
  return format(d, 'MMM d (EEE)').toUpperCase();
}

function matchesSearch(row: StockTabMovementRowDto, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    row.lotNumber.toLowerCase().includes(s) ||
    row.customerCode.toLowerCase().includes(s) ||
    row.customerName.toLowerCase().includes(s) ||
    row.productName.toLowerCase().includes(s)
  );
}

export function StockScreen() {
  const { t } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const role = useSessionStore((s) => s.role);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState<StockMovementFilter>('all');
  const [statusExpanded, setStatusExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    __today__: true,
  });
  const [recordOpen, setRecordOpen] = useState(false);

  const summaryQ = useStockSummary(warehouseId);
  const movementsQ = useStockMovements(warehouseId, 20);

  const flatItems = useMemo(
    () => movementsQ.data?.pages.flatMap((p) => p.items) ?? [],
    [movementsQ.data],
  );

  const filtered = useMemo(() => {
    return flatItems.filter((row) => {
      if (filter === 'lodgement' && row.kind !== 'lodgement') return false;
      if (filter === 'delivery' && row.kind !== 'delivery') return false;
      return matchesSearch(row, debouncedSearch);
    });
  }, [flatItems, filter, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, StockTabMovementRowDto[]>();
    for (const row of filtered) {
      const k = sectionKeyForRow(row);
      const arr = map.get(k) ?? [];
      arr.push(row);
      map.set(k, arr);
    }
    const keys = [...map.keys()].sort((a, b) => {
      if (a === '__today__') return -1;
      if (b === '__today__') return 1;
      if (a === '__yesterday__') return -1;
      if (b === '__yesterday__') return 1;
      return b.localeCompare(a);
    });
    return keys.map((key) => ({ key, items: map.get(key) ?? [] }));
  }, [filtered]);

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      for (const g of grouped) {
        if (next[g.key] === undefined) {
          next[g.key] = g.key === '__today__';
        }
      }
      return next;
    });
  }, [grouped]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchNextPage = movementsQ.fetchNextPage;
  const hasNextPage = movementsQ.hasNextPage;
  const isFetchingNext = movementsQ.isFetchingNextPage;

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: '120px' },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [hasNextPage, fetchNextPage, grouped.length]);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));
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
    <div className="relative flex w-full max-w-none flex-col">
      <div className="w-full space-y-2 bg-neutral-50 pb-2 pt-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            className="input-base h-12 w-full rounded-xl border-0 bg-[#F3F4F6] py-3 pl-10 pr-10 text-base"
            placeholder={t('stock.search_placeholder')}
            aria-label={t('stock.search_placeholder')}
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

        <StockFilterChips value={filter} onChange={setFilter} />

        <h2 className="text-label font-semibold tracking-wide text-neutral-500">
          {t('stock.transactions')}
        </h2>
      </div>

      <div className="mt-2 space-y-3 pb-24">
        <StockStatusCard
          data={summaryQ.data}
          isLoading={summaryQ.isPending}
          expanded={statusExpanded}
          onToggle={() => setStatusExpanded((e) => !e)}
        />

        {searching && (
          <p className="text-sm text-neutral-600">
            {filtered.length > 0
              ? t('stock.showing_results', { count: filtered.length, query: debouncedSearch })
              : t('stock.no_results', { query: debouncedSearch })}
          </p>
        )}
        {searching && filtered.length === 0 && (
          <p className="text-caption text-neutral-500">{t('stock.no_results_hint')}</p>
        )}

        {movementsQ.isError && <p className="text-danger-600 text-body-sm">{t('error_load')}</p>}

        {!movementsQ.isPending && !searching && flatItems.length === 0 && (
          <div className="card w-full py-8 text-center">
            <p className="text-body-sm text-neutral-700">{t('stock.empty_movements')}</p>
            <p className="mt-1 text-caption text-neutral-500">{t('stock.empty_movements_hint')}</p>
          </div>
        )}

        {grouped.map(({ key, items }) => {
          const open = expandedSections[key] ?? false;
          return (
            <section key={key} className="space-y-2">
              <button
                type="button"
                className="flex w-full min-h-touch items-center gap-2 text-left"
                onClick={() => toggleSection(key)}
              >
                <span className="text-label font-semibold tracking-wide text-neutral-500">
                  {sectionLabel(key)}
                </span>
                {open ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
                )}
                <span className="text-sm text-neutral-500">({items.length})</span>
              </button>
              {open && (
                <ul className="flex flex-col gap-2">
                  {items.map((row) => (
                    <li key={row.id}>
                      <StockTransactionCard row={row} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />
        {isFetchingNext && <p className="text-center text-caption text-neutral-500">{t('loading')}</p>}
      </div>

      <button
        type="button"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+16px)] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg lg:bottom-8 lg:right-[max(1.5rem,calc(50%-min(40rem,50vw)+1rem))]"
        style={{ backgroundColor: GREEN, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        aria-label={t('stock.record_title')}
        onClick={() => setRecordOpen(true)}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <RecordTransactionDialog
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        warehouseId={warehouseId}
        role={role}
      />
    </div>
  );
}
