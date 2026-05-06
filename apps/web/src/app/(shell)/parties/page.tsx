'use client';

import { useTranslation } from 'react-i18next';
import { PartiesScreen } from '@/components/parties-tab';

export default function PartiesPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="flex w-full flex-col gap-2">
      <h1 className="sr-only">{t('parties.title')}</h1>
      <PartiesScreen />
    </div>
  );
}
