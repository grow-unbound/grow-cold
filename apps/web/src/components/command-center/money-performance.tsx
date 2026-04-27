'use client';

import { formatINR, pctVsPrevious, type HomeTimeFilter } from '@growcold/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommandCenterMoneyPerformance } from '@/lib/shell-queries';
import { KpiCard } from './kpi-card';
import { PerformanceChart } from './performance-chart';
import { TimeFilterChips } from './time-filter-chips';
import { trendLabelFromPct } from './trend-from-pct';

interface Props {
  warehouseId: string;
}

export function MoneyPerformance({ warehouseId }: Props) {
  const { t } = useTranslation('home');
  const [filter, setFilter] = useState<HomeTimeFilter>('month');
  const { data, isLoading } = useCommandCenterMoneyPerformance(warehouseId, filter);

  if (isLoading || !data) {
    return (
      <section className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-neutral-900">{t('money')}</h2>
        <div className="h-[280px] animate-pulse rounded-xl bg-neutral-200" />
      </section>
    );
  }

  const pctCol = pctVsPrevious(data.collected, data.prevCollected);
  const pctPaid = pctVsPrevious(data.paidOut, data.prevPaidOut);
  const pctNet = pctVsPrevious(data.net, data.prevNet);
  const pctAvg = pctVsPrevious(data.avgPerDay, data.prevAvgPerDay);

  return (
    <section className="mt-6">
      <h2 className="mb-1 text-base font-semibold text-neutral-900">{t('money')}</h2>
      <TimeFilterChips value={filter} onChange={setFilter} />
      <div className="mt-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
        <PerformanceChart
          series={data.series}
          lodgedColor="#16A34A"
          deliveredColor="#00B14F"
          lodgedLegend={t('kpi_collected')}
          deliveredLegend={t('kpi_paid_out')}
          valueFormatter={(n: number) => formatINR(n)}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <KpiCard
            title={t('kpi_collected')}
            primary={formatINR(data.collected)}
            trend={trendLabelFromPct(pctCol, t)}
            trendPositive={pctCol === null ? null : pctCol >= 0}
          />
          <KpiCard
            title={t('kpi_paid_out')}
            primary={formatINR(data.paidOut)}
            trend={trendLabelFromPct(pctPaid, t)}
            trendPositive={pctPaid === null ? null : pctPaid <= 0}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <KpiCard
            title={t('kpi_net')}
            primary={formatINR(data.net)}
            trend={trendLabelFromPct(pctNet, t)}
            trendPositive={pctNet === null ? null : pctNet >= 0}
          />
          <KpiCard
            title={t('kpi_avg_day')}
            primary={formatINR(data.avgPerDay)}
            trend={trendLabelFromPct(pctAvg, t)}
            trendPositive={pctAvg === null ? null : pctAvg >= 0}
          />
        </div>
      </div>
    </section>
  );
}
