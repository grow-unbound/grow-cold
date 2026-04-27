'use client';

import { formatIndianNumber, type StockTabSummaryResponse } from '@growcold/shared';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  data: StockTabSummaryResponse | undefined;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function StockStatusCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <section
      className="mx-auto w-full max-w-3xl rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04] lg:max-w-5xl"
      aria-label={t('stock.stock_status')}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-h-touch items-center justify-between gap-2 text-left"
      >
        <span className="text-label font-semibold tracking-wide text-neutral-500">
          {t('stock.stock_status')}
        </span>
        {expanded ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
        )}
      </button>

      {isLoading && <p className="mt-2 text-body-sm text-neutral-500">{t('loading')}</p>}

      {!isLoading && data && !expanded && (
        <p className="mt-1 text-sm text-neutral-500">
          {t('stock.bags_lots_line', {
            bags: formatIndianNumber(data.totalBags),
            lots: data.totalLots,
          })}
        </p>
      )}

      {!isLoading && data && expanded && (
        <div className="mt-3 space-y-3">
          <p
            className="text-center text-2xl font-bold text-neutral-900"
            style={{ color: undefined }}
          >
            {t('stock.bags_lots_line', {
              bags: formatIndianNumber(data.totalBags),
              lots: data.totalLots,
            })}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-base font-semibold text-neutral-900">
                {formatIndianNumber(data.freshBags)}
              </p>
              <p className="text-xs text-neutral-500">{t('stock.fresh_hint')}</p>
              <p className="text-sm font-semibold text-neutral-800">{t('stock.fresh')}</p>
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-900">
                {formatIndianNumber(data.agingBags)}
              </p>
              <p className="text-xs text-neutral-500">{t('stock.aging_hint')}</p>
              <p className="text-sm font-semibold text-neutral-800">{t('stock.aging')}</p>
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-900">
                {formatIndianNumber(data.staleBags)}
              </p>
              <p className="text-xs text-neutral-500">{t('stock.stale_hint')}</p>
              <p className="text-sm font-semibold text-neutral-800">{t('stock.stale')}</p>
            </div>
          </div>
          <p className="text-center text-caption text-neutral-400">
            {t('stock.updated_ago', {
              time: new Date(data.updatedAt).toLocaleString(),
            })}
          </p>
        </div>
      )}
    </section>
  );
}
