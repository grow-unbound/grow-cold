'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTransactionDetail } from '@/lib/shell-queries';
import { TransactionDetailsView } from '@/screens/TransactionDetailScreen/TransactionDetailsView';

export default function TransactionDetailPage() {
  const { t } = useTranslation('pages');
  const params = useParams();
  const kind = typeof params.kind === 'string' ? params.kind : null;
  const id = typeof params.id === 'string' ? params.id : null;
  const q = useTransactionDetail(
    kind === 'receipt' || kind === 'payment' ? kind : null,
    id,
  );

  if (kind !== 'receipt' && kind !== 'payment') {
    return (
      <div className="card mx-auto w-full max-w-2xl p-4">
        <p className="text-body-sm text-danger-600">Invalid link.</p>
        <Link href="/transactions" className="btn-secondary mt-2 inline-flex">
          {t('money.back_to_money')}
        </Link>
      </div>
    );
  }

  if (q.isPending) {
    return (
      <div className="card mx-auto w-full max-w-2xl p-4">
        <p className="text-body-sm text-neutral-600">{t('loading')}</p>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="card mx-auto w-full max-w-2xl p-4">
        <p className="text-body-sm text-danger-600">{t('error_load')}</p>
        <Link href="/transactions" className="mt-2 inline-block text-sm text-primary-600 underline">
          {t('money.back_to_money')}
        </Link>
      </div>
    );
  }

  return <TransactionDetailsView data={q.data} dataUpdatedAt={q.dataUpdatedAt} />;
}
