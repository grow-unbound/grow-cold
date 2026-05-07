import { formatINR, type MoneyTabMovementRowDto } from '@growcold/shared';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors as c } from '@growcold/tokens';
import type { RootStackParamList } from '../../../navigation/types';

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
  const borderColor = isReceipt ? c.inward : c.pending;
  const badgeBg = isReceipt ? c.inwardBg : c.pendingBg;
  const badgeText = isReceipt ? c.inward : c.pending;
  const kindLabel = isReceipt ? t('money.mode_receipt') : t('money.mode_payment');
  const methodT = methodLabel(t, row.paymentMethod);

  const open = () => {
    const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    root?.navigate('TransactionDetail', { id: row.id, kind: row.kind });
  };

  return (
    <Pressable onPress={open} accessibilityRole="button" style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.row}>
        {/* Left: content */}
        <View style={styles.content}>
          <Text style={styles.partyName} numberOfLines={1}>{row.counterparty}</Text>
          <Text style={styles.meta} numberOfLines={1}>{row.detailLine}</Text>
          <Text style={styles.method}>{methodT}</Text>
        </View>

        {/* Right: amount + badge */}
        <View style={styles.right}>
          <Text style={styles.amount}>{formatINR(row.amount)}</Text>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeText }]}>{kindLabel}</Text>
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
  content: {
    flex: 1,
    minWidth: 0,
  },
  partyName: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 17,
    color: c.textPrimary,
    lineHeight: 22,
    marginBottom: 3,
  },
  meta: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: c.textSecondary,
  },
  method: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: c.textTertiary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  amount: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    color: c.textPrimary,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
  },
});
