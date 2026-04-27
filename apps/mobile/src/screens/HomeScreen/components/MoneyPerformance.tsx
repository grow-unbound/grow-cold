import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatINR, pctVsPrevious, type HomeTimeFilter } from '@growcold/shared';
import { useMoneyPerformanceQuery } from '../../../features/home/useHomeQueries';
import { KpiCard } from './KpiCard';
import { PerformanceGraph } from './PerformanceGraph';
import { TimeFilterChips } from './TimeFilterChips';

function trendFromPct(pct: number | null, t: (k: string, o?: Record<string, string | number>) => string) {
  if (pct === null) return t('no_compare');
  if (pct === 0) return t('trend_same');
  if (pct > 0) return t('trend_up', { pct });
  return t('trend_down', { pct: Math.abs(pct) });
}

export function MoneyPerformance() {
  const { t } = useTranslation('home');
  const [filter, setFilter] = useState<HomeTimeFilter>('month');
  const { data, isLoading } = useMoneyPerformanceQuery(filter);

  if (isLoading || !data) {
    return (
      <Box mt="$6">
        <Text fontSize={16} fontWeight="$semibold" mb="$2">
          {t('money')}
        </Text>
        <Box h={280} borderRadius={12} bg="$backgroundLight200" />
      </Box>
    );
  }

  const pctCol = pctVsPrevious(data.collected, data.prevCollected);
  const pctPaid = pctVsPrevious(data.paidOut, data.prevPaidOut);
  const pctNet = pctVsPrevious(data.net, data.prevNet);
  const pctAvg = pctVsPrevious(data.avgPerDay, data.prevAvgPerDay);

  return (
    <Box mt="$6">
      <Text fontSize={16} fontWeight="$semibold" mb="$1">
        {t('money')}
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
          lodgedColor="#16A34A"
          deliveredColor="#00B14F"
          lodgedLegend={t('kpi_collected')}
          deliveredLegend={t('kpi_paid_out')}
          valueFormatter={(n) => formatINR(n)}
        />
      </Box>
      <VStack space="md" mt="$3">
        <HStack space="md">
          <KpiCard
            title={t('kpi_collected')}
            primary={formatINR(data.collected)}
            trend={trendFromPct(pctCol, t)}
            trendPositive={pctCol === null ? null : pctCol >= 0}
          />
          <KpiCard
            title={t('kpi_paid_out')}
            primary={formatINR(data.paidOut)}
            trend={trendFromPct(pctPaid, t)}
            trendPositive={pctPaid === null ? null : pctPaid <= 0}
          />
        </HStack>
        <HStack space="md">
          <KpiCard
            title={t('kpi_net')}
            primary={formatINR(data.net)}
            trend={trendFromPct(pctNet, t)}
            trendPositive={pctNet === null ? null : pctNet >= 0}
          />
          <KpiCard
            title={t('kpi_avg_day')}
            primary={formatINR(data.avgPerDay)}
            trend={trendFromPct(pctAvg, t)}
            trendPositive={pctAvg === null ? null : pctAvg >= 0}
          />
        </HStack>
      </VStack>
    </Box>
  );
}
