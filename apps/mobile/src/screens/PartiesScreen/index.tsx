import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import NetInfo from '@react-native-community/netinfo';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PartiesListRowDto } from '@growcold/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthReady } from '../../features/home/useAuthReady';
import { useDebouncedValue } from '../../features/home/useDebouncedValue';
import { usePartiesListQuery, usePartiesReceivablesQuery } from '../../features/parties/usePartiesQueries';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';
import { useWarehouseStore } from '../../stores/warehouse-store';
import { ContactSheet } from './components/ContactSheet';
import { CustomerRow } from './components/CustomerRow';
import { FilterChips, type PartiesListFilter } from './components/FilterChips';
import { ReceivablesCard } from './components/ReceivablesCard';

export function PartiesScreen() {
  const { t } = useTranslation('pages');
  const { t: tNav } = useTranslation('nav');
  const { t: tHome } = useTranslation('home');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const authReady = useAuthReady();
  const configured = !!supabase && authReady && warehouseId.length > 0;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filter, setFilter] = useState<PartiesListFilter>('active');
  const [statusExpanded, setStatusExpanded] = useState(true);
  const [contact, setContact] = useState<{ code: string; phone: string } | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => sub();
  }, []);

  const receivablesQ = usePartiesReceivablesQuery();
  const listQ = usePartiesListQuery(filter, debouncedSearch, 50);

  const flat = useMemo(
    () => listQ.data?.pages.flatMap((p) => p.items) ?? [],
    [listQ.data],
  );
  const filterTotal = listQ.data?.pages[0]?.filterTotal ?? 0;
  const scopeKey =
    filter === 'all' ? 'scope_all' : filter === 'active' ? 'scope_active' : 'scope_pending';

  const searching = debouncedSearch.trim().length > 0;

  const onOpenDetail = useCallback(
    (row: PartiesListRowDto) => {
      const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
      root?.navigate('PartyDetail', { customerId: row.customerId });
    },
    [navigation],
  );

  const onOpenContact = useCallback((row: PartiesListRowDto) => {
    const phone = (row.phone ?? '').trim() || (row.mobile ?? '').trim();
    if (!phone) return;
    setContact({ code: row.customerCode, phone });
  }, []);

  if (!configured) {
    return (
      <Box flex={1} p="$4" bg="#F9FAFB" style={{ paddingTop: Math.max(insets.top, 16) }}>
        <Text fontSize={20} fontWeight="$semibold" color="$textLight900">
          {tNav('parties')}
        </Text>
        <Text mt="$3" color="$textLight600">
          {t('select_warehouse')}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="#F9FAFB">
      {offline ? (
        <Box bg="$backgroundLight200" px="$4" py="$2">
          <Text size="sm" color="$textLight500">
            {tHome('offline_banner')}
          </Text>
        </Box>
      ) : null}

      <HStack px="$4" pb="$2" alignItems="center" style={{ paddingTop: Math.max(insets.top, 8) }}>
        <Text fontSize={20} fontWeight="$semibold" color="$textLight900">
          {tNav('parties')}
        </Text>
      </HStack>

      <VStack px="$3" pt="$2" pb="$2" space="sm" bg="#F9FAFB">
        <Box position="relative">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('parties.search_placeholder')}
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

        <ReceivablesCard
          data={receivablesQ.data ?? null}
          isLoading={receivablesQ.isPending}
          expanded={statusExpanded}
          onToggle={() => setStatusExpanded((e) => !e)}
        />

        <FilterChips value={filter} onChange={setFilter} />

        <Text fontSize={12} fontWeight="$semibold" color="#6B7280" letterSpacing={0.5}>
          {t('parties.customers_section', { count: filterTotal, scope: t(`parties.${scopeKey}`) })}
        </Text>
      </VStack>

      {searching ? (
        <Text px="$3" mb="$2" size="sm" color="$textLight600">
          {filterTotal > 0
            ? t('parties.showing_customers', { count: filterTotal, query: debouncedSearch })
            : t('parties.no_results', { query: debouncedSearch })}
        </Text>
      ) : null}
      {searching && filterTotal === 0 && !listQ.isPending ? (
        <Text px="$3" mb="$2" size="xs" color="$textLight500">
          {t('parties.no_results_hint')}
        </Text>
      ) : null}

      {listQ.isError ? (
        <Text px="$3" color="$red600" size="sm">
          {t('error_load')}
        </Text>
      ) : null}

      {!listQ.isPending && !searching && flat.length === 0 ? (
        <Box px="$4" py="$8" alignItems="center">
          <Text textAlign="center" color="$textLight700">
            {t('parties.empty_customers')}
          </Text>
          <Text textAlign="center" mt="$1" size="sm" color="$textLight500">
            {t('parties.empty_customers_hint')}
          </Text>
        </Box>
      ) : null}

      <Box flex={1} minHeight={200}>
        <FlashList
          data={flat}
          keyExtractor={(item) => item.customerId}
          estimatedItemSize={120}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          onEndReached={() => {
            if (listQ.hasNextPage && !listQ.isFetchingNextPage) void listQ.fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            listQ.isFetchingNextPage ? (
              <Text textAlign="center" py="$4" size="sm" color="$textLight500">
                {t('parties.load_more')}
              </Text>
            ) : (
              <Box h={24} />
            )
          }
          renderItem={({ item }) => (
            <Box mb="$2">
              <CustomerRow row={item} onOpenContact={onOpenContact} onOpenDetail={onOpenDetail} />
            </Box>
          )}
        />
      </Box>

      <ContactSheet
        isOpen={contact !== null}
        onClose={() => setContact(null)}
        code={contact?.code ?? ''}
        phone={contact?.phone ?? ''}
      />
    </Box>
  );
}
