import { useTranslation } from 'react-i18next';

interface PlaceholderPageProps {
  titleKey: string;
  ns?: string;
}

export function PlaceholderPage({ titleKey, ns = 'nav' }: PlaceholderPageProps) {
  const { t } = useTranslation(ns);
  return (
    <div className="card mx-auto max-w-lg">
      <h2 className="h2">{t(titleKey)}</h2>
      <p className="mt-2 text-body-sm text-neutral-600">Placeholder — wire Supabase + flows next.</p>
    </div>
  );
}
