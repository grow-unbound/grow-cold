'use client';

import { formatINR, formatIndianNumber } from '@growcold/shared';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type PartiesReceivablesSummary = {
  totalReceivable: number;
  customersWithDues: number;
  rentReceivable: number;
  rentLotCount: number;
  chargesReceivable: number;
  chargesLotCount: number;
  othersReceivable: number;
  othersCustomerCount: number;
  updatedAt: string;
} | null;

interface Props {
  data: PartiesReceivablesSummary;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function lineAmount(n: number): string {
  if (n >= 100000) return `₹${formatIndianNumber(n)}`;
  return formatINR(n);
}

export function ReceivablesCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <div className="card-elevated overflow-hidden rounded-xl border border-neutral-200 bg-white p-3">
      <button
        type="button"
        className="flex w-full min-h-touch items-center justify-between text-left"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={t('parties.receivables')}
      >
        <span className="text-label font-bold tracking-wide text-neutral-500">{t('parties.receivables')}</span>
        {expanded ? <ChevronDown className="h-5 w-5 text-neutral-400" /> : <ChevronRight className="h-5 w-5 text-neutral-400" />}
      </button>

      {isLoading && <p className="mt-2 text-sm text-neutral-500">{t('loading')}</p>}

      {!isLoading && data && (
        <div className="mt-2">
          {expanded ? (
            <>
              <p className="text-2xl font-bold text-neutral-900">
                {t('parties.main_line', {
                  amount: lineAmount(data.totalReceivable),
                  count: data.customersWithDues,
                })}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base font-bold text-neutral-900">{lineAmount(data.rentReceivable)}</p>
                  <p className="text-sm font-medium text-neutral-800">{t('parties.rents')}</p>
                  <p className="text-xs text-neutral-500">{t('parties.rent_lots', { count: data.rentLotCount })}</p>
                </div>
                <div>
                  <p className="text-base font-bold text-neutral-900">{lineAmount(data.chargesReceivable)}</p>
                  <p className="text-sm font-medium text-neutral-800">{t('parties.charges')}</p>
                  <p className="text-xs text-neutral-500">{t('parties.charge_lots', { count: data.chargesLotCount })}</p>
                </div>
                <div>
                  <p className="text-base font-bold text-neutral-900">{lineAmount(data.othersReceivable)}</p>
                  <p className="text-sm font-medium text-neutral-800">{t('parties.others')}</p>
                  <p className="text-xs text-neutral-500">
                    {t('parties.others_customers', { count: data.othersCustomerCount })}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-base text-neutral-800">
              {t('parties.main_line', {
                amount: lineAmount(data.totalReceivable),
                count: data.customersWithDues,
              })}
            </p>
          )}
        </div>
      )}

      {!isLoading && !data && <p className="mt-1 text-sm text-neutral-500">—</p>}
    </div>
  );
}
