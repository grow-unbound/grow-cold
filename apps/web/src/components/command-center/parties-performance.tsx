'use client';

import { formatINR, formatIndianNumber, pctVsPrevious, type HomeTimeFilter } from '@growcold/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommandCenterPartiesPerformance } from '@/lib/shell-queries';
import { KpiCard } from './kpi-card';
import { PerformanceChart } from './performance-chart';
import { TimeFilterChips } from './time-filter-chips';
import { trendLabelFromPct } from './trend-from-pct';

interface Props {
  warehouseId: string;
}

export function PartiesPerformance({ warehouseId }: Props) {
  const { t } = useTranslation('home');
  const [filter, setFilter] = useState<HomeTimeFilter>('month');
  const { data, isLoading } = useCommandCenterPartiesPerformance(warehouseId, filter);

  if (isLoading || !data) {
    return (
      <section className="mt-6">
        <h2 className="mb-2 text-base font-semibold text-neutral-900">{t('parties')}</h2>
        <div className="h-[280px] animate-pulse rounded-xl bg-neutral-200" />
      </section>
    );
  }

  const pctCol = pctVsPrevious(data.collections, data.prevCollections);
  const pctAct = pctVsPrevious(data.activeCustomers, data.prevActiveCustomers);
  const pctNew = pctVsPrevious(data.newCustomers, data.prevNewCustomers);
  const pctPaid = pctVsPrevious(data.paidInFull, data.prevPaidInFull);

  return (
    <section className="mt-6">
      <h2 className="mb-1 text-base font-semibold text-neutral-900">{t('parties')}</h2>
      <TimeFilterChips value={filter} onChange={setFilter} />
      <div className="mt-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
        <PerformanceChart
          series={data.series}
          lodgedColor="#7C3AED"
          deliveredColor="#0891B2"
          lodgedLegend={t('legend_collections')}
          deliveredLegend={t('legend_receipts')}
          valueFormatter={(n: number) => formatIndianNumber(n)}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <KpiCard
            title={t('kpi_collections')}
            primary={formatINR(data.collections)}
            trend={trendLabelFromPct(pctCol, t)}
            trendPositive={pctCol === null ? null : pctCol >= 0}
          />
          <KpiCard
            title={t('kpi_active_customers')}
            primary={`${data.activeCustomers} ${t('customers')}`}
            trend={trendLabelFromPct(pctAct, t)}
            trendPositive={pctAct === null ? null : pctAct >= 0}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <KpiCard
            title={t('kpi_new_customers')}
            primary={`${data.newCustomers}`}
            trend={trendLabelFromPct(pctNew, t)}
            trendPositive={pctNew === null ? null : pctNew >= 0}
          />
          <KpiCard
            title={t('kpi_paid_full')}
            primary={`${data.paidInFull} ${t('customers')}`}
            trend={trendLabelFromPct(pctPaid, t)}
            trendPositive={pctPaid === null ? null : pctPaid >= 0}
          />
        </div>
      </div>
    </section>
  );
}
