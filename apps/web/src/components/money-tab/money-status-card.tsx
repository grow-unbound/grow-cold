'use client';

import { formatINR, type MoneyTabSummaryResponse } from '@growcold/shared';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  data: MoneyTabSummaryResponse | undefined;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function MoneyStatusCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <section
      className="mx-auto w-full max-w-3xl rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04] lg:max-w-5xl"
      aria-label={t('money.cash_status')}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-h-touch items-center justify-between gap-2 text-left"
      >
        <span className="text-label font-semibold tracking-wide text-neutral-500">
          {t('money.cash_status')}
        </span>
        {expanded ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
        )}
      </button>

      {isLoading && <p className="mt-2 text-body-sm text-neutral-500">{t('loading')}</p>}

      {!isLoading && data && !expanded && (
        <p className="mt-1 text-center text-2xl font-bold text-neutral-900">
          {formatINR(data.cashBalance)} {t('money.balance_label')}
        </p>
      )}

      {!isLoading && data && expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-center text-2xl font-bold text-neutral-900">
            {formatINR(data.cashBalance)} {t('money.balance_label')}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-base font-semibold text-neutral-900">
                {formatINR(data.receivedToday)}
              </p>
              <p className="text-xs text-neutral-500">{t('money.received_sub')}</p>
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-900">{formatINR(data.paidToday)}</p>
              <p className="text-xs text-neutral-500">{t('money.paid_sub')}</p>
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-900">
                {formatINR(data.payablePending)}
              </p>
              <p className="text-xs text-neutral-500">{t('money.payable_sub')}</p>
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
