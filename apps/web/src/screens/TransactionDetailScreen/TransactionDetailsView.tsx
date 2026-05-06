'use client';

import type { TransactionDetailData } from '@growcold/shared';
import { formatUpdatedAgo } from '@growcold/shared';
import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { AllocationBreakdown } from './AllocationBreakdown';
import { TransactionSummary } from './TransactionSummary';

function useBrowserOnline() {
  const [online, setOnline] = useState(
    () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function TransactionDetailsView({
  data,
  dataUpdatedAt,
}: {
  data: TransactionDetailData;
  dataUpdatedAt: number;
}) {
  const { t } = useTranslation('pages');
  const online = useBrowserOnline();
  const isOffline = !online;

  const headerTitle =
    data.kind === 'receipt'
      ? t('transaction_detail.header_receipt', { ref: data.headerReference })
      : t('transaction_detail.header_payment', { ref: data.headerReference });

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-lg flex-col sm:max-w-xl lg:max-w-2xl',
        'px-0 sm:px-2 lg:px-4',
      )}
    >
      <header
        className={cn(
          'sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-1 border-b border-neutral-200 bg-white px-1 sm:px-2',
          'pt-[max(0.25rem,env(safe-area-inset-top,0px))] lg:pt-2',
        )}
      >
        <Link
          href="/transactions"
          className="focus-ring flex min-h-12 min-w-12 items-center justify-center rounded-lg text-base font-medium text-primary-600 hover:bg-neutral-50"
          aria-label={t('transaction_detail.back_aria')}
        >
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate px-1 text-center text-lg font-semibold text-neutral-900">
          {headerTitle}
        </h1>
        <div className="flex min-w-[48px] items-center justify-end gap-0.5">
          {isOffline ? (
            <span className="text-[11px] font-semibold text-red-600" aria-live="polite">
              {t('transaction_detail.offline')}
            </span>
          ) : null}
          <button
            type="button"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-neutral-400 opacity-35 disabled:cursor-not-allowed"
            aria-label={t('transaction_detail.menu_aria')}
            aria-disabled="true"
            disabled
            title={t('transaction_detail.menu_disabled_hint')}
          >
            <MoreVertical className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      <div className="px-3 pb-8 pt-3 sm:px-4">
        <TransactionSummary data={data} />
        {dataUpdatedAt > 0 ? (
          <p className="mt-2 text-center text-xs text-neutral-500">
            {t('transaction_detail.updated_ago', { time: formatUpdatedAgo(dataUpdatedAt) })}
          </p>
        ) : null}
        {data.showAllocationPlaceholder ? <AllocationBreakdown /> : null}
      </div>
    </div>
  );
}
