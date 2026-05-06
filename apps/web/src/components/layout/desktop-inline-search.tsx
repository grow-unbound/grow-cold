'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalSearchPanelBody } from '@/components/layout/global-search-panel-body';
import { useGlobalSearchQuery } from '@/lib/use-global-search-query';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

export function DesktopInlineSearch() {
  const { t } = useTranslation('search');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [query, setQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { parties, lots, loading, errMsg, showEmpty, showMinCharsHint } = useGlobalSearchQuery(
    warehouseId,
    query,
    panelOpen,
    t('error'),
  );

  const trimmed = query.trim();
  const showStartHint = Boolean(warehouseId && panelOpen && trimmed.length === 0);

  useEffect(() => {
    if (!panelOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [panelOpen]);

  const navigateParty = useCallback(
    (id: string) => {
      setPanelOpen(false);
      setQuery('');
      router.push(`/parties/${id}`);
    },
    [router],
  );

  const navigateLot = useCallback(
    (id: string) => {
      setPanelOpen(false);
      setQuery('');
      router.push(`/inventory/${id}`);
    },
    [router],
  );

  return (
    <div ref={containerRef} className="relative min-w-[12rem] max-w-xl flex-1 lg:min-w-[14rem]">
      <div
        className={cn(
          'input-base flex min-h-touch w-full items-center gap-2 rounded-full bg-white text-left shadow-sm',
          panelOpen && 'ring-2 ring-brand-ui/25',
        )}
      >
        <Search className="ml-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setPanelOpen(true)}
          className="min-h-touch w-full flex-1 border-0 bg-transparent py-2 pr-3 text-input text-text-primary outline-none ring-0 placeholder:text-text-placeholder"
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          aria-controls="desktop-global-search-results"
          autoComplete="off"
          id="desktop-global-search-input"
        />
      </div>

      {panelOpen ? (
        <div
          id="desktop-global-search-results"
          role="listbox"
          aria-label={t('title')}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-base border border-border bg-white shadow-lg"
        >
          <GlobalSearchPanelBody
            warehouseId={warehouseId}
            parties={parties}
            lots={lots}
            loading={loading}
            errMsg={errMsg}
            showEmpty={showEmpty}
            showMinCharsHint={showMinCharsHint}
            showStartHint={showStartHint}
            onPickParty={navigateParty}
            onPickLot={navigateLot}
          />
        </div>
      ) : null}
    </div>
  );
}
