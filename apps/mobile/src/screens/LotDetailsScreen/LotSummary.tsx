import type { LotDetailData } from '@growcold/shared';
import { computeStorageStatus, formatYmdLong } from '@growcold/shared';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <VStack space="xs">
      <Text fontSize="$sm" color="$dashboardMuted">
        {label}
      </Text>
      <Text fontSize="$md" fontWeight="$semibold" color="$textLight900">
        {value}
      </Text>
    </VStack>
  );
}

export function LotSummary({ data }: { data: LotDetailData }) {
  const { t } = useTranslation('pages');
  const { status, daysSinceLodgement } = computeStorageStatus(data.lodgement_date, data.balance_bags);

  const statusLabel =
    status === 'completed'
      ? t('lot_detail.status_completed')
      : status === 'fresh'
        ? t('lot_detail.status_fresh')
        : status === 'aging'
          ? t('lot_detail.status_aging')
          : t('lot_detail.status_stale');

  const borderColor =
    status === 'completed' || status === 'fresh'
      ? '#16A34A'
      : status === 'aging'
        ? '#F59E0B'
        : '#DC2626';

  const lodgedDate = formatYmdLong(data.lodgement_date);
  const lodgedLine = t('lot_detail.lodged_line', { bags: data.original_bags, date: lodgedDate });
  const deliveredLine = t('lot_detail.bags_delivered_meta', {
    bags: data.delivered_bags_sum,
    count: data.delivery_count,
  });

  const statusText =
    status === 'completed'
      ? `✓ ${statusLabel}`
      : t('lot_detail.status_days', { label: statusLabel, days: daysSinceLodgement });

  return (
    <Box bg="$dashboardSurface" borderRadius="$lg" p="$4">
      <Text fontSize="$sm" fontWeight="$medium" color="$dashboardMuted" textTransform="uppercase">
        {t('lot_detail.summary_title')}
      </Text>
      <VStack space="sm" mt="$3">
        <Row
          label={t('lot_detail.customer')}
          value={`${data.customer_code} · ${data.customer_name}`}
        />
        <Row label={t('lot_detail.product')} value={data.product_name} />
        <Row label={t('lot_detail.location')} value={data.location_label} />
        <Row label={t('lot_detail.lodged')} value={lodgedLine} />
        <Row label={t('lot_detail.delivered')} value={deliveredLine} />
        <Row label={t('lot_detail.balance')} value={t('lot_detail.bags_count', { count: data.balance_bags })} />
        <VStack space="xs">
          <Text fontSize="$sm" color="$dashboardMuted">
            {t('lot_detail.status')}
          </Text>
          <Box
            alignSelf="flex-start"
            borderWidth={1}
            borderColor={borderColor}
            borderRadius="$md"
            px="$2"
            py="$1"
          >
            <Text fontSize="$md" fontWeight="$semibold" style={{ color: borderColor }}>
              {statusText}
            </Text>
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
}
