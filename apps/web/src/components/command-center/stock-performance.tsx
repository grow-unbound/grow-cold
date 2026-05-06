'use client';

import { formatIndianNumber, pctVsPrevious, type HomeTimeFilter } from '@growcold/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommandCenterStockPerformance } from '@/lib/shell-queries';
import { KpiCard } from './kpi-card';
import { PerformanceChart } from './performance-chart';
import { TimeFilterChips } from './time-filter-chips';
import { trendLabelFromPct } from './trend-from-pct';

interface Props {
  warehouseId: string;
}

export function StockPerformance({ warehouseId }: Props) {
  const { t } = useTranslation('home');
  const [filter, setFilter] = useState<HomeTimeFilter>('month');
  const { data, isLoading } = useCommandCenterStockPerformance(warehouseId, filter);

  if (isLoading || !data) {
    return (
      <section className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-neutral-900">{t('stock')}</h2>
        <div className="h-[280px] animate-pulse rounded-xl bg-neutral-200" />
      </section>
    );
  }

  const pctLodged = pctVsPrevious(data.lodgedBags, data.prevLodgedBags);
  const pctDel = pctVsPrevious(data.deliveredBags, data.prevDeliveredBags);
  const pctAvg = pctVsPrevious(data.avgBagsPerDay, data.prevAvgBagsPerDay);
  const pctAct = pctVsPrevious(data.activeLotsCount, data.prevActiveLots);

  return (
    <section className="mt-6">
      <h2 className="mb-1 text-base font-semibold text-neutral-900">{t('stock')}</h2>
      <TimeFilterChips value={filter} onChange={setFilter} />
      <div className="mt-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
        <PerformanceChart
          series={data.series}
          lodgedColor="#00B14F"
          deliveredColor="#0891B2"
          lodgedLegend={t('legend_lodged')}
          deliveredLegend={t('legend_delivered')}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <KpiCard
            title={t('kpi_lodged')}
            primary={`${formatIndianNumber(data.lodgedBags)} ${t('bags_unit')}`}
            secondary={`${data.lodgedLots} ${t('lots_unit')}`}
            trend={trendLabelFromPct(pctLodged, t)}
            trendPositive={pctLodged === null ? null : pctLodged >= 0}
          />
          <KpiCard
            title={t('kpi_delivered')}
            primary={`${formatIndianNumber(data.deliveredBags)} ${t('bags_unit')}`}
            secondary={`${data.deliveredLots} ${t('lots_unit')}`}
            trend={trendLabelFromPct(pctDel, t)}
            trendPositive={pctDel === null ? null : pctDel >= 0}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <KpiCard
            title={t('kpi_avg_day')}
            primary={`${formatIndianNumber(Math.round(data.avgBagsPerDay))} ${t('bags_unit')}`}
            trend={trendLabelFromPct(pctAvg, t)}
            trendPositive={pctAvg === null ? null : pctAvg >= 0}
          />
          <KpiCard
            title={t('kpi_active_lots')}
            primary={`${data.activeLotsCount} ${t('lots_unit')}`}
            trend={trendLabelFromPct(pctAct, t)}
            trendPositive={pctAct === null ? null : pctAct >= 0}
          />
        </div>
      </div>
    </section>
  );
}
