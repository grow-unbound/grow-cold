import { formatINR, type MoneyTabMovementRowDto } from '@growcold/shared';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';

const RECEIPT = '#16A34A';
const PAYMENT = '#7C3AED';

function methodLabel(t: (k: string) => string, m: string | null): string {
  if (!m) return t('money.method_none');
  const u = m.toUpperCase();
  if (u === 'CASH') return t('money.method_cash');
  if (u === 'UPI') return t('money.method_upi');
  if (u === 'BANK_TRANSFER') return t('money.method_bank');
  return m;
}

interface Props {
  row: MoneyTabMovementRowDto;
}

export function TransactionCard({ row }: Props) {
  const { t } = useTranslation('pages');
  const navigation = useNavigation();
  const isReceipt = row.kind === 'receipt';
  const border = isReceipt ? RECEIPT : PAYMENT;
  const arrow = isReceipt ? '↓' : '↑';
  const emoji = isReceipt ? '💚' : '💜';
  const methodT = methodLabel(t, row.paymentMethod);

  const open = () => {
    const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    root?.navigate('TransactionDetail', { id: row.id, kind: row.kind });
  };

  return (
    <Pressable onPress={open} accessibilityRole="button">
      <Box
        flexDirection="row"
        gap="$3"
        p="$3"
        mb="$2"
        borderRadius={12}
        bg="$backgroundLight0"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <Text fontSize={20}>{emoji}</Text>
        <Box flex={1}>
          <Text fontSize={16} fontWeight="$semibold" color="$textLight900">
            {arrow} {row.counterparty}
          </Text>
          <Text fontSize={14} color="$textLight500" numberOfLines={2}>
            {row.detailLine}
          </Text>
          <Text fontSize={14} color="$textLight900">
            {formatINR(row.amount)} · {methodT}
          </Text>
        </Box>
      </Box>
    </Pressable>
  );
}
