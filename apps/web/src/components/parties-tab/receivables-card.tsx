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

interface KpiColProps {
  value: string;
  label: string;
  hint: string;
}

function lineAmount(n: number): string {
  if (n >= 100000) return `₹${formatIndianNumber(n)}`;
  return formatINR(n);
}

function KpiCol({ value, label, hint }: KpiColProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <p className="font-display text-[20px] font-bold tabular-nums leading-none text-text-primary">{value}</p>
      <p className="text-[12px] font-semibold text-text-secondary">{label}</p>
      <p className="text-[11px] text-text-tertiary">{hint}</p>
    </div>
  );
}

export function ReceivablesCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <button
        type="button"
        className="flex w-full min-h-touch items-center justify-between text-left"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={t('parties.receivables')}
      >
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
          {t('parties.receivables')}
        </span>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-text-tertiary" />
        ) : (
          <ChevronRight className="h-5 w-5 text-text-tertiary" />
        )}
      </button>

      {isLoading && <p className="mt-2 text-[13px] text-text-tertiary">{t('loading')}</p>}

      {!isLoading && data && (
        <div className="mt-3 flex flex-col items-center">
          <p className="font-display text-[38px] font-bold tabular-nums leading-none text-text-primary">
            {lineAmount(data.totalReceivable)}
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            {t('parties.main_line', { amount: '', count: data.customersWithDues }).replace(/^\s*•?\s*/, '')}
          </p>

          {expanded && (
            <>
              <div className="my-3 h-px w-full bg-border" />
              <div className="flex w-full">
                <KpiCol
                  value={lineAmount(data.rentReceivable)}
                  label={t('parties.rents')}
                  hint={t('parties.rent_lots', { count: data.rentLotCount })}
                />
                <KpiCol
                  value={lineAmount(data.chargesReceivable)}
                  label={t('parties.charges')}
                  hint={t('parties.charge_lots', { count: data.chargesLotCount })}
                />
                <KpiCol
                  value={lineAmount(data.othersReceivable)}
                  label={t('parties.others')}
                  hint={t('parties.others_customers', { count: data.othersCustomerCount })}
                />
              </div>
            </>
          )}
        </div>
      )}

      {!isLoading && !data && <p className="mt-1 text-[13px] text-text-tertiary">—</p>}
    </div>
  );
}
