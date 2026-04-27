import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatINR, formatIndianNumber, pctVsPrevious, type HomeTimeFilter } from '@growcold/shared';
import { usePartiesPerformanceQuery } from '../../../features/home/useHomeQueries';
import { KpiCard } from './KpiCard';
import { PerformanceGraph } from './PerformanceGraph';
import { TimeFilterChips } from './TimeFilterChips';

function trendFromPct(pct: number | null, t: (k: string, o?: Record<string, string | number>) => string) {
  if (pct === null) return t('no_compare');
  if (pct === 0) return t('trend_same');
  if (pct > 0) return t('trend_up', { pct });
  return t('trend_down', { pct: Math.abs(pct) });
}

export function PartiesPerformance() {
  const { t } = useTranslation('home');
  const [filter, setFilter] = useState<HomeTimeFilter>('month');
  const { data, isLoading } = usePartiesPerformanceQuery(filter);

  if (isLoading || !data) {
    return (
      <Box mt="$6">
        <Text fontSize={16} fontWeight="$semibold" mb="$2">
          {t('parties')}
        </Text>
        <Box h={280} borderRadius={12} bg="$backgroundLight200" />
      </Box>
    );
  }

  const pctCol = pctVsPrevious(data.collections, data.prevCollections);
  const pctAct = pctVsPrevious(data.activeCustomers, data.prevActiveCustomers);
  const pctNew = pctVsPrevious(data.newCustomers, data.prevNewCustomers);
  const pctPaid = pctVsPrevious(data.paidInFull, data.prevPaidInFull);

  return (
    <Box mt="$6">
      <Text fontSize={16} fontWeight="$semibold" mb="$1">
        {t('parties')}
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
          lodgedColor="#7C3AED"
          deliveredColor="#0891B2"
          lodgedLegend={t('legend_collections')}
          deliveredLegend={t('legend_receipts')}
          valueFormatter={(n) => formatIndianNumber(n)}
        />
      </Box>
      <VStack space="md" mt="$3">
        <HStack space="md">
          <KpiCard
            title={t('kpi_collections')}
            primary={formatINR(data.collections)}
            trend={trendFromPct(pctCol, t)}
            trendPositive={pctCol === null ? null : pctCol >= 0}
          />
          <KpiCard
            title={t('kpi_active_customers')}
            primary={`${data.activeCustomers} ${t('customers')}`}
            trend={trendFromPct(pctAct, t)}
            trendPositive={pctAct === null ? null : pctAct >= 0}
          />
        </HStack>
        <HStack space="md">
          <KpiCard
            title={t('kpi_new_customers')}
            primary={`${data.newCustomers}`}
            trend={trendFromPct(pctNew, t)}
            trendPositive={pctNew === null ? null : pctNew >= 0}
          />
          <KpiCard
            title={t('kpi_paid_full')}
            primary={`${data.paidInFull} ${t('customers')}`}
            trend={trendFromPct(pctPaid, t)}
            trendPositive={pctPaid === null ? null : pctPaid >= 0}
          />
        </HStack>
      </VStack>
    </Box>
  );
}
