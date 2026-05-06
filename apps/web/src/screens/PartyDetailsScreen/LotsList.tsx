'use client';

import type { PartyDetailLotRow } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function statusGlyph(status: PartyDetailLotRow['storageStatus']): string {
  switch (status) {
    case 'fresh':
      return '🟢';
    case 'aging':
      return '🟡';
    case 'stale':
      return '⚠️';
    case 'completed':
      return '✓';
    default:
      return '';
  }
}

interface Props {
  lots: PartyDetailLotRow[];
}

export function LotsList({ lots }: Props) {
  const { t } = useTranslation('pages');

  if (lots.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-8 text-center shadow-sm">
        <p className="text-base font-semibold text-neutral-900">{t('parties.party_detail.empty_lots_title')}</p>
        <p className="mt-1 text-body-sm text-neutral-600">{t('parties.party_detail.empty_lots_body')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-caption font-medium uppercase tracking-wide text-neutral-500">
        {t('parties.party_detail.lots_heading', { count: lots.length })}
      </h3>
      <ul className="space-y-3">
        {lots.map((lot) => {
          const isCompleted = lot.storageStatus === 'completed';
          const line3 = isCompleted
            ? t('parties.party_detail.lot_completed', {
                remaining: lot.balance_bags.toLocaleString('en-IN'),
                check: statusGlyph('completed'),
              })
            : t('parties.party_detail.lot_remaining_age', {
                remaining: lot.balance_bags.toLocaleString('en-IN'),
                days: lot.ageDays.toLocaleString('en-IN'),
                status: statusGlyph(lot.storageStatus),
              });

          return (
            <li key={lot.lotId}>
              <Link
                href={`/inventory/${lot.lotId}`}
                className={cn(
                  'block min-h-touch rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-neutral-300',
                )}
              >
                <p className="text-base font-semibold text-neutral-900">
                  {t('lot_detail.lot_header_label', { number: lot.lot_number })} • {lot.product_name}
                </p>
                <p className="mt-1 text-body-sm text-neutral-600">
                  {t('parties.party_detail.lot_lodged_delivered', {
                    lodged: lot.original_bags.toLocaleString('en-IN'),
                    delivered: lot.delivered_bags.toLocaleString('en-IN'),
                  })}
                </p>
                <p
                  className={cn(
                    'mt-1 text-body-sm text-neutral-600',
                    isCompleted && 'font-medium text-success-600',
                  )}
                >
                  {line3}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
