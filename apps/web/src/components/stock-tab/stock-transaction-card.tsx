'use client';

import { formatIndianNumber, type StockTabMovementRowDto } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const LODGE = '#00B14F';
const DELIVER = '#0891B2';

interface Props {
  row: StockTabMovementRowDto;
}

export function StockTransactionCard({ row }: Props) {
  const { t } = useTranslation('pages');
  const isLodgement = row.kind === 'lodgement';
  const border = isLodgement ? LODGE : DELIVER;
  const arrow = isLodgement ? '↓' : '↑';
  const actionLabel = isLodgement ? t('stock.lodged_label') : t('stock.delivered_label');

  return (
    <Link
      href={`/inventory/${row.lotId}`}
      className={cn(
        'flex min-h-touch gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04] transition-transform active:scale-[0.99]',
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: border, borderLeftStyle: 'solid' }}
    >
      <span className="text-xl leading-none" aria-hidden>
        {row.productGroupEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-neutral-800">
          {arrow} {row.customerCode} • Lot {row.lotNumber}
        </p>
        <p className="truncate text-sm text-neutral-500">{row.productName}</p>
        <p className="text-sm text-neutral-800">
          {formatIndianNumber(row.numBags)} bags {actionLabel}
        </p>
      </div>
    </Link>
  );
}
