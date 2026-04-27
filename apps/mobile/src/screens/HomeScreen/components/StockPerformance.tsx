import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatIndianNumber, pctVsPrevious, type HomeTimeFilter } from '@growcold/shared';
import { useStockPerformanceQuery } from '../../../features/home/useHomeQueries';
import { KpiCard } from './KpiCard';
import { PerformanceGraph } from './PerformanceGraph';
import { TimeFilterChips } from './TimeFilterChips';

function trendFromPct(pct: number | null, t: (k: string, o?: Record<string, string | number>) => string) {
  if (pct === null) return t('no_compare');
  if (pct === 0) return t('trend_same');
  if (pct > 0) return t('trend_up', { pct });
  return t('trend_down', { pct: Math.abs(pct) });
}

export function StockPerformance() {
  const { t } = useTranslation('home');
  const [filter, setFilter] = useState<HomeTimeFilter>('month');
  const { data, isLoading } = useStockPerformanceQuery(filter);

  if (isLoading || !data) {
    return (
      <Box mt="$6">
        <Text fontSize={16} fontWeight="$semibold" mb="$2">
          {t('stock')}
        </Text>
        <Box h={280} borderRadius={12} bg="$backgroundLight200" />
      </Box>
    );
  }

  const pctLodged = pctVsPrevious(data.lodgedBags, data.prevLodgedBags);
  const pctDel = pctVsPrevious(data.deliveredBags, data.prevDeliveredBags);
  const pctAvg = pctVsPrevious(data.avgBagsPerDay, data.prevAvgBagsPerDay);
  const pctAct = pctVsPrevious(data.activeLotsCount, data.prevActiveLots);

  return (
    <Box mt="$6">
      <Text fontSize={16} fontWeight="$semibold" mb="$1">
        {t('stock')}
      </Text>
      <TimeFilterChips value={filter} onChange={setFilter} />
      <Box
        mt="$2"
        p="$3"
        borderRadius={12}
        bg="$backgroundLight0"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <PerformanceGraph
          series={data.series}
          lodgedColor="#00B14F"
          deliveredColor="#0891B2"
          lodgedLegend={t('legend_lodged')}
          deliveredLegend={t('legend_delivered')}
        />
      </Box>
      <VStack space="md" mt="$3">
        <HStack space="md">
          <KpiCard
            title={t('kpi_lodged')}
            primary={`${formatIndianNumber(data.lodgedBags)} ${t('bags_unit')}`}
            secondary={`${data.lodgedLots} ${t('lots_unit')}`}
            trend={trendFromPct(pctLodged, t)}
            trendPositive={pctLodged === null ? null : pctLodged >= 0}
          />
          <KpiCard
            title={t('kpi_delivered')}
            primary={`${formatIndianNumber(data.deliveredBags)} ${t('bags_unit')}`}
            secondary={`${data.deliveredLots} ${t('lots_unit')}`}
            trend={trendFromPct(pctDel, t)}
            trendPositive={pctDel === null ? null : pctDel >= 0}
          />
        </HStack>
        <HStack space="md">
          <KpiCard
            title={t('kpi_avg_day')}
            primary={`${formatIndianNumber(Math.round(data.avgBagsPerDay))} ${t('bags_unit')}`}
            trend={trendFromPct(pctAvg, t)}
            trendPositive={pctAvg === null ? null : pctAvg >= 0}
          />
          <KpiCard
            title={t('kpi_active_lots')}
            primary={`${data.activeLotsCount} ${t('lots_unit')}`}
            trend={trendFromPct(pctAct, t)}
            trendPositive={pctAct === null ? null : pctAct >= 0}
          />
        </HStack>
      </VStack>
    </Box>
  );
}
