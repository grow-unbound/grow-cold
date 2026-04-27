import type { PartyDetailReceiptRow } from '@growcold/shared';
import { formatINR, formatYmdLong } from '@growcold/shared';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import { paymentMethodLabel } from '../payment-method-label';

interface Props {
  receipts: PartyDetailReceiptRow[];
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  onOpenReceipt: (id: string) => void;
}

export function ReceiptsList({
  receipts,
  hasMore,
  isFetchingMore,
  onLoadMore,
  onOpenReceipt,
}: Props) {
  const { t, i18n } = useTranslation('pages');

  if (receipts.length === 0) {
    return (
      <Box borderRadius={12} borderWidth={1} borderColor="#E5E7EB" bg="$white" px="$4" py="$8" alignItems="center">
        <Text fontSize={16} fontWeight="$semibold" color="$textLight900" textAlign="center">
          {t('parties.party_detail.empty_receipts_title')}
        </Text>
        <Text mt="$2" fontSize={14} color="$textLight600" textAlign="center">
          {t('parties.party_detail.empty_receipts_body')}
        </Text>
      </Box>
    );
  }

  return (
    <Box gap="$3">
      {receipts.map((r) => {
        const lotLine =
          r.lotNumbers.length > 0
            ? `${r.purpose} • ${t('parties.party_detail.receipt_lots', { numbers: r.lotNumbers.join(', ') })}`
            : r.purpose;
        return (
          <Pressable
            key={r.id}
            onPress={() => onOpenReceipt(r.id)}
            accessibilityRole="button"
            minHeight={48}
            borderRadius={12}
            borderWidth={1}
            borderColor="#E5E7EB"
            bg="$white"
            p="$3"
          >
            <Text fontSize={16} fontWeight="$semibold" color="$textLight900">
              {formatYmdLong(r.receipt_date, i18n.language)} • {formatINR(r.amount)}
            </Text>
            <Text mt="$1" fontSize={14} color="$textLight600">
              {lotLine}
            </Text>
            <Text mt="$1" fontSize={14} color="$textLight600">
              {paymentMethodLabel(r.payment_method, t)}
            </Text>
          </Pressable>
        );
      })}
      {hasMore ? (
        <Pressable
          onPress={() => onLoadMore()}
          disabled={isFetchingMore}
          minHeight={48}
          borderRadius={12}
          borderWidth={1}
          borderColor="#D1D5DB"
          bg="$white"
          p="$3"
          alignItems="center"
          opacity={isFetchingMore ? 0.6 : 1}
        >
          <Text fontSize={16} fontWeight="$medium" color="#0891B2">
            {isFetchingMore ? t('parties.load_more') : t('parties.party_detail.load_more')}
          </Text>
        </Pressable>
      ) : null}
    </Box>
  );
}
