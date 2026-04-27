'use client';

import type { PartyDetailReceiptRow } from '@growcold/shared';
import { formatINR, formatYmdLong } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { paymentMethodLabel } from './payment-method-label';

interface Props {
  receipts: PartyDetailReceiptRow[];
  hasMore: boolean;
  onLoadMore: () => void;
  isFetchingMore: boolean;
}

export function ReceiptsList({ receipts, hasMore, onLoadMore, isFetchingMore }: Props) {
  const { t, i18n } = useTranslation('pages');

  if (receipts.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-8 text-center shadow-sm">
        <p className="text-base font-semibold text-neutral-900">{t('parties.party_detail.empty_receipts_title')}</p>
        <p className="mt-1 text-body-sm text-neutral-600">{t('parties.party_detail.empty_receipts_body')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {receipts.map((r) => {
          const lotLine =
            r.lotNumbers.length > 0
              ? `${r.purpose} • ${t('parties.party_detail.receipt_lots', { numbers: r.lotNumbers.join(', ') })}`
              : r.purpose;
          return (
            <li key={r.id}>
              <Link
                href={`/transaction/receipt/${r.id}`}
                className="block min-h-touch rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-neutral-300"
              >
                <p className="text-base font-semibold text-neutral-900">
                  {formatYmdLong(r.receipt_date, i18n.language)} • {formatINR(r.amount)}
                </p>
                <p className="mt-1 text-body-sm text-neutral-600">{lotLine}</p>
                <p className="mt-1 text-body-sm text-neutral-600">{paymentMethodLabel(r.payment_method, t)}</p>
              </Link>
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <button
          type="button"
          className="btn-secondary w-full py-3"
          onClick={() => onLoadMore()}
          disabled={isFetchingMore}
        >
          {isFetchingMore ? t('parties.load_more') : t('parties.party_detail.load_more')}
        </button>
      ) : null}
    </div>
  );
}
