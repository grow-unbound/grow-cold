import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { formatINR, formatIndianNumber } from '@growcold/shared';
import { useTranslation } from 'react-i18next';

type Summary = {
  totalReceivable: number;
  customersWithDues: number;
  rentReceivable: number;
  rentLotCount: number;
  chargesReceivable: number;
  chargesLotCount: number;
  othersReceivable: number;
  othersCustomerCount: number;
  updatedAt: string;
} | null;

interface Props {
  data: Summary;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function lineAmount(n: number): string {
  if (n >= 100000) return `₹${formatIndianNumber(n)}`;
  return formatINR(n);
}

export function ReceivablesCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <Box bg="$white" borderRadius={12} p="$3" borderWidth={1} borderColor="#E5E7EB">
      <Pressable onPress={onToggle} flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text fontSize={12} fontWeight="$bold" color="#6B7280" letterSpacing={0.5}>
          {t('parties.receivables')}
        </Text>
        <Text color="#9CA3AF">{expanded ? '▼' : '▶'}</Text>
      </Pressable>
      {isLoading ? (
        <Text mt="$2" size="sm" color="$textLight500">
          {t('loading')}
        </Text>
      ) : null}
      {!isLoading && data ? (
        <Box mt="$2">
          {expanded ? (
            <Box>
              <Text fontSize={22} fontWeight="$bold" color="#111827">
                {t('parties.main_line', { amount: lineAmount(data.totalReceivable), count: data.customersWithDues })}
              </Text>
              <Box flexDirection="row" mt="$4" justifyContent="space-between">
                <Box flex={1} alignItems="center">
                  <Text fontSize={16} fontWeight="$bold" color="#111827">
                    {lineAmount(data.rentReceivable)}
                  </Text>
                  <Text size="sm" color="#374151" mt="$1">
                    {t('parties.rents')}
                  </Text>
                  <Text size="xs" color="#6B7280" mt="$1">
                    {t('parties.rent_lots', { count: data.rentLotCount })}
                  </Text>
                </Box>
                <Box flex={1} alignItems="center">
                  <Text fontSize={16} fontWeight="$bold" color="#111827">
                    {lineAmount(data.chargesReceivable)}
                  </Text>
                  <Text size="sm" color="#374151" mt="$1">
                    {t('parties.charges')}
                  </Text>
                  <Text size="xs" color="#6B7280" mt="$1">
                    {t('parties.charge_lots', { count: data.chargesLotCount })}
                  </Text>
                </Box>
                <Box flex={1} alignItems="center">
                  <Text fontSize={16} fontWeight="$bold" color="#111827">
                    {lineAmount(data.othersReceivable)}
                  </Text>
                  <Text size="sm" color="#374151" mt="$1">
                    {t('parties.others')}
                  </Text>
                  <Text size="xs" color="#6B7280" mt="$1">
                    {t('parties.others_customers', { count: data.othersCustomerCount })}
                  </Text>
                </Box>
              </Box>
            </Box>
          ) : (
            <Text size="md" color="#111827" fontWeight="$semibold">
              {t('parties.main_line', { amount: lineAmount(data.totalReceivable), count: data.customersWithDues })}
            </Text>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
