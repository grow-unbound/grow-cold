'use client';

import { useTranslation } from 'react-i18next';

/** Placeholder brand mark until marketing assets are wired in. */
export function AuthBrandLogo() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold tracking-tight text-white shadow-md ring-1 ring-black/[0.06]"
        aria-hidden
      >
        GC
      </div>
      <span className="text-sm font-semibold text-neutral-800">{t('app_name')}</span>
    </div>
  );
}
