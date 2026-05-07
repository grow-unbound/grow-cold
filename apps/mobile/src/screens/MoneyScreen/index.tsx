import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import NetInfo from '@react-native-community/netinfo';
import { format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MoneyTabMovementRowDto } from '@growcold/shared';
import { colors as c } from '@growcold/tokens';
import { Search } from 'lucide-react-native';
import { useAuthReady } from '../../features/home/useAuthReady';
import { useMoneyMovementsQuery, useMoneySummaryQuery } from '../../features/money/useMoneyQueries';
import { useDebouncedValue } from '../../features/home/useDebouncedValue';
import { supabase } from '../../lib/supabase';
import { useWarehouseStore } from '../../stores/warehouse-store';
import { CashStatusCard } from './components/CashStatusCard';
import { FilterChips, type MoneyMovementFilter } from './components/FilterChips';
import { RecordTransactionSheet } from './components/RecordTransactionSheet';
import { TransactionCard } from './components/TransactionCard';

function sectionKeyForRow(row: MoneyTabMovementRowDto): string {
  const d = startOfDay(parseISO(row.transactionDate));
  if (isToday(d)) return '__today__';
  if (isYesterday(d)) return '__yesterday__';
  return row.transactionDate;
}

function sectionLabel(key: string): string {
  if (key === '__today__') return 'TODAY';
  if (key === '__yesterday__') return 'YESTERDAY';
  const d = startOfDay(parseISO(key));
  return format(d, 'MMM d (EEE)').toUpperCase();
}

function matchesSearch(row: MoneyTabMovementRowDto, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const amt = String(row.amount);
  return (
    row.counterparty.toLowerCase().includes(s) ||
    row.detailLine.toLowerCase().includes(s) ||
    (row.notes?.toLowerCase().includes(s) ?? false) ||
    amt.includes(s) ||
    (row.paymentMethod?.toLowerCase().includes(s) ?? false)
  );
}

