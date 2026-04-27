import { formatIndianNumber, type StockTabMovementRowDto } from '@growcold/shared';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../../navigation/types';

const LODGE = '#00B14F';
const DELIVER = '#0891B2';

interface Props {
  row: StockTabMovementRowDto;
}

export function TransactionCard({ row }: Props) {
  const { t } = useTranslation('pages');
  const navigation = useNavigation();
  const isLodgement = row.kind === 'lodgement';
  const border = isLodgement ? LODGE : DELIVER;
  const arrow = isLodgement ? '↓' : '↑';
  const actionLabel = isLodgement ? t('stock.lodged_label') : t('stock.delivered_label');

  const openLot = () => {
    const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    root?.navigate('LotDetail', { lotId: row.lotId });
  };

  return (
    <Pressable onPress={openLot} accessibilityRole="button">
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
        <Text fontSize={20}>{row.productGroupEmoji}</Text>
        <Box flex={1}>
          <Text fontSize={16} fontWeight="$semibold" color="$textLight900">
            {arrow} {row.customerCode} • Lot {row.lotNumber}
          </Text>
          <Text fontSize={14} color="$textLight500" numberOfLines={1}>
            {row.productName}
          </Text>
          <Text fontSize={14} color="$textLight900">
            {formatIndianNumber(row.numBags)} bags {actionLabel}
          </Text>
        </Box>
      </Box>
    </Pressable>
  );
}
