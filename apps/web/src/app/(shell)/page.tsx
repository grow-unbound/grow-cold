'use client';

import {
  AlertsSection,
  BusinessSnapshot,
  MoneyPerformance,
  PartiesPerformance,
  StockPerformance,
  TodaysActivity,
} from '@/components/command-center';
import {
  useCommandCenterActivity,
  useCommandCenterAlerts,
  useCommandCenterSnapshot,
} from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

  const snapshot = useCommandCenterSnapshot(warehouseId);
  const activity = useCommandCenterActivity(warehouseId);
  const alerts = useCommandCenterAlerts(warehouseId);

  const configured = Boolean(warehouseId);
  const updatedLabel = t('updated', { time: new Date().toLocaleTimeString() });

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{tPages('select_warehouse')}</p>
      </div>
    );
  }

  if (snapshot.isPending) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{tPages('loading')}</p>
      </div>
    );
  }

  if (snapshot.isError) {
    return (
      <div className="card w-full">
        <p className="text-danger-600 text-body-sm">{tPages('error_load')}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col bg-dashboard-surface pb-8">
      {offline ? (
        <div className="mb-2 rounded-lg bg-neutral-200 px-4 py-2">
          <p className="text-sm text-dashboard-muted">{t('offline_banner')}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-0 px-1 sm:px-0">
        <BusinessSnapshot data={snapshot.data} isLoading={configured && snapshot.isPending} />
        <TodaysActivity data={activity.data} isLoading={configured && activity.isPending} />
        <AlertsSection alerts={alerts.data} isLoading={configured && alerts.isPending} />

        {configured ? (
          <>
            <h2 className="mt-6 text-base font-bold text-neutral-900">{t('summary')}</h2>
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
