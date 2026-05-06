'use client';

import type { PartiesListRowDto } from '@growcold/shared';
import { formatIndianNumber } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function outstandingTier(out: number): 'high' | 'medium' | 'low' {
  if (out >= 50_000) return 'high';
  if (out >= 10_000) return 'medium';
  return 'low';
}

const DOT: Record<'high' | 'medium' | 'low', string> = {
  high: '#DC2626',
  medium: '#F59E0B',
  low: '#16A34A',
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
      className="block rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: DOT[tier] }}
            aria-label={t(`parties.${statusKey}`)}
            title={t(`parties.${statusKey}`)}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-neutral-800">{row.customerCode}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {t('parties.lots_bags_line', { lots: row.lotCount, bags: row.bagCount })}
            </p>
            {phone ? (
              <button
                type="button"
                className="mt-1 min-h-12 min-w-12 cursor-pointer rounded-lg px-1 py-2 text-left text-sm text-cyan-700"
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
              <p className="mt-1 text-sm text-neutral-400">{t('parties.no_phone')}</p>
            )}
          </div>
        </div>
        <p className={cn('shrink-0 text-base font-semibold text-neutral-900')}>{formatOutstanding(row.outstanding)}</p>
      </div>
    </Link>
  );
}
