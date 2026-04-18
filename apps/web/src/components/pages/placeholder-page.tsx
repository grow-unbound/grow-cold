'use client';

import { useTranslation } from 'react-i18next';

interface PlaceholderPageProps {
  titleKey: string;
  ns?: string;
}

export function PlaceholderPage({ titleKey, ns = 'nav' }: PlaceholderPageProps) {
  const { t } = useTranslation(ns);
  return (
    <div className="card w-full">
      <h2 className="h2">{t(titleKey)}</h2>
      <p className="mt-1.5 text-body-sm text-neutral-600">Placeholder — wire Supabase + flows next.</p>
    </div>
  );
}
