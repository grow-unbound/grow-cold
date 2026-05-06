import type { CommandCenterAlertItem } from '@growcold/shared';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Props {
  alerts: CommandCenterAlertItem[] | undefined;
  isLoading: boolean;
}

function alertHref(a: CommandCenterAlertItem): string {
  if (a.nav.kind === 'party') {
    return `/parties`;
  }
  if (a.nav.kind === 'stock_stale') {
    return `/inventory`;
  }
  return `/transactions`;
}

export function AlertsSection({ alerts, isLoading }: Props) {
  const { t } = useTranslation('home');

  if (isLoading) {
    return <div className="mt-6 h-[100px] animate-pulse rounded-xl bg-neutral-200" />;
  }

  const items = alerts ?? [];

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-dashboard-danger">
        {t('needs_attention')}
      </h2>
      {items.length === 0 ? (
        <p className="text-base text-dashboard-muted">{t('alerts_empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={alertHref(a)}
                className="block py-2 text-base text-neutral-900 underline-offset-2 hover:underline"
              >
                • {a.message}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
