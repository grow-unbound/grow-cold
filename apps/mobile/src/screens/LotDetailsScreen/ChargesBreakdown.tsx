import type { LotDetailChargeRow } from '@growcold/shared';
import { formatINR, summarizeCharges } from '@growcold/shared';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

export function ChargesBreakdown({ charges }: { charges: LotDetailChargeRow[] }) {
  const { t } = useTranslation('pages');

  if (charges.length === 0) {
    return (
      <VStack space="sm" px="$4" py="$10" alignItems="center">
        <Text fontSize="$md" fontWeight="$medium" color="$textPrimary" textAlign="center">
          {t('lot_detail.charges_empty_title')}
        </Text>
        <Text fontSize="$sm" color="$textTertiary" textAlign="center">
          {t('lot_detail.charges_empty_body')}
        </Text>
      </VStack>
    );
  }

  const numeric = charges.map((c) => ({
    charge_amount: Number(c.charge_amount),
    is_paid: c.is_paid,
  }));
  const { total, collected, pending } = summarizeCharges(numeric);

  return (
    <VStack space="md" px="$4" pb="$6" pt="$2">
      <Text fontSize="$sm" fontWeight="$medium" color="$textTertiary" textTransform="uppercase">
        {t('lot_detail.charges_title')}
      </Text>
      <VStack space="md">
        {charges.map((c) => {
          const amt = Number(c.charge_amount);
          return (
            <Box
              key={c.id}
              borderBottomWidth={1}
              borderBottomColor="#F5F0E8"
              pb="$3"
            >
              <Text fontSize="$sm" color="$textPrimary">
                {c.charge_type_label}
              </Text>
              <Box flexDirection="row" flexWrap="wrap" alignItems="center" gap="$2" mt="$1">
                <Text fontSize="$sm" fontWeight="$semibold" color="$textPrimary">
                  {formatINR(amt)}
                </Text>
                <Text
                  fontSize="$xs"
                  fontWeight="$medium"
                  color={c.is_paid ? '$inward' : '$outward'}
                >
                  {c.is_paid ? t('lot_detail.charge_paid') : t('lot_detail.charge_pending')}
                </Text>
              </Box>
            </Box>
          );
        })}
      </VStack>
      <Box borderTopWidth={1} borderTopColor="#E5DED2" pt="$4" mt="$2">
        <Box flexDirection="row" justifyContent="space-between">
          <Text fontSize="$md" fontWeight="$semibold" color="$textPrimary">
            {t('lot_detail.total_charges')}
          </Text>
          <Text fontSize="$md" fontWeight="$semibold" color="$textPrimary">
            {formatINR(total)}
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between" mt="$2">
          <Text fontSize="$md" fontWeight="$semibold" color="$textPrimary">
            {t('lot_detail.collected')}
          </Text>
          <Text fontSize="$md" fontWeight="$semibold" color="#0B7B6E">
            {formatINR(collected)}
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between" mt="$2">
          <Text fontSize="$md" fontWeight="$semibold" color="$textPrimary">
            {t('lot_detail.pending')}
          </Text>
          <Text fontSize="$md" fontWeight="$semibold" color="#A83422">
            {formatINR(pending)}
          </Text>
        </Box>
      </Box>
    </VStack>
  );
}
