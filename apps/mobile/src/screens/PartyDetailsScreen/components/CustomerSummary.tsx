import type { PartyDetailData } from '@growcold/shared';
import { formatINR } from '@growcold/shared';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

function parseYmdToDate(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return parseISO(ymd);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

interface Props {
  data: PartyDetailData;
  onPhonePress: () => void;
  updatedAgo?: string | null;
  isOffline?: boolean;
}

export function CustomerSummary({ data, onPhonePress, updatedAgo, isOffline }: Props) {
  const { t } = useTranslation('pages');
  const noPhone = t('parties.no_phone');
  const phoneDisplay = (data.phone ?? '').trim() || (data.mobile ?? '').trim() || noPhone;
  const hasPhone = phoneDisplay !== noPhone;

  const outstandingColor = data.outstanding > 0 ? '#A83422' : '#0B7B6E';

  const lastActivityText = data.lastActivityDate
    ? formatDistanceToNow(parseYmdToDate(data.lastActivityDate), { addSuffix: true })
    : t('parties.party_detail.last_activity_never');

  return (
    <Box borderRadius={12} bg="#FFFFFF" p="$4">
      <Text fontSize={12} fontWeight="$medium" color="$textTertiary" textTransform="uppercase">
        {t('parties.party_detail.summary_title')}
      </Text>
      <Box mt="$3" gap="$2">
        <Box flexDirection="row" flexWrap="wrap">
          <Text w={112} fontSize={14} color="$textTertiary">
            {t('parties.party_detail.code')}
          </Text>
          <Text flex={1} fontSize={16} fontWeight="$semibold" color="$textPrimary">
            {data.customerCode}
          </Text>
        </Box>
        <Box flexDirection="row" flexWrap="wrap" alignItems="center">
          <Text w={112} fontSize={14} color="$textTertiary">
            {t('parties.party_detail.phone')}
          </Text>
          {hasPhone ? (
            <Pressable
              onPress={onPhonePress}
              accessibilityRole="button"
              accessibilityLabel={t('parties.party_detail.phone_aria', { code: data.customerCode })}
              py="$1"
              minHeight={48}
              justifyContent="center"
            >
              <Text fontSize={16} fontWeight="$semibold" color="#A83422">
                {phoneDisplay}
              </Text>
            </Pressable>
          ) : (
            <Text fontSize={16} fontWeight="$semibold" color="#7A6F61">
              {phoneDisplay}
            </Text>
          )}
        </Box>
        {data.address?.trim() ? (
          <Box flexDirection="row" flexWrap="wrap">
            <Text w={112} fontSize={14} color="$textTertiary">
              {t('parties.party_detail.address')}
            </Text>
            <Text flex={1} fontSize={16} fontWeight="$semibold" color="$textPrimary">
              {data.address}
            </Text>
          </Box>
        ) : null}
        <Box flexDirection="row" flexWrap="wrap">
          <Text w={112} fontSize={14} color="$textTertiary">
            {t('parties.party_detail.current_stock_label')}
          </Text>
          <Text flex={1} fontSize={16} fontWeight="$semibold" color="$textPrimary">
            {t('parties.party_detail.current_stock_value', {
              bags: data.currentStockBags.toLocaleString('en-IN'),
              lots: data.activeLotCount.toLocaleString('en-IN'),
            })}
          </Text>
        </Box>
        <Box flexDirection="row" flexWrap="wrap">
          <Text w={112} fontSize={14} color="$textTertiary">
            {t('parties.party_detail.outstanding')}
          </Text>
          <Text flex={1} fontSize={16} fontWeight="$semibold" color={outstandingColor}>
            {formatINR(data.outstanding)}
          </Text>
        </Box>
      </Box>
      <Box mt="$3" pt="$3" borderTopWidth={1} borderTopColor="#E5DED2" gap="$1">
        <Box flexDirection="row" gap="$2">
          <Text color="#7A6F61">
            ├─
          </Text>
          <Text flex={1} fontSize={14} color="$textSecondary">
            <Text color="$textTertiary">{t('parties.party_detail.breakdown_rents')}: </Text>
            <Text fontWeight="$medium" color="$textPrimary">
              {formatINR(data.rents)}
            </Text>
          </Text>
        </Box>
        <Box flexDirection="row" gap="$2">
          <Text color="#7A6F61">
            ├─
          </Text>
          <Text flex={1} fontSize={14} color="$textSecondary">
            <Text color="$textTertiary">{t('parties.party_detail.breakdown_charges')}: </Text>
            <Text fontWeight="$medium" color="$textPrimary">
              {formatINR(data.charges)}
            </Text>
          </Text>
        </Box>
        <Box flexDirection="row" gap="$2">
          <Text color="#7A6F61">
            └─
          </Text>
          <Text flex={1} fontSize={14} color="$textSecondary">
            <Text color="$textTertiary">{t('parties.party_detail.breakdown_others')}: </Text>
            <Text fontWeight="$medium" color="$textPrimary">
              {formatINR(data.others)}
            </Text>
          </Text>
        </Box>
      </Box>
      <Box mt="$3" pt="$3" borderTopWidth={1} borderTopColor="#E5DED2" flexDirection="row" flexWrap="wrap">
        <Text w={112} fontSize={14} color="$textTertiary">
          {t('parties.party_detail.last_activity')}
        </Text>
        <Text flex={1} fontSize={16} fontWeight="$semibold" color="$textPrimary">
          {lastActivityText}
        </Text>
      </Box>
      {isOffline || updatedAgo ? (
        <Text mt="$2" fontSize={12} color="$textTertiary" textAlign="center">
          {isOffline ? t('parties.offline') : ''}
          {isOffline && updatedAgo ? ' · ' : ''}
          {updatedAgo ? t('parties.party_detail.updated_ago', { time: updatedAgo }) : ''}
        </Text>
      ) : null}
    </Box>
  );
}
