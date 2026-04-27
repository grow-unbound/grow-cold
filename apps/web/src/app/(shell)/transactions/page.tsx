'use client';

import { useTranslation } from 'react-i18next';
import { MoneyScreen } from '@/components/money-tab';

export default function TransactionsPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="flex w-full flex-col gap-2">
      <h1 className="sr-only">{t('transactions.title')}</h1>
      <MoneyScreen />
    </div>
  );
}
