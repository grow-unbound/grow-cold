'use client';

import type { LotDetailData } from '@growcold/shared';
import { formatUpdatedAgo } from '@growcold/shared';
import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ChargesBreakdown } from './ChargesBreakdown';
import { DeliveriesList } from './DeliveriesList';
import { LotSummary } from './LotSummary';
import { RentsPlaceholder } from './RentsPlaceholder';

type TabId = 'deliveries' | 'charges' | 'rents';

export function LotDetailsView({
  data,
  dataUpdatedAt,
  isOffline,
}: {
  data: LotDetailData;
  dataUpdatedAt: number;
  isOffline?: boolean;
}) {
  const { t } = useTranslation('pages');
  const [tab, setTab] = useState<TabId>('deliveries');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'deliveries', label: t('lot_detail.tab_deliveries') },
    { id: 'charges', label: t('lot_detail.tab_charges') },
    { id: 'rents', label: t('lot_detail.tab_rents') },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col">
      <header
        className={cn(
          'sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-2 sm:px-3',
          'pt-[max(0.25rem,env(safe-area-inset-top,0px))] lg:pt-2',
        )}
      >
        <Link
          href="/inventory"
          className="focus-ring flex min-h-12 min-w-12 items-center justify-center rounded-lg text-base font-medium text-primary-600 hover:bg-neutral-50"
          aria-label={t('lot_detail.back_aria')}
        >
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center text-lg font-semibold text-neutral-900">
          {t('lot_detail.lot_header_label', { number: data.lot_number })}
        </h1>
        <button
          type="button"
          className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed"
          aria-label={t('lot_detail.menu_aria')}
          aria-disabled="true"
          disabled
          title={t('lot_detail.menu_disabled_hint')}
        >
          <MoreVertical className="h-5 w-5" aria-hidden />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-3 pt-3 sm:px-4">
          <LotSummary data={data} />
          {(dataUpdatedAt > 0 || isOffline) && (
            <p className="mt-2 text-center text-xs text-neutral-500">
              {isOffline ? t('lot_detail.offline') : null}
              {isOffline && dataUpdatedAt > 0 ? ' · ' : null}
              {dataUpdatedAt > 0
                ? t('lot_detail.updated_ago', { time: formatUpdatedAgo(dataUpdatedAt) })
                : null}
            </p>
          )}
        </div>

        <nav
          className="sticky top-14 z-30 flex border-b border-neutral-200 bg-white/95 px-2 backdrop-blur-sm sm:px-4"
          aria-label={t('lot_detail.tabs_aria')}
        >
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(
                  'min-h-12 flex-1 border-b-[3px] px-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-[#00B14F] text-[#00B14F]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700',
                )}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="min-h-[40vh] flex-1 bg-white" role="tabpanel">
          {tab === 'deliveries' ? <DeliveriesList deliveries={data.deliveries} /> : null}
          {tab === 'charges' ? <ChargesBreakdown charges={data.charges} /> : null}
          {tab === 'rents' ? <RentsPlaceholder /> : null}
        </div>
      </div>
    </div>
  );
}
