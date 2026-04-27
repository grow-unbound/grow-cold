'use client';

import { useTranslation } from 'react-i18next';
import { StockScreen } from '@/components/stock-tab';

export default function InventoryPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="flex w-full flex-col gap-2">
      <h1 className="sr-only">{t('inventory.title')}</h1>
      <StockScreen />
    </div>
  );
}
