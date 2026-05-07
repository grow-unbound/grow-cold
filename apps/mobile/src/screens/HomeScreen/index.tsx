import { Box, HStack, Pressable, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as tc } from '@growcold/tokens';
import { ProfileMenu } from '../../components/ProfileMenu';
import type { RootStackParamList } from '../../navigation/types';
import {
  useHomeDashboardQuery,
  useHomeTrendQuery,
  type MoneyEvent,
  type Period,
  type SnapshotData,
  type StockEvent,
  type TrendDay,
} from '../../features/home/useHomeDashboardQueries';

// ── KPI Grid ──────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function KpiGrid({ snapshot }: { snapshot: SnapshotData }) {
  return (
    <View style={styles.kpiGrid}>
      <KpiCard
        label="Total Bags"
        value={snapshot.total_bags.toLocaleString('en-IN')}
        sub={`${snapshot.active_lots} active lots`}
      />
      <KpiCard
        label="Cash Balance"
        value={formatINR(snapshot.cash_balance)}
        sub={`${formatINR(snapshot.total_receivable)} receivable`}
      />
      <KpiCard
        label="Today Inward"
        value={snapshot.today_lodged_bags.toLocaleString('en-IN')}
        sub="bags lodged today"
        valueColor={tc.inward}
      />
      <KpiCard
        label="Stale Lots"
        value={snapshot.stale_lots.toLocaleString('en-IN')}
        sub={`${snapshot.total_lots} total lots`}
        valueColor={snapshot.stale_lots > 0 ? tc.pending : undefined}
      />
    </View>
  );
}

function KpiGridSkeleton() {
  return (
    <View style={styles.kpiGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.kpiCard, styles.skeleton]} />
      ))}
    </View>
  );
}

// ── Period Chips ──────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

