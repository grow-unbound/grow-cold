import { formatINR, type MoneyTabSummary } from '@growcold/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors as c } from '@growcold/tokens';

interface Props {
  data: MoneyTabSummary | undefined;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
}

interface KpiColProps {
  value: string;
  label: string;
}

function KpiCol({ value, label }: KpiColProps) {
  return (
    <View style={styles.col}>
      <Text style={styles.colNum}>{value}</Text>
      <Text style={styles.colLabel}>{label}</Text>
    </View>
  );
}

export function CashStatusCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} accessibilityRole="button" style={styles.header}>
        <Text style={styles.sectionLabel}>{t('money.cash_status')}</Text>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>

      {isLoading ? <Text style={styles.loading}>{t('loading')}</Text> : null}

      {!isLoading && data ? (
        <View style={styles.body}>
          <Text style={styles.mainNum}>{formatINR(data.cashBalance)}</Text>
          <Text style={styles.mainSub}>{t('money.balance_label')}</Text>

          {expanded ? (
            <>
              <View style={styles.divider} />
              <View style={styles.cols}>
                <KpiCol value={formatINR(data.receivedToday)} label={t('money.received_sub')} />
                <KpiCol value={formatINR(data.paidToday)} label={t('money.paid_sub')} />
                <KpiCol value={formatINR(data.payablePending)} label={t('money.payable_sub')} />
              </View>
              <Text style={styles.updatedAt}>
                {t('stock.updated_ago', { time: new Date(data.updatedAt).toLocaleTimeString() })}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: c.bgSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: 'NotoSansMono_400Regular',
    fontSize: 11,
    fontWeight: '500',
    color: c.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  chevron: {
    fontSize: 12,
    color: c.textTertiary,
  },
  loading: {
    marginTop: 8,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: c.textTertiary,
  },
  body: {
    marginTop: 10,
    alignItems: 'center',
  },
  mainNum: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 38,
    fontVariant: ['tabular-nums'],
    color: c.textPrimary,
    lineHeight: 44,
  },
  mainSub: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: c.borderDefault,
    alignSelf: 'stretch',
    marginVertical: 12,
  },
  cols: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  colNum: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    color: c.textPrimary,
  },
  colLabel: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: c.textSecondary,
  },
  updatedAt: {
    marginTop: 8,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 11,
    color: c.textTertiary,
  },
});
