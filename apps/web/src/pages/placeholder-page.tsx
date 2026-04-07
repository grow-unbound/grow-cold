import { useTranslation } from 'react-i18next';

interface PlaceholderPageProps {
  titleKey: string;
  ns?: string;
}

export function PlaceholderPage({ titleKey, ns = 'nav' }: PlaceholderPageProps) {
  const { t } = useTranslation(ns);
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{t(titleKey)}</h2>
      <p className="mt-2 text-sm text-slate-600">Placeholder — wire Supabase + flows next.</p>
    </div>
  );
}
