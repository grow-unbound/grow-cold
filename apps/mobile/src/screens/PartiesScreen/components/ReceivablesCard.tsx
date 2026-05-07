import { formatINR, formatIndianNumber } from '@growcold/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors as c } from '@growcold/tokens';

type Summary = {
  totalReceivable: number;
  customersWithDues: number;
  rentReceivable: number;
  rentLotCount: number;
  chargesReceivable: number;
  chargesLotCount: number;
  othersReceivable: number;
  othersCustomerCount: number;
  updatedAt: string;
} | null;

interface Props {
  data: Summary;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function lineAmount(n: number): string {
  if (n >= 100000) return `₹${formatIndianNumber(n)}`;
  return formatINR(n);
}

interface KpiColProps {
  value: string;
  label: string;
  hint: string;
}

function KpiCol({ value, label, hint }: KpiColProps) {
  return (
    <View style={styles.col}>
      <Text style={styles.colNum}>{value}</Text>
      <Text style={styles.colLabel}>{label}</Text>
      <Text style={styles.colHint}>{hint}</Text>
    </View>
  );
}

export function ReceivablesCard({ data, isLoading, expanded, onToggle }: Props) {
  const { t } = useTranslation('pages');

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} accessibilityRole="button" style={styles.header}>
        <Text style={styles.sectionLabel}>{t('parties.receivables')}</Text>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>

      {isLoading ? <Text style={styles.loading}>{t('loading')}</Text> : null}

      {!isLoading && data ? (
        <View style={styles.body}>
          <Text style={styles.mainNum}>{lineAmount(data.totalReceivable)}</Text>
          <Text style={styles.mainSub}>
            {t('parties.main_line', { amount: '', count: data.customersWithDues }).replace(/^\s*•?\s*/, '')}
          </Text>

          {expanded ? (
            <>
              <View style={styles.divider} />
              <View style={styles.cols}>
                <KpiCol
                  value={lineAmount(data.rentReceivable)}
                  label={t('parties.rents')}
                  hint={t('parties.rent_lots', { count: data.rentLotCount })}
                />
                <KpiCol
                  value={lineAmount(data.chargesReceivable)}
                  label={t('parties.charges')}
                  hint={t('parties.charge_lots', { count: data.chargesLotCount })}
                />
                <KpiCol
                  value={lineAmount(data.othersReceivable)}
                  label={t('parties.others')}
                  hint={t('parties.others_customers', { count: data.othersCustomerCount })}
                />
              </View>
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
    borderWidth: 1,
    borderColor: c.borderDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 20,
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
});
