'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalSearchPanelBody } from '@/components/layout/global-search-panel-body';
import { useGlobalSearchQuery } from '@/lib/use-global-search-query';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const { t } = useTranslation('search');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [query, setQuery] = useState('');

  const { parties, lots, loading, errMsg, showEmpty, showMinCharsHint } = useGlobalSearchQuery(
    warehouseId,
    query,
    true,
    t('error'),
  );

  const trimmed = query.trim();
  const showStartHint = Boolean(warehouseId && trimmed.length === 0);

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col gap-3 pb-8',
        'pt-[max(0.25rem,env(safe-area-inset-top,0px))] lg:pt-0',
      )}
    >
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-brand-ui"
          aria-label={t('back_aria')}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </Link>
        <h1 className="font-display text-h3 font-medium tracking-tight text-text-primary">{t('screen_title')}</h1>
      </div>

      <div className="input-base flex min-h-touch w-full items-center gap-2 rounded-full bg-white shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-touch w-full flex-1 border-0 bg-transparent px-3 py-2 text-input text-text-primary outline-none ring-0 placeholder:text-text-placeholder"
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          autoComplete="off"
          autoFocus
        />
      </div>

      <GlobalSearchPanelBody
        warehouseId={warehouseId}
        parties={parties}
        lots={lots}
        loading={loading}
        errMsg={errMsg}
        showEmpty={showEmpty}
        showMinCharsHint={showMinCharsHint}
        showStartHint={showStartHint}
        onPickParty={(id) => router.push(`/parties/${id}`)}
        onPickLot={(id) => router.push(`/inventory/${id}`)}
      />
    </div>
  );
}
