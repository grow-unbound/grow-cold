'use client';

import { formatINR, type MoneyTabMovementRowDto } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const RECEIPT = '#16A34A';
const PAYMENT = '#7C3AED';

interface Props {
  row: MoneyTabMovementRowDto;
}

function methodLabel(
  t: (k: string) => string,
  m: string | null,
): string {
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
  const border = isReceipt ? RECEIPT : PAYMENT;
  const arrow = isReceipt ? '↓' : '↑';
  const emoji = isReceipt ? '💚' : '💜';
  return (
    <Link
      href={`/transaction/${row.kind}/${row.id}`}
      className={cn(
        'flex min-h-touch gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04] transition-transform active:scale-[0.99]',
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: border, borderLeftStyle: 'solid' }}
    >
      <span className="text-xl leading-none" aria-hidden>
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-neutral-800">
          {arrow} {row.counterparty}
        </p>
        <p className="line-clamp-2 text-sm text-neutral-500">{row.detailLine}</p>
        <p className="text-sm text-neutral-800">
          {formatINR(row.amount)} · {methodLabel(t, row.paymentMethod)}
        </p>
      </div>
    </Link>
  );
}