function PeriodChips({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <HStack space="sm" flexWrap="wrap">
      {PERIOD_OPTIONS.map(({ key, label }) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          style={[styles.chip, value === key && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === key && styles.chipTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </HStack>
  );
}

// ── Stock Movements Widget ─────────────────────────────────────────────────────

function StockMovementsWidget({ events }: { events: StockEvent[] }) {
  if (events.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>No stock movements yet. Tap + to record your first inward.</Text>
      </View>
    );
  }
  return (
    <VStack space="sm">
      <Text style={styles.sectionTitle}>Stock Movements</Text>
      {events.map((e) => {
        const isInward = e.event_type === 'lodgement';
        return (
          <View key={e.id} style={styles.card}>
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack flex={1} space="xs">
                <Text style={styles.cardLabel}>{e.lot_number} · {e.event_date}</Text>
                <Text style={styles.cardName}>{e.customer_name}</Text>
                <Text style={styles.cardMeta}>{e.product_name}</Text>
                <View style={[styles.badge, isInward ? styles.badgeInward : styles.badgeOutward]}>
                  <Text style={[styles.badgeText, { color: isInward ? tc.inward : tc.outward }]}>
                    {isInward ? '✓ Inward' : '↓ Outward'}
                  </Text>
                </View>
              </VStack>
              <VStack alignItems="flex-end">
                <Text style={styles.cardAmount}>{e.num_bags}</Text>
                <Text style={styles.cardAmountSub}>bags</Text>
              </VStack>
            </HStack>
          </View>
        );
      })}
    </VStack>
  );
}

// ── Payments & Receipts Widget ────────────────────────────────────────────────

function PaymentsReceiptsWidget({ events }: { events: MoneyEvent[] }) {
  if (events.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>No payments or receipts yet.</Text>
      </View>
    );
  }
  return (
    <VStack space="sm">
      <Text style={styles.sectionTitle}>Payments & Receipts</Text>
      {events.map((e) => {
        const isReceipt = e.event_type === 'receipt';
        return (
          <View key={e.id} style={styles.card}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack flex={1} space="xs">
                <HStack space="sm" alignItems="center">
                  <View style={[styles.badge, isReceipt ? styles.badgeInward : styles.badgeOutward]}>
                    <Text style={[styles.badgeText, { color: isReceipt ? tc.inward : tc.outward }]}>
                      {isReceipt ? '↑ Receipt' : '↓ Payment'}
                    </Text>
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>{e.customer_name}</Text>
                </HStack>
                <Text style={styles.cardMeta}>
                  {e.event_date}{e.payment_method ? ` · ${e.payment_method}` : ''}
                </Text>
              </VStack>
              <Text style={[styles.cardAmount, { color: isReceipt ? tc.inward : tc.outward }]}>
                {formatINR(e.amount)}
              </Text>
            </HStack>
          </View>
        );
      })}
    </VStack>
  );
}

// ── Trend Widget ──────────────────────────────────────────────────────────────

function TrendWidget({ series }: { series: TrendDay[] }) {
  if (series.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>No data for this period.</Text>
      </View>
    );
  }
  const maxBags = Math.max(...series.map((d) => Math.max(d.lodged_bags, d.delivered_bags)), 1);
  return (
    <View style={styles.card}>
      <Text style={styles.kpiLabel}>Stock Trend — bags</Text>
      <HStack space="xs" alignItems="flex-end" style={{ height: 80, marginTop: 12 }}>
        {series.map((d) => (
          <VStack key={d.summary_date} flex={1} space="xs" alignItems="center">
            <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end', gap: 2 }}>
              <View
                style={{
                  height: Math.max(2, (d.lodged_bags / maxBags) * 60),
                  backgroundColor: tc.inward,
                  borderRadius: 2,
                }}
              />
              <View
                style={{
                  height: Math.max(2, (d.delivered_bags / maxBags) * 60),
                  backgroundColor: tc.outward,
                  borderRadius: 2,
                }}
              />
            </View>
            <Text style={styles.trendLabel}>{d.summary_date.slice(5)}</Text>
          </VStack>
        ))}
      </HStack>
      <HStack space="md" mt="$2">
        <HStack space="xs" alignItems="center">
          <View style={{ width: 8, height: 8, backgroundColor: tc.inward, borderRadius: 2 }} />
          <Text style={styles.trendLabel}>Inward</Text>
        </HStack>
        <HStack space="xs" alignItems="center">
          <View style={{ width: 8, height: 8, backgroundColor: tc.outward, borderRadius: 2 }} />
          <Text style={styles.trendLabel}>Outward</Text>
        </HStack>
      </HStack>
    </View>
  );
}

// ── HomeScreen ────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { t: tNav } = useTranslation('nav');
  const { t } = useTranslation('pages');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [period, setPeriod] = useState<Period>('week');
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => sub();
  }, []);

  const dashboardQ = useHomeDashboardQuery();
  const trendQ = useHomeTrendQuery(period);

  const openSearch = () => {
    const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    root?.navigate('Search');
  };

  return (
    <Box flex={1} bg="$bgSurface">
      {offline ? (
        <Box bg="$bgInset" px="$4" py="$2">
          <Text size="sm" color="$textTertiary">{t('home.offline_banner')}</Text>
        </Box>
      ) : null}

      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 40 }}>
        <VStack px="$4" space="md" style={{ paddingTop: Math.max(insets.top, 16) }}>
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center" pb="$2">
            <Text
              fontFamily="NotoSerif_600SemiBold"
              fontSize={24}
              color="$textPrimary"
            >
              {tNav('home')}
            </Text>
            <HStack space="sm" alignItems="center">
              <Pressable
                onPress={openSearch}
                accessibilityRole="button"
                style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
              >
                <Search size={22} color={tc.textSecondary} strokeWidth={1.75} />
              </Pressable>
              <ProfileMenu />
            </HStack>
          </HStack>

          {/* KPI Grid */}
          {dashboardQ.isPending ? (
            <KpiGridSkeleton />
          ) : dashboardQ.data ? (
            <KpiGrid snapshot={dashboardQ.data.snapshot} />
          ) : null}

          {dashboardQ.isError ? (
            <Text color="$outward" size="sm">{t('error_load')}</Text>
          ) : null}

          {/* Period filter */}
          <VStack space="xs">
            <Text style={styles.kpiLabel}>Time Period</Text>
            <PeriodChips value={period} onChange={setPeriod} />
          </VStack>

          {/* Trend chart */}
          {trendQ.isPending ? (
            <View style={[styles.card, styles.skeleton, { height: 100 }]} />
          ) : trendQ.data ? (
            <TrendWidget series={trendQ.data} />
          ) : null}

          {/* Transaction widgets */}
          {dashboardQ.data ? (
            <>
              <StockMovementsWidget events={dashboardQ.data.stockEvents} />
              <PaymentsReceiptsWidget events={dashboardQ.data.moneyEvents} />
            </>
          ) : (
            <>
              <View style={[styles.skeleton, { height: 200, borderRadius: 12 }]} />
              <View style={[styles.skeleton, { height: 200, borderRadius: 12 }]} />
            </>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    backgroundColor: tc.bgSurface,
    borderWidth: 1,
    borderColor: tc.borderDefault,
    borderRadius: 12,
    padding: 16,
    width: '47%',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontFamily: 'NotoSansMono_400Regular',
    fontSize: 11,
    color: tc.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
    color: tc.textPrimary,
    fontVariant: ['tabular-nums'],
    lineHeight: 28,
  },
  kpiSub: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: tc.textTertiary,
    marginTop: 4,
  },
  skeleton: {
    backgroundColor: tc.bgSubtle,
    opacity: 0.7,
  },
  chip: {
    borderWidth: 1,
    borderColor: tc.borderDefault,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: tc.bgSurface,
    marginBottom: 4,
  },
  chipActive: {
    backgroundColor: tc.brandUi,
    borderColor: tc.brandUi,
  },
  chipText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: tc.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'NotoSans_600SemiBold',
  },
  card: {
    backgroundColor: tc.bgSurface,
    borderWidth: 1,
    borderColor: tc.borderDefault,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: 'NotoSerif_600SemiBold',
    fontSize: 18,
    color: tc.textPrimary,
  },
  cardLabel: {
    fontFamily: 'NotoSansMono_400Regular',
    fontSize: 11,
    color: tc.textTertiary,
    letterSpacing: 0.4,
  },
  cardName: {
    fontFamily: 'NotoSerif_600SemiBold',
    fontSize: 18,
    color: tc.textPrimary,
    lineHeight: 24,
  },
  cardMeta: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: tc.textSecondary,
  },
  cardAmount: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
    color: tc.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  cardAmountSub: {
    fontFamily: 'NotoSansMono_400Regular',
    fontSize: 11,
    color: tc.textTertiary,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeInward: {
    backgroundColor: tc.inwardBg,
  },
  badgeOutward: {
    backgroundColor: tc.outwardBg,
  },
  badgeText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
  },
  emptyText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 13,
    color: tc.textTertiary,
  },
  trendLabel: {
    fontFamily: 'NotoSansMono_400Regular',
    fontSize: 10,
    color: tc.textTertiary,
    textAlign: 'center',
  },
});
