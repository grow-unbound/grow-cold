import { Box, Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import { formatINR, type TodaysActivity as Activity } from '@growcold/shared';

interface Props {
  data: Activity | undefined;
  isLoading: boolean;
}

export function TodaysActivity({ data, isLoading }: Props) {
  const { t } = useTranslation('home');

  if (isLoading || !data) {
    return <Box h={140} mt="$6" borderRadius={12} bg="$backgroundLight200" />;
  }

  return (
    <Box
      mt="$6"
      p="$4"
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
      <Text size="sm" fontWeight="$bold" color="$textLight500" textTransform="uppercase" mb="$3">
        {t('todays_activity')}
      </Text>
      <VStack space="sm">
        <Text fontSize={16} color="$textLight900">
          <Text color="$dashboardLodged">↓ </Text>
          {t('lodgements_fmt', { count: data.lodgementsCount, bags: data.lodgementsBags })}
        </Text>
        <Text fontSize={16} color="$textLight900">
          <Text color="$dashboardDelivered">↑ </Text>
          {t('deliveries_fmt', { count: data.deliveriesCount, bags: data.deliveriesBags })}
        </Text>
        <Text fontSize={16} color="$textLight900">
          <Text color="$dashboardMoney">₹ </Text>
          {t('collected_fmt', {
            amount: formatINR(data.collectedAmount),
            count: data.collectedCustomerCount,
          })}
        </Text>
      </VStack>
    </Box>
  );
}
