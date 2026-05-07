import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PartiesListRowDto } from '@growcold/shared';
import { formatIndianNumber } from '@growcold/shared';
import { useTranslation } from 'react-i18next';
import { colors as c } from '@growcold/tokens';

function outstandingTier(out: number): 'high' | 'medium' | 'low' {
  if (out >= 50_000) return 'high';
  if (out >= 10_000) return 'medium';
  return 'low';
}

const DOT: Record<'high' | 'medium' | 'low', string> = {
  high: c.outward,
  medium: c.pending,
  low: c.inward,
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
  const tier = outstandingTier(row.outstanding);
  const phone = (row.phone ?? '').trim() || (row.mobile ?? '').trim();
  const statusKey =
    tier === 'high' ? 'status_outstanding_high'
    : tier === 'medium' ? 'status_outstanding_medium'
    : 'status_outstanding_low';

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onOpenDetail(row)}
        accessibilityRole="button"
        style={styles.topRow}
      >
        {/* Tier dot */}
        <View
          style={[styles.dot, { backgroundColor: DOT[tier] }]}
          accessibilityLabel={t(`parties.${statusKey}`)}
        />

        {/* Name + meta */}
        <View style={styles.content}>
          <Text style={styles.partyName} numberOfLines={1}>{row.customerCode}</Text>
          <Text style={styles.meta}>
            {t('parties.lots_bags_line', { lots: row.lotCount, bags: row.bagCount })}
          </Text>
        </View>

        {/* Outstanding amount */}
        <Text style={styles.amount}>{fmt(row.outstanding)}</Text>
      </Pressable>

      {/* Phone row */}
      {phone ? (
        <TouchableOpacity
          onPress={() => onOpenContact(row)}
          accessibilityLabel={t('parties.contact_aria', { code: row.customerCode })}
          style={styles.phoneRow}
        >
          <Text style={styles.phoneText}>📞 {phone}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noPhone}>{t('parties.no_phone')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: c.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borderDefault,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    marginTop: 7,
    flexShrink: 0,
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
  },
  meta: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    color: c.textPrimary,
    flexShrink: 0,
  },
  phoneRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: c.borderDefault,
    marginTop: 0,
  },
  phoneText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: c.brandText,
  },
  noPhone: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: c.textTertiary,
  },
});
