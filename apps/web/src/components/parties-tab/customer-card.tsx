'use client';

import type { PartiesListRowDto } from '@growcold/shared';
import { formatIndianNumber } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

function outstandingTier(out: number): 'high' | 'medium' | 'low' {
  if (out >= 50_000) return 'high';
  if (out >= 10_000) return 'medium';
  return 'low';
}

const DOT: Record<'high' | 'medium' | 'low', string> = {
  high:   '#A83422',
  medium: '#7B5200',
  low:    '#0B7B6E',
};

function formatOutstanding(n: number): string {
  return `₹${formatIndianNumber(n)}`;
}

interface Props {
  row: PartiesListRowDto;
  onPhone: (row: PartiesListRowDto) => void;
}

export function CustomerCard({ row, onPhone }: Props) {
  const { t } = useTranslation('pages');
  const tier = outstandingTier(row.outstanding);
  const statusKey =
    tier === 'high' ? 'status_outstanding_high' : tier === 'medium' ? 'status_outstanding_medium' : 'status_outstanding_low';
  const phone = (row.phone ?? '').trim() || (row.mobile ?? '').trim();

  return (
    <Link
      href={`/parties/${row.customerId}`}
      className="block rounded-xl border border-border bg-white p-3 shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span
            className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: DOT[tier] }}
            aria-label={t(`parties.${statusKey}`)}
            title={t(`parties.${statusKey}`)}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[17px] font-semibold leading-snug text-text-primary">
              {row.customerCode}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-text-tertiary">
              {t('parties.lots_bags_line', { lots: row.lotCount, bags: row.bagCount })}
            </p>
            {phone ? (
              <button
                type="button"
                className="mt-1 min-h-[44px] cursor-pointer rounded-lg px-1 py-1.5 text-left text-[13px] text-brand-text"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPhone(row);
                }}
                aria-label={t('parties.contact_aria', { code: row.customerCode })}
              >
                📞 {phone}
              </button>
            ) : (
              <p className="mt-1 text-[13px] text-text-tertiary">{t('parties.no_phone')}</p>
            )}
          </div>
        </div>
        <p className="shrink-0 font-display text-[20px] font-bold tabular-nums text-text-primary">
          {formatOutstanding(row.outstanding)}
        </p>
      </div>
    </Link>
  );
}
