import type { PartyDetailLotRow } from '@growcold/shared';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

function statusGlyph(status: PartyDetailLotRow['storageStatus']): string {
  switch (status) {
    case 'fresh':
      return '🟢';
    case 'aging':
      return '🟡';
    case 'stale':
      return '⚠️';
    case 'completed':
      return '✓';
    default:
      return '';
  }
}

interface Props {
  lots: PartyDetailLotRow[];
  onOpenLot: (lotId: string) => void;
}

export function LotsList({ lots, onOpenLot }: Props) {
  const { t } = useTranslation('pages');

  if (lots.length === 0) {
    return (
      <Box borderRadius={12} borderWidth={1} borderColor="#E5E7EB" bg="$white" px="$4" py="$8" alignItems="center">
        <Text fontSize={16} fontWeight="$semibold" color="$textLight900" textAlign="center">
          {t('parties.party_detail.empty_lots_title')}
        </Text>
        <Text mt="$2" fontSize={14} color="$textLight600" textAlign="center">
          {t('parties.party_detail.empty_lots_body')}
        </Text>
      </Box>
    );
  }

  return (
    <Box gap="$3">
      <Text fontSize={12} fontWeight="$medium" color="$textLight500" textTransform="uppercase">
        {t('parties.party_detail.lots_heading', { count: lots.length })}
      </Text>
      <Box gap="$3">
        {lots.map((lot) => {
          const isCompleted = lot.storageStatus === 'completed';
          const line3 = isCompleted
            ? t('parties.party_detail.lot_completed', {
                remaining: lot.balance_bags.toLocaleString('en-IN'),
                check: statusGlyph('completed'),
              })
            : t('parties.party_detail.lot_remaining_age', {
                remaining: lot.balance_bags.toLocaleString('en-IN'),
                days: lot.ageDays.toLocaleString('en-IN'),
                status: statusGlyph(lot.storageStatus),
              });

          return (
            <Pressable
              key={lot.lotId}
              onPress={() => onOpenLot(lot.lotId)}
              accessibilityRole="button"
              minHeight={48}
              borderRadius={12}
              borderWidth={1}
              borderColor="#E5E7EB"
              bg="$white"
              p="$3"
            >
              <Text fontSize={16} fontWeight="$semibold" color="$textLight900">
                {t('lot_detail.lot_header_label', { number: lot.lot_number })} • {lot.product_name}
              </Text>
              <Text mt="$1" fontSize={14} color="$textLight600">
                {t('parties.party_detail.lot_lodged_delivered', {
                  lodged: lot.original_bags.toLocaleString('en-IN'),
                  delivered: lot.delivered_bags.toLocaleString('en-IN'),
                })}
              </Text>
              <Text
                mt="$1"
                fontSize={14}
                color={isCompleted ? '#16A34A' : '$textLight600'}
                fontWeight={isCompleted ? '$medium' : '$normal'}
              >
                {line3}
              </Text>
            </Pressable>
          );
        })}
      </Box>
    </Box>
  );
}
