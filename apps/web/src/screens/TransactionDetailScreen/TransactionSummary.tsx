'use client';

import type { TransactionDetailData } from '@growcold/shared';
import { formatINR } from '@growcold/shared';
import { useTranslation } from 'react-i18next';

const GREEN = '#16A34A';
const PURPLE = '#7C3AED';
const EM = '\u2014';

function methodDisplayKey(method: string | null, t: (k: string) => string): string {
  if (!method) return t('money.method_none');
  const m = method.toUpperCase();
  if (m === 'CASH') return t('money.method_cash');
  if (m === 'UPI') return t('money.method_upi');
  if (m === 'BANK_TRANSFER') return t('money.method_bank');
  return method.replace(/_/g, ' ');
}

type Row = { label: string; value: string; valueClassName?: string; multiline?: boolean };

export function TransactionSummary({ data }: { data: TransactionDetailData }) {
  const { t } = useTranslation('pages');
  const isReceipt = data.kind === 'receipt';
  const badgeBg = isReceipt ? GREEN : PURPLE;
  const badgeText = isReceipt ? t('transaction_detail.badge_receipt') : t('transaction_detail.badge_payment');

  const counterpartyLabel = isReceipt ? t('transaction_detail.customer') : t('transaction_detail.recipient');
  const counterpartyValue = data.customerCode
    ? `${data.customerCode} \u00B7 ${data.customerOrRecipient}`
    : data.customerOrRecipient;

  const typeValue = isReceipt ? t('transaction_detail.type_receipt') : t('transaction_detail.type_payment');
  const method = methodDisplayKey(data.paymentMethod, t);

  const rows: Row[] = [
    { label: t('transaction_detail.type'), value: typeValue },
    { label: counterpartyLabel, value: counterpartyValue, multiline: true },
    {
      label: t('transaction_detail.amount'),
      value: formatINR(data.amount),
      valueClassName: isReceipt ? 'text-[#16A34A]' : 'text-neutral-900',
    },
    { label: t('transaction_detail.method'), value: method },
    { label: t('transaction_detail.date'), value: data.displayDateTime, multiline: true },
    {
      label: t('transaction_detail.recorded_by'),
      value:
        data.recordedByName === null
          ? t('transaction_detail.system_recorded')
          : data.recordedByName,
    },
    { label: t('transaction_detail.purpose'), value: data.purposeText, multiline: true },
    { label: t('transaction_detail.notes'), value: data.notesText, multiline: true },
  ];

  return (
    <div className="relative rounded-xl bg-[#F9FAFB] p-4">
      <div
        className="absolute right-3 top-3 z-10 rounded px-2 py-1 text-xs font-semibold uppercase text-white"
        style={{ backgroundColor: badgeBg }}
      >
        {badgeText}
      </div>
      <div className="pr-20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t('transaction_detail.summary_title')}
        </h2>
        <dl className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="space-y-0.5">
              <dt className="text-sm text-neutral-500">{row.label}:</dt>
              <dd
                className={`text-base font-semibold ${row.valueClassName ?? 'text-neutral-900'} ${
                  row.multiline ? 'whitespace-pre-wrap leading-relaxed' : ''
                }`}
              >
                {row.value || EM}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
