'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { OperationalPaymentForm } from '@/components/operational-payment/operational-payment-form';

export default function NewOperationalPaymentPage() {
  const { t } = useTranslation('pages');
  const sp = useSearchParams();
  const lotId = sp.get('lotId');

  return (
    <div className="flex w-full flex-col gap-3">
      <Link href="/transactions" className="text-caption font-medium text-brand-text hover:underline">
        ← {t('operational_payment.back_transactions')}
      </Link>
      <h1 className="h2">{t('operational_payment.new_title')}</h1>
      <OperationalPaymentForm mode="create" initialLotId={lotId} />
    </div>
  );
}
