import { formatIndianNumber, type StockTabMovementRowDto } from '@growcold/shared';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors as c } from '@growcold/tokens';
import type { RootStackParamList } from '../../../navigation/types';

interface Props {
  row: StockTabMovementRowDto;
}

export function TransactionCard({ row }: Props) {
  const { t } = useTranslation('pages');
  const navigation = useNavigation();
  const isLodgement = row.kind === 'lodgement';
  const borderColor = isLodgement ? c.inward : c.outward;
  const badgeBg = isLodgement ? c.inwardBg : c.outwardBg;
  const badgeText = isLodgement ? c.inward : c.outward;
  const actionLabel = isLodgement ? t('stock.lodged_label') : t('stock.delivered_label');

  const openLot = () => {
    const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    root?.navigate('LotDetail', { lotId: row.lotId });
  };

  return (
    <Pressable onPress={openLot} accessibilityRole="button" style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.row}>
        {/* Left: emoji + content */}
        <Text style={styles.emoji}>{row.productGroupEmoji}</Text>
        <View style={styles.content}>
          <Text style={styles.lotNum}>Lot {row.lotNumber}</Text>
          <Text style={styles.partyName} numberOfLines={1}>{row.customerCode}</Text>
          <Text style={styles.meta} numberOfLines={1}>{row.productName}</Text>
        </View>

        {/* Right: amount + badge */}
        <View style={styles.right}>
          <Text style={styles.amount}>{formatIndianNumber(row.numBags)}</Text>
          <Text style={styles.amountSub}>bags</Text>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeText }]}>{actionLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: c.bgSurface,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  emoji: {
    fontSize: 20,
    marginTop: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  lotNum: {
    fontFamily: 'NotoSansMono_400Regular',
    fontSize: 12,
    color: c.textTertiary,
    marginBottom: 2,
  },
  partyName: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 17,
    color: c.textPrimary,
    lineHeight: 22,
  },
  meta: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  amount: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    color: c.textPrimary,
  },
  amountSub: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 11,
    color: c.textTertiary,
    marginTop: -2,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  badgeText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
  },
});
