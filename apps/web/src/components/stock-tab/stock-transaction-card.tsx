'use client';

import { formatIndianNumber, type StockTabMovementRowDto } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const LODGE = '#0B7B6E';
const LODGE_BG = '#E6F5F3';
const DELIVER = '#A83422';
const DELIVER_BG = '#F7EAE7';

interface Props {
  row: StockTabMovementRowDto;
}

export function StockTransactionCard({ row }: Props) {
  const { t } = useTranslation('pages');
  const isLodgement = row.kind === 'lodgement';
  const borderColor = isLodgement ? LODGE : DELIVER;
  const badgeBg = isLodgement ? LODGE_BG : DELIVER_BG;
  const badgeText = isLodgement ? LODGE : DELIVER;
  const actionLabel = isLodgement ? t('stock.lodged_label') : t('stock.delivered_label');

  return (
    <Link
      href={`/inventory/${row.lotId}`}
      className="flex min-h-touch gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04] transition-transform active:scale-[0.99]"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor, borderLeftStyle: 'solid' }}
    >
      <span className="text-xl leading-none" aria-hidden>{row.productGroupEmoji}</span>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[12px] text-text-tertiary">Lot {row.lotNumber}</p>
        <p className="font-display text-[17px] font-semibold leading-snug text-text-primary truncate">
          {row.customerCode}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-text-secondary">{row.productName}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="font-display text-[22px] font-bold tabular-nums leading-none text-text-primary">
          {formatIndianNumber(row.numBags)}
        </p>
        <p className="text-[11px] text-text-tertiary -mt-0.5">bags</p>
        <span
          className="mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          {actionLabel}
        </span>
      </div>
    </Link>
  );
}
