import type { TransactionDetailData } from '@growcold/shared';
import { formatINR } from '@growcold/shared';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const GREEN = '#16A34A';
const PURPLE = '#7C3AED';
const EM = '\u2014';

function methodDisplayKey(method: string | null, t: (k: string) => string): string {
  if (!method) return t('money.method_none');
  const m = method.toUpperCase();
  if (m === 'CASH') return t('money.method_cash');
  if (m === 'UPI') return t('money.method_upi');
  if (m === 'BANK_TRANSFER') return t('money.method_bank');
  return method.replace(/_/g, ' ');
}

type Row = { label: string; value: string; valueColor?: string; multiline?: boolean };

export function TransactionSummary({ data }: { data: TransactionDetailData }) {
  const { t } = useTranslation('pages');
  const isReceipt = data.kind === 'receipt';
  const badgeColor = isReceipt ? GREEN : PURPLE;
  const badgeText = isReceipt ? t('transaction_detail.badge_receipt') : t('transaction_detail.badge_payment');

  const counterpartyLabel = isReceipt ? t('transaction_detail.customer') : t('transaction_detail.recipient');
  const counterpartyValue = data.customerCode
    ? `${data.customerCode} \u00B7 ${data.customerOrRecipient}`
    : data.customerOrRecipient;

  const typeValue = isReceipt ? t('transaction_detail.type_receipt') : t('transaction_detail.type_payment');
  const method = methodDisplayKey(data.paymentMethod, t);

  const rows: Row[] = [
    { label: t('transaction_detail.type'), value: typeValue },
    { label: counterpartyLabel, value: counterpartyValue, multiline: true },
    {
      label: t('transaction_detail.amount'),
      value: formatINR(data.amount),
      valueColor: isReceipt ? GREEN : undefined,
    },
    { label: t('transaction_detail.method'), value: method },
    { label: t('transaction_detail.date'), value: data.displayDateTime, multiline: true },
    {
      label: t('transaction_detail.recorded_by'),
      value:
        data.recordedByName === null
          ? t('transaction_detail.system_recorded')
          : data.recordedByName,
    },
    { label: t('transaction_detail.purpose'), value: data.purposeText, multiline: true },
    { label: t('transaction_detail.notes'), value: data.notesText, multiline: true },
  ];

  return (
    <View style={{ position: 'relative' }}>
      <Box bg="#F9FAFB" borderRadius={12} p="$4" style={{ position: 'relative' }}>
        <HStack position="absolute" right={0} top={0} zIndex={1}>
          <Box bg={badgeColor} px="$2" py="$1" borderRadius={4}>
            <Text color="$white" fontSize={12} fontWeight="$bold" textTransform="uppercase">
              {badgeText}
            </Text>
          </Box>
        </HStack>
        <VStack space="sm" style={{ paddingRight: 56 }}>
          <Text
            fontSize={14}
            fontWeight="$semibold"
            color="#6B7280"
            letterSpacing={0.5}
            textTransform="uppercase"
          >
            {t('transaction_detail.summary_title')}
          </Text>
          <VStack space="sm">
            {rows.map((row) => (
              <VStack key={row.label} space="xs">
                <Text fontSize={14} color="#6B7280">
                  {row.label}:
                </Text>
                <Text
                  fontSize={16}
                  fontWeight="$semibold"
                  color={row.valueColor ?? '$textLight900'}
                  lineHeight={row.multiline ? 24 : undefined}
                >
                  {row.value || EM}
                </Text>
              </VStack>
            ))}
          </VStack>
        </VStack>
      </Box>
    </View>
  );
}
