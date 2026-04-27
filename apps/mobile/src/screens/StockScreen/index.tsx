import type { StockTabMovementRowDto } from '@growcold/shared';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import NetInfo from '@react-native-community/netinfo';
import { format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStockMovementsQuery, useStockSummaryQuery } from '../../features/stock/useStockQueries';
import { useAuthReady } from '../../features/home/useAuthReady';
import { supabase } from '../../lib/supabase';
import { useWarehouseStore } from '../../stores/warehouse-store';
import { FilterChips, type StockMovementFilter } from './components/FilterChips';
import { RecordTransactionSheet } from './components/RecordTransactionSheet';
import { StockStatusCard } from './components/StockStatusCard';
import { TransactionCard } from './components/TransactionCard';
import { useDebouncedValue } from '../../features/home/useDebouncedValue';

function sectionKeyForRow(row: StockTabMovementRowDto): string {
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

function matchesSearch(row: StockTabMovementRowDto, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    row.lotNumber.toLowerCase().includes(s) ||
    row.customerCode.toLowerCase().includes(s) ||
    row.customerName.toLowerCase().includes(s) ||
    row.productName.toLowerCase().includes(s)
  );
}

const GREEN = '#00B14F';

export function StockScreen() {
  const { t } = useTranslation('pages');
  const { t: tNav } = useTranslation('nav');
  const insets = useSafeAreaInsets();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const authReady = useAuthReady();
  const configured = !!supabase && authReady && warehouseId.length > 0;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState<StockMovementFilter>('all');
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

  const summaryQ = useStockSummaryQuery();
  const movementsQ = useStockMovementsQuery(20);

  const flatItems = useMemo(
    () => movementsQ.data?.pages.flatMap((p) => p.items) ?? [],
    [movementsQ.data],
  );

  const filtered = useMemo(() => {
    return flatItems.filter((row) => {
      if (filter === 'lodgement' && row.kind !== 'lodgement') return false;
      if (filter === 'delivery' && row.kind !== 'delivery') return false;
      return matchesSearch(row, debouncedSearch);
    });
  }, [flatItems, filter, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, StockTabMovementRowDto[]>();
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
      <Box flex={1} p="$4" bg="$backgroundLight0" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <Text fontSize={20} fontWeight="$semibold" color="$textLight900">
          {tNav('stock')}
        </Text>
        <Text mt="$3" color="$textLight600">
          {t('select_warehouse')}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$backgroundLight0">
      {offline ? (
        <Box bg="$backgroundLight200" px="$4" py="$2">
          <Text size="sm" color="$textLight500">
            {t('home.offline_banner')}
          </Text>
        </Box>
      ) : null}

      <HStack px="$4" pb="$2" alignItems="center" style={{ paddingTop: Math.max(insets.top, 8) }}>
        <Text fontSize={20} fontWeight="$semibold" color="$textLight900">
          {tNav('stock')}
        </Text>
      </HStack>

      <VStack
        px="$2"
        pt="$2"
        pb="$2"
        bg="$backgroundLight0"
        borderBottomWidth={1}
        borderColor="$borderLight200"
      >
        <Box position="relative">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('stock.search_placeholder')}
            placeholderTextColor="#9CA3AF"
            style={{
              height: 48,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingLeft: 40,
              backgroundColor: '#F3F4F6',
              fontSize: 16,
              color: '#111827',
            }}
          />
          <Text position="absolute" left={12} top={14} fontSize={16} color="#9CA3AF">
            🔍
          </Text>
        </Box>
        <Box mt="$2">
          <FilterChips value={filter} onChange={setFilter} />
        </Box>
        <Text mt="$2" fontSize={12} fontWeight="$semibold" color="$textLight500" letterSpacing={0.5}>
          {t('stock.transactions')}
        </Text>
      </VStack>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        onEndReached={() => {
          if (movementsQ.hasNextPage && !movementsQ.isFetchingNextPage) void movementsQ.fetchNextPage();
        }}
        onEndReachedThreshold={0.25}
        ListHeaderComponent={
          <Box mt="$2">
            <StockStatusCard
              data={summaryQ.data}
              isLoading={summaryQ.isPending}
              expanded={statusExpanded}
              onToggle={() => setStatusExpanded((e) => !e)}
            />
            {searching ? (
              <Text px="$3" mb="$2" size="sm" color="$textLight600">
                {filtered.length > 0
                  ? t('stock.showing_results', { count: filtered.length, query: debouncedSearch })
                  : t('stock.no_results', { query: debouncedSearch })}
              </Text>
            ) : null}
            {searching && filtered.length === 0 ? (
              <Text px="$3" mb="$2" size="xs" color="$textLight500">
                {t('stock.no_results_hint')}
              </Text>
            ) : null}
            {movementsQ.isError ? (
              <Text px="$3" color="$red600" size="sm">
                {t('error_load')}
              </Text>
            ) : null}
            {!movementsQ.isPending && !searching && flatItems.length === 0 ? (
              <Box px="$4" py="$8" alignItems="center">
                <Text textAlign="center" color="$textLight700">
                  {t('stock.empty_movements')}
                </Text>
                <Text textAlign="center" mt="$1" size="sm" color="$textLight500">
                  {t('stock.empty_movements_hint')}
                </Text>
              </Box>
            ) : null}
          </Box>
        }
        ListFooterComponent={
          movementsQ.isFetchingNextPage ? (
            <Text textAlign="center" py="$4" size="sm" color="$textLight500">
              {t('loading')}
            </Text>
          ) : (
            <Box h={100} />
          )
        }
        renderSectionHeader={({ section }) => {
          const sec = section as typeof sections[number];
          const open = expandedSections[sec.key] ?? false;
          return (
            <Pressable
              onPress={() => toggleSection(sec.key)}
              bg="$backgroundLight0"
              py="$2"
              px="$2"
              borderBottomWidth={1}
              borderColor="$borderLight100"
            >
              <Box flexDirection="row" alignItems="center" gap="$2">
                <Text fontSize={12} fontWeight="$semibold" color="$textLight500" letterSpacing={0.5}>
                  {sec.title}
                </Text>
                <Text fontSize={14} color="$textLight400">
                  {open ? '▼' : '▶'}
                </Text>
                <Text fontSize={13} color="$textLight500">
                  ({sec.count})
                </Text>
              </Box>
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
        position="absolute"
        right={16}
        bottom={24 + insets.bottom}
        w={56}
        h={56}
        borderRadius={28}
        alignItems="center"
        justifyContent="center"
        style={{
          backgroundColor: GREEN,
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
        accessibilityLabel={t('stock.record_title')}
      >
        <Text color="$white" fontSize={28} fontWeight="$bold">
          +
        </Text>
      </Pressable>

      <RecordTransactionSheet
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        warehouseId={warehouseId}
      />
    </Box>
  );
}
