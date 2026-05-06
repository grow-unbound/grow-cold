import { formatIndianNumber, type StockTabSummary } from '@growcold/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors as c } from '@growcold/tokens';

interface Props {
  data: StockTabSummary | undefined;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
}

interface KpiColProps {
  value: string;
  label: string;
  hint?: string;
}

function KpiCol({ value, label, hint }: KpiColProps) {
  return (
    <View style={styles.col}>
      <Text style={styles.colNum}>{value}</Text>
      <Text style={styles.colLabel}>{label}</Text>
      {hint ? <Text style={styles.colHint}>{hint}</Text> : null}
    </View>
  );
}

export function StockStatusCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} accessibilityRole="button" style={styles.header}>
        <Text style={styles.sectionLabel}>{t('stock.stock_status')}</Text>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>

      {isLoading ? <Text style={styles.loading}>{t('loading')}</Text> : null}

      {!isLoading && data ? (
        <View style={styles.body}>
          <Text style={styles.mainNum}>{formatIndianNumber(data.totalBags)}</Text>
          <Text style={styles.mainSub}>
            {t('stock.bags_lots_line', { bags: '', lots: data.totalLots }).replace(/^\s*•?\s*/, '')}
          </Text>

          {expanded ? (
            <>
              <View style={styles.divider} />
              <View style={styles.cols}>
                <KpiCol value={formatIndianNumber(data.freshBags)} label={t('stock.fresh')} hint={t('stock.fresh_hint')} />
                <KpiCol value={formatIndianNumber(data.agingBags)} label={t('stock.aging')} hint={t('stock.aging_hint')} />
                <KpiCol value={formatIndianNumber(data.staleBags)} label={t('stock.stale')} hint={t('stock.stale_hint')} />
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
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: c.textSecondary,
  },
  colHint: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 11,
    color: c.textTertiary,
  },
  updatedAt: {
    marginTop: 8,
    fontFamily: 'NotoSans_400Regular',
    fontSize: 11,
    color: c.textTertiary,
  },
});
