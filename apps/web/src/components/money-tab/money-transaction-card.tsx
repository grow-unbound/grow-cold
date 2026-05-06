'use client';

import { formatINR, type MoneyTabMovementRowDto } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const RECEIPT = '#0B7B6E';
const RECEIPT_BG = '#E6F5F3';
const PAYMENT = '#7B5200';
const PAYMENT_BG = '#FAF2D9';

interface Props {
  row: MoneyTabMovementRowDto;
}

function methodLabel(t: (k: string) => string, m: string | null): string {
  if (!m) return t('money.method_none');
  const k = m.toLowerCase();
  if (k === 'cash') return t('money.method_cash');
  if (k === 'upi') return t('money.method_upi');
  if (k === 'bank_transfer' || k === 'bank') return t('money.method_bank');
  return m;
}

export function MoneyTransactionCard({ row }: Props) {
  const { t } = useTranslation('pages');
  const isReceipt = row.kind === 'receipt';
  const borderColor = isReceipt ? RECEIPT : PAYMENT;
  const badgeBg = isReceipt ? RECEIPT_BG : PAYMENT_BG;
  const badgeText = isReceipt ? RECEIPT : PAYMENT;
  const kindLabel = isReceipt ? t('money.filter_receipts') : t('money.filter_payments');

  return (
    <Link
      href={`/transaction/${row.kind}/${row.id}`}
      className="flex min-h-touch gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04] transition-transform active:scale-[0.99]"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor, borderLeftStyle: 'solid' }}
    >
      <div className="min-w-0 flex-1">
        <p className="font-display text-[17px] font-semibold leading-snug text-text-primary truncate">
          {row.counterparty}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[13px] text-text-secondary">{row.detailLine}</p>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-text-tertiary">
          {methodLabel(t, row.paymentMethod)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="font-display text-[22px] font-bold tabular-nums leading-none text-text-primary">
          {formatINR(row.amount)}
        </p>
        <span
          className="mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          {kindLabel}
        </span>
      </div>
    </Link>
  );
}
