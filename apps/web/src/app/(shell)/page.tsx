'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeMobileHeader } from '@/components/layout/home-mobile-header';
import { KpiGrid, KpiGridSkeleton } from '@/components/home/kpi-grid';
import { StockMovementsWidget } from '@/components/home/stock-movements-widget';
import { PaymentsReceiptsWidget } from '@/components/home/payments-receipts-widget';
import { StockTrendGraph, PeriodChips } from '@/components/home/trend-graph';
import { useHomeSnapshot, useHomeTrend, type Period } from '@/lib/home-queries';
import { useSessionStore } from '@/stores/session-store';

export default function HomePage() {
  const { t } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [period, setPeriod] = useState<Period>('week');

  const snapshotQ = useHomeSnapshot(warehouseId);
  const trendQ = useHomeTrend(warehouseId, period);

  if (!warehouseId) {
    return (
      <>
        <HomeMobileHeader />
        <div className="card">
          <p className="text-small text-text-secondary">{t('select_warehouse')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <HomeMobileHeader />
      <div className="flex w-full flex-col gap-4 pb-8">
        {/* KPI Grid */}
        {snapshotQ.isPending ? (
          <KpiGridSkeleton />
        ) : snapshotQ.data ? (
          <KpiGrid snapshot={snapshotQ.data.snapshot} />
        ) : snapshotQ.isError ? (
          <div className="card">
            <p className="text-small text-outward">Couldn't load data. Try again.</p>
          </div>
        ) : null}

        {/* Page-level period filter — controls trend graph */}
        <div className="flex flex-col gap-2">
          <p className="type-label">Time Period</p>
          <PeriodChips value={period} onChange={setPeriod} />
        </div>

        {/* Trend graph */}
        {trendQ.isPending ? (
          <div className="skeleton h-40 w-full rounded-lg" />
        ) : trendQ.data ? (
          <StockTrendGraph series={trendQ.data.series} />
        ) : null}

        {/* Two transaction widgets — stacked on mobile, side by side on desktop */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {snapshotQ.isPending ? (
            <>
              <div className="skeleton h-64 rounded-lg" />
              <div className="skeleton h-64 rounded-lg" />
            </>
          ) : snapshotQ.data ? (
            <>
              <StockMovementsWidget events={snapshotQ.data.stockEvents} />
              <PaymentsReceiptsWidget events={snapshotQ.data.moneyEvents} />
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
