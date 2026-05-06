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

interface KpiColProps {
  value: string;
  label: string;
  hint?: string;
}

function KpiCol({ value, label, hint }: KpiColProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <p className="font-display text-[22px] font-bold tabular-nums leading-none text-text-primary">{value}</p>
      <p className="text-[12px] font-semibold text-text-secondary">{label}</p>
      {hint ? <p className="text-[11px] text-text-tertiary">{hint}</p> : null}
    </div>
  );
}

export function StockStatusCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <section
      className="mx-auto w-full max-w-3xl rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] lg:max-w-5xl"
      aria-label={t('stock.stock_status')}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-h-touch items-center justify-between gap-2 text-left"
      >
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
          {t('stock.stock_status')}
        </span>
        {expanded ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden />
        )}
      </button>

      {isLoading && <p className="mt-2 text-[13px] text-text-tertiary">{t('loading')}</p>}

      {!isLoading && data && (
        <div className="mt-3 flex flex-col items-center">
          <p className="font-display text-[38px] font-bold tabular-nums leading-none text-text-primary">
            {formatIndianNumber(data.totalBags)}
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            {t('stock.bags_lots_line', { bags: '', lots: data.totalLots }).replace(/^\s*•?\s*/, '')}
          </p>

          {expanded && (
            <>
              <div className="my-3 h-px w-full bg-border" />
              <div className="flex w-full">
                <KpiCol value={formatIndianNumber(data.freshBags)} label={t('stock.fresh')} hint={t('stock.fresh_hint')} />
                <KpiCol value={formatIndianNumber(data.agingBags)} label={t('stock.aging')} hint={t('stock.aging_hint')} />
                <KpiCol value={formatIndianNumber(data.staleBags)} label={t('stock.stale')} hint={t('stock.stale_hint')} />
              </div>
              <p className="mt-3 text-[11px] text-text-tertiary">
                {t('stock.updated_ago', { time: new Date(data.updatedAt).toLocaleTimeString() })}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
