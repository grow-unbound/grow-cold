'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { OperationalPaymentForm } from '@/components/operational-payment/operational-payment-form';

export default function EditOperationalPaymentPage() {
  const { t } = useTranslation('pages');
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : null;

  if (!id) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Link href="/transactions" className="text-caption font-medium text-primary-600 hover:underline">
        ← {t('operational_payment.back_transactions')}
      </Link>
      <h1 className="h2">{t('operational_payment.edit_title')}</h1>
      <OperationalPaymentForm mode="edit" paymentId={id} />
    </div>
  );
}
