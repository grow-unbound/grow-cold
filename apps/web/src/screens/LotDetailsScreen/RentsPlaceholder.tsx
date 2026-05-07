'use client';

import { useTranslation } from 'react-i18next';

export function RentsPlaceholder() {
  const { t } = useTranslation('pages');
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <h3 className="text-sm font-medium uppercase tracking-wide text-text-tertiary">
        {t('lot_detail.rents_title')}
      </h3>
      <p className="max-w-md text-sm leading-relaxed text-text-tertiary">{t('lot_detail.rents_placeholder_body')}</p>
    </div>
  );
}
