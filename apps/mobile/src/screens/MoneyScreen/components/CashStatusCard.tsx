import { formatINR, type MoneyTabSummary } from '@growcold/shared';
import { Box, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

interface Props {
  data: MoneyTabSummary | undefined;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function CashStatusCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <Box
      mx="$2"
      mb="$3"
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
      <Pressable onPress={onToggle} accessibilityRole="button">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text fontSize={12} fontWeight="$semibold" color="$textLight500" letterSpacing={0.5}>
            {t('money.cash_status')}
          </Text>
          <Text fontSize={16} color="$textLight400">
            {expanded ? '▼' : '▶'}
          </Text>
        </Box>
      </Pressable>

      {isLoading ? (
        <Text mt="$2" size="sm" color="$textLight500">
          {t('loading')}
        </Text>
      ) : null}

      {!isLoading && data && !expanded ? (
        <Text mt="$1" textAlign="center" fontSize={22} fontWeight="$bold" color="$textLight900">
          {formatINR(data.cashBalance)} {t('money.balance_label')}
        </Text>
      ) : null}

      {!isLoading && data && expanded ? (
        <VStack mt="$3" space="md">
          <Text textAlign="center" fontSize={22} fontWeight="$bold" color="$textLight900">
            {formatINR(data.cashBalance)} {t('money.balance_label')}
          </Text>
          <Box flexDirection="row">
            <VStack flex={1} alignItems="center" space="xs">
              <Text fontSize={16} fontWeight="$semibold" color="$textLight900">
                {formatINR(data.receivedToday)}
              </Text>
              <Text fontSize={11} color="$textLight500">
                {t('money.received_sub')}
              </Text>
            </VStack>
            <VStack flex={1} alignItems="center" space="xs">
              <Text fontSize={16} fontWeight="$semibold" color="$textLight900">
                {formatINR(data.paidToday)}
              </Text>
              <Text fontSize={11} color="$textLight500">
                {t('money.paid_sub')}
              </Text>
            </VStack>
            <VStack flex={1} alignItems="center" space="xs">
              <Text fontSize={16} fontWeight="$semibold" color="$textLight900">
                {formatINR(data.payablePending)}
              </Text>
              <Text fontSize={11} color="$textLight500">
                {t('money.payable_sub')}
              </Text>
            </VStack>
          </Box>
          <Text textAlign="center" fontSize={11} color="$textLight400">
            {t('stock.updated_ago', { time: new Date(data.updatedAt).toLocaleString() })}
          </Text>
        </VStack>
      ) : null}
    </Box>
  );
}
