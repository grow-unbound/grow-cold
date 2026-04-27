import type { LotDetailDeliveryRow } from '@growcold/shared';
import { formatYmdLong } from '@growcold/shared';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

export function DeliveriesList({ deliveries }: { deliveries: LotDetailDeliveryRow[] }) {
  const { t } = useTranslation('pages');

  if (deliveries.length === 0) {
    return (
      <VStack space="sm" px="$4" py="$10" alignItems="center">
        <Text fontSize="$md" fontWeight="$medium" color="$textLight900" textAlign="center">
          {t('lot_detail.deliveries_empty_title')}
        </Text>
        <Text fontSize="$sm" color="$dashboardMuted" textAlign="center">
          {t('lot_detail.deliveries_empty_body')}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack space="md" px="$4" pb="$6" pt="$2">
      {deliveries.map((d) => {
        const driver = d.driver_name?.trim();
        const vehicle = d.vehicle_number?.trim();
        const meta = t('lot_detail.bags_count', { count: d.num_bags_out });
        const driverPart = driver && driver.length > 0 ? ` • ${t('lot_detail.driver')}: ${driver}` : '';
        return (
          <Box
            key={d.id}
            borderWidth={1}
            borderColor="#E2E4E8"
            borderRadius="$lg"
            bg="$white"
            p="$3"
          >
            <Text fontSize="$md" fontWeight="$semibold" color="$textLight900">
              {formatYmdLong(d.delivery_date)}
            </Text>
            <Text mt="$1" fontSize="$sm" color="$dashboardMuted">
              {meta}
              {driverPart}
            </Text>
            {vehicle && vehicle.length > 0 ? (
              <Text mt="$0.5" fontSize="$sm" color="$dashboardMuted">
                {t('lot_detail.vehicle')}: {vehicle}
              </Text>
            ) : null}
          </Box>
        );
      })}
    </VStack>
  );
}