export function MoneyScreen() {
  const { t } = useTranslation('pages');
  const { t: tNav } = useTranslation('nav');
  const insets = useSafeAreaInsets();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const authReady = useAuthReady();
  const configured = !!supabase && authReady && warehouseId.length > 0;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState<MoneyMovementFilter>('all');
  const [statusExpanded, setStatusExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ __today__: true });
  const [recordOpen, setRecordOpen] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => sub();
  }, []);

  const summaryQ = useMoneySummaryQuery();
  const movementsQ = useMoneyMovementsQuery(20);

  const flatItems = useMemo(
    () => movementsQ.data?.pages.flatMap((p) => p.items) ?? [],
    [movementsQ.data],
  );

  const filtered = useMemo(() => {
    return flatItems.filter((row) => {
      if (filter === 'receipt' && row.kind !== 'receipt') return false;
      if (filter === 'payment' && row.kind !== 'payment') return false;
      return matchesSearch(row, debouncedSearch);
    });
  }, [flatItems, filter, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, MoneyTabMovementRowDto[]>();
    for (const row of filtered) {
      const k = sectionKeyForRow(row);
      const arr = map.get(k) ?? [];
      arr.push(row);
      map.set(k, arr);
    }
    const keys = [...map.keys()].sort((a, b) => {
      if (a === '__today__') return -1;
      if (b === '__today__') return 1;
      if (a === '__yesterday__') return -1;
      if (b === '__yesterday__') return 1;
      return b.localeCompare(a);
    });
    return keys.map((key) => ({ key, items: map.get(key) ?? [] }));
  }, [filtered]);

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      for (const g of grouped) {
        if (next[g.key] === undefined) next[g.key] = g.key === '__today__';
      }
      return next;
    });
  }, [grouped]);

  const sections = useMemo(
    () =>
      grouped.map((g) => ({
        key: g.key,
        title: sectionLabel(g.key),
        count: g.items.length,
        data: expandedSections[g.key] ? g.items : [],
      })),
    [grouped, expandedSections],
  );

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  const searching = debouncedSearch.trim().length > 0;

  if (!configured) {
    return (
      <Box flex={1} p="$4" bg="$bgSurface" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <Text fontSize={20} fontWeight="$semibold" color="$textPrimary">
          {tNav('money')}
        </Text>
        <Text mt="$3" color="$textSecondary">
          {t('select_warehouse')}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$bgSurface">
      {offline ? (
        <Box bg="$bgInset" px="$4" py="$2">
          <Text size="sm" color="$textTertiary">
            {t('home.offline_banner')}
          </Text>
        </Box>
      ) : null}

      <HStack px="$4" pb="$2" alignItems="center" style={{ paddingTop: Math.max(insets.top, 8) }}>
        <Text fontSize={20} fontWeight="$semibold" color="$textPrimary">
          {tNav('money')}
        </Text>
      </HStack>

      <VStack
        px="$2"
        pt="$2"
        pb="$2"
        bg="$bgSurface"
        borderBottomWidth={1}
        borderColor="$borderLight200"
      >
        <HStack
          alignItems="center"
          bg="$bgSurface"
          borderWidth={1.5}
          borderColor="$borderDefault"
          borderRadius={10}
          px="$3"
          space="sm"
          style={{ height: 44 }}
        >
          <Search size={16} color={c.textTertiary} strokeWidth={1.75} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('money.search_placeholder')}
            placeholderTextColor={c.textTertiary}
            style={styles.searchInput}
          />
        </HStack>
        <Box mt="$2">
          <FilterChips value={filter} onChange={setFilter} />
        </Box>
        <RNText style={sectionLabelStyle}>{t('money.transactions')}</RNText>
      </VStack>

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        stickySectionHeadersEnabled={false}
        onEndReached={() => {
          if (movementsQ.hasNextPage && !movementsQ.isFetchingNextPage) void movementsQ.fetchNextPage();
        }}
        onEndReachedThreshold={0.25}
        ListHeaderComponent={
          <Box mt="$2">
            <CashStatusCard
              data={summaryQ.data}
              isLoading={summaryQ.isPending}
              expanded={statusExpanded}
              onToggle={() => setStatusExpanded((e) => !e)}
            />
            {searching ? (
              <Text px="$3" mb="$2" size="sm" color="$textSecondary">
                {filtered.length > 0
                  ? t('stock.showing_results', { count: filtered.length, query: debouncedSearch })
                  : t('stock.no_results', { query: debouncedSearch })}
              </Text>
            ) : null}
            {movementsQ.isError ? (
              <Text px="$3" color="$outward" size="sm">
                {t('error_load')}
              </Text>
            ) : null}
            {!movementsQ.isPending && !searching && flatItems.length === 0 ? (
              <Box px="$4" py="$8" alignItems="center">
                <Text textAlign="center" color="$textSecondary">
                  {t('money.empty_movements')}
                </Text>
                <Text textAlign="center" mt="$1" size="sm" color="$textTertiary">
                  {t('money.empty_movements_hint')}
                </Text>
              </Box>
            ) : null}
          </Box>
        }
        ListFooterComponent={
          movementsQ.isFetchingNextPage ? (
            <Text textAlign="center" py="$4" size="sm" color="$textTertiary">
              {t('loading')}
            </Text>
          ) : (
            <Box h={100} />
          )
        }
        renderSectionHeader={({ section }) => {
          const sec = section as (typeof sections)[number];
          const open = expandedSections[sec.key] ?? false;
          return (
            <Pressable
              onPress={() => toggleSection(sec.key)}
              style={secHeaderStyle}
            >
              <RNText style={sectionLabelStyle}>{sec.title}</RNText>
              <RNText style={secChevronStyle}>{open ? '▼' : '▶'}</RNText>
              <RNText style={secCountStyle}>({sec.count})</RNText>
            </Pressable>
          );
        }}
        renderItem={({ item }) => (
          <Box px="$2">
            <TransactionCard row={item} />
          </Box>
        )}
      />

      <Pressable
        onPress={() => setRecordOpen(true)}
        accessibilityLabel={t('money.record_title')}
        style={[fabStyle, { bottom: 24 + insets.bottom }]}
      >
        <RNText style={fabIconStyle}>+</RNText>
      </Pressable>

      <RecordTransactionSheet
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        warehouseId={warehouseId}
      />
    </Box>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: c.textPrimary,
    fontFamily: 'NotoSans_400Regular',
  },
});

const sectionLabelStyle = {
  fontFamily: 'NotoSansMono_400Regular',
  fontSize: 11,
  fontWeight: '500' as const,
  color: c.textTertiary,
  textTransform: 'uppercase' as const,
  letterSpacing: 1.1,
  marginTop: 8,
  marginBottom: 2,
  paddingHorizontal: 4,
};

const secHeaderStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  paddingVertical: 8,
  paddingHorizontal: 16,
  backgroundColor: c.bgSurface,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: c.borderDefault,
};

const secChevronStyle = {
  fontSize: 11,
  color: c.textTertiary,
};

const secCountStyle = {
  fontSize: 12,
  fontFamily: 'NotoSans_400Regular',
  color: c.textTertiary,
};

const fabStyle = {
  position: 'absolute' as const,
  right: 16,
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: c.brandUi,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  elevation: 6,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
};

const fabIconStyle = {
  color: '#FFFFFF',
  fontSize: 28,
  fontWeight: '400' as const,
  lineHeight: 32,
  marginTop: -2,
};
