import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import { formatINR, formatIndianNumber, type BusinessSnapshot as Snapshot } from '@growcold/shared';

interface Props {
  data: Snapshot | undefined;
  isLoading: boolean;
}

export function BusinessSnapshot({ data, isLoading }: Props) {
  const { t } = useTranslation('home');

  if (isLoading || !data) {
    return (
      <HStack space="sm" mt="$2">
        <Box flex={1} h={120} borderRadius={12} bg="$backgroundLight200" />
        <Box flex={1} h={120} borderRadius={12} bg="$backgroundLight200" />
      </HStack>
    );
  }

  return (
    <HStack space="sm" mt="$2">
      <Pressable
        flex={1}
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
        accessibilityRole="summary"
      >
        <VStack space="xs">
          <Text fontSize={24}>💰</Text>
          <Text fontSize={24} fontWeight="$bold" color="$textLight900">
            {formatINR(data.cashBalance)}
          </Text>
          <Text size="sm" color="$textLight500">
            {t('cash_balance')}
          </Text>
          <Text size="sm" color="$textLight500">
            {t('received_today')}: {formatINR(data.receivedToday)}
          </Text>
          <Text size="sm" color="$textLight500">
            {t('paid_today')}: {formatINR(data.paidToday)}
          </Text>
        </VStack>
      </Pressable>
      <Pressable
        flex={1}
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
        accessibilityRole="summary"
      >
        <VStack space="xs">
          <Text fontSize={24}>📦</Text>
          <Text fontSize={24} fontWeight="$bold" color="$textLight900">
            {formatIndianNumber(data.totalBags)}
          </Text>
          <Text size="sm" color="$textLight500">
            {t('total_bags')}
          </Text>
          <Text size="sm" color="$textLight500">
            {t('total_lots')}: {data.totalLots}
          </Text>
          <Text size="sm" color="$dashboardDanger">
            {t('stale_lots')}: {data.staleLots}
          </Text>
        </VStack>
      </Pressable>
    </HStack>
  );
}
