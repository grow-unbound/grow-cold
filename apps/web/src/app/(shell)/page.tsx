'use client';

import {
  AlertsSection,
  BusinessSnapshot,
  MoneyPerformance,
  PartiesPerformance,
  StockPerformance,
  TodaysActivity,
} from '@/components/command-center';
import { UserMenu } from '@/components/layout/user-menu';
import { useCommandCenterHome } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function HomeMobileHeader() {
  const { t } = useTranslation('nav');
  const { t: tSearch } = useTranslation('search');
  const router = useRouter();

  return (
    <div
      className={cn(
        'mb-2 flex min-h-touch items-center justify-between gap-2 lg:hidden',
        'pt-[max(0.25rem,env(safe-area-inset-top,0px))]',
      )}
    >
      <h1 className="min-w-0 flex-1 font-display text-h3 font-medium tracking-tight text-text-primary">
        {t('home')}
      </h1>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => router.push('/search')}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-brand-ui"
          aria-label={tSearch('open_aria')}
        >
          <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
        <UserMenu triggerVariant="avatar-only" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation('home');
  const { t: tPages } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function sync() {
      setOffline(typeof navigator !== 'undefined' && navigator.onLine === false);
    }
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  const home = useCommandCenterHome(warehouseId);

  const configured = Boolean(warehouseId);
  const updatedLabel = t('updated', { time: new Date().toLocaleTimeString() });

  let main: ReactNode;

  if (!warehouseId) {
    main = (
      <div className="card w-full">
        <p className="text-body-sm text-text-secondary">{tPages('select_warehouse')}</p>
      </div>
    );
  } else if (home.isPending) {
    main = (
      <div className="card w-full">
        <p className="text-body-sm text-text-secondary">{tPages('loading')}</p>
      </div>
    );
  } else if (home.isError || !home.data) {
    main = (
      <div className="card w-full">
        <p className="text-outward text-body-sm">{tPages('error_load')}</p>
      </div>
    );
  } else {
    const { snapshot, activity, alerts } = home.data;
    main = (
      <div className="flex w-full flex-col bg-dashboard-surface pb-8">
        {offline ? (
          <div className="mb-2 rounded-lg bg-surface-inset px-4 py-2">
            <p className="text-sm text-dashboard-muted">{t('offline_banner')}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-0 px-1 sm:px-0">
          <BusinessSnapshot data={snapshot} isLoading={Boolean(warehouseId) && home.isFetching} />
          <TodaysActivity data={activity} isLoading={Boolean(warehouseId) && home.isFetching} />
          <AlertsSection alerts={alerts} isLoading={Boolean(warehouseId) && home.isFetching} />

          {configured ? (
            <>
              <h2 className="mt-6 text-base font-bold text-text-primary">{t('summary')}</h2>
              <StockPerformance warehouseId={warehouseId} />
              <MoneyPerformance warehouseId={warehouseId} />
              <PartiesPerformance warehouseId={warehouseId} />
              <p className="mt-2 text-xs text-dashboard-muted">{updatedLabel}</p>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <>
      <HomeMobileHeader />
      {main}
    </>
  );
}
