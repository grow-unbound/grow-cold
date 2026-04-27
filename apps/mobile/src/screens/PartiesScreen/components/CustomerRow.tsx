import { Box, Pressable, Text } from '@gluestack-ui/themed';
import type { PartiesListRowDto } from '@growcold/shared';
import { formatIndianNumber } from '@growcold/shared';
import { useTranslation } from 'react-i18next';

function outstandingTier(out: number): 'high' | 'medium' | 'low' {
  if (out >= 50_000) return 'high';
  if (out >= 10_000) return 'medium';
  return 'low';
}

const DOT: Record<'high' | 'medium' | 'low', string> = {
  high: '#DC2626',
  medium: '#F59E0B',
  low: '#16A34A',
};

function fmt(n: number): string {
  return `₹${formatIndianNumber(n)}`;
}

interface Props {
  row: PartiesListRowDto;
  onOpenContact: (row: PartiesListRowDto) => void;
  onOpenDetail: (row: PartiesListRowDto) => void;
}

export function CustomerRow({ row, onOpenContact, onOpenDetail }: Props) {
  const { t } = useTranslation('pages');
  const tr = outstandingTier(row.outstanding);
  const ph = (row.phone ?? '').trim() || (row.mobile ?? '').trim();
  const statusKey =
    tr === 'high' ? 'status_outstanding_high' : tr === 'medium' ? 'status_outstanding_medium' : 'status_outstanding_low';

  return (
    <Box
      bg="$white"
      borderRadius={12}
      p="$3"
      borderWidth={1}
      borderColor="#E5E7EB"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Pressable
        onPress={() => onOpenDetail(row)}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box flexDirection="row" flex={1} minWidth={0} gap="$2" alignItems="flex-start">
          <Box
            w={10}
            h={10}
            borderRadius={9999}
            mt={6}
            style={{ backgroundColor: DOT[tr] }}
            accessibilityLabel={t(`parties.${statusKey}`)}
          />
          <Box flex={1} minWidth={0}>
            <Text fontSize={16} fontWeight="$semibold" color="#1F2937" numberOfLines={1}>
              {row.customerCode}
            </Text>
            <Text size="sm" color="#6B7280" mt="$1">
              {t('parties.lots_bags_line', { lots: row.lotCount, bags: row.bagCount })}
            </Text>
          </Box>
        </Box>
        <Text fontSize={16} fontWeight="$semibold" color="#1F2937" ml="$2">
          {fmt(row.outstanding)}
        </Text>
      </Pressable>
      {ph ? (
        <Pressable
          onPress={() => onOpenContact(row)}
          p="$2"
          minH={48}
          justifyContent="center"
          mt="$1"
          accessibilityLabel={t('parties.contact_aria', { code: row.customerCode })}
        >
          <Text size="sm" color="#0891B2">
            📞 {ph}
          </Text>
        </Pressable>
      ) : (
        <Text size="sm" color="#9CA3AF" mt="$2" px="$2" py="$1">
          {t('parties.no_phone')}
        </Text>
      )}
    </Box>
  );
}
