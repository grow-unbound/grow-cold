import { formatUpdatedAgo } from '@growcold/shared';
import { Box, Pressable, ScrollView, Text } from '@gluestack-ui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePartyDetailQuery } from '../../features/parties/usePartyDetailQuery';
import type { RootStackParamList } from '../../navigation/types';
import { useWarehouseStore } from '../../stores/warehouse-store';
import { ContactSheet } from '../PartiesScreen/components/ContactSheet';
import { CustomerSummary } from './components/CustomerSummary';
import { LotsList } from './components/LotsList';
import { ReceiptsList } from './components/ReceiptsList';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyDetail'>;
type TabId = 'lots' | 'receipts';

export function PartyDetailsScreen({ navigation, route }: Props) {
  const { t } = useTranslation('pages');
  const insets = useSafeAreaInsets();
  const { customerId } = route.params;
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const q = usePartyDetailQuery(warehouseId ?? undefined, customerId);
  const [tab, setTab] = useState<TabId>('lots');
  const [contactOpen, setContactOpen] = useState(false);
  const net = useNetInfo();
  const isOffline = net.isConnected === false;

  const data = q.data ?? undefined;
  const phoneForContact = useMemo(() => {
    if (!data) return '';
    return (data.phone ?? '').trim() || (data.mobile ?? '').trim() || '';
  }, [data]);

  const updatedAgo =
    q.isSuccess && q.dataUpdatedAt > 0 ? formatUpdatedAgo(q.dataUpdatedAt) : null;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'lots', label: t('parties.party_detail.tab_lots') },
    { id: 'receipts', label: t('parties.party_detail.tab_receipts') },
  ];

  const header = (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      borderBottomWidth={1}
      borderBottomColor="#E2E4E8"
      bg="$white"
      px="$2"
      style={{ paddingTop: Math.max(insets.top, 8) }}
      minHeight={56}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t('parties.party_detail.back_aria')}
        p="$2"
        minWidth={48}
        minHeight={48}
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="$lg" color="#0891B2" fontWeight="$medium">
          ←
        </Text>
      </Pressable>
      <Text flex={1} textAlign="center" fontSize={18} fontWeight="$semibold" color="$textLight900" numberOfLines={1}>
        {data?.customerCode ?? '…'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('parties.party_detail.menu_aria')}
        accessibilityState={{ disabled: true }}
        disabled
        p="$2"
        minWidth={48}
        minHeight={48}
        justifyContent="center"
        alignItems="center"
        opacity={0.35}
      >
        <Text fontSize="$xl" color="$dashboardMuted">
          ⋮
        </Text>
      </Pressable>
    </Box>
  );

  const tabBar = (
    <Box flexDirection="row" borderBottomWidth={1} borderBottomColor="#E2E4E8" bg="$white">
      {tabs.map((item) => {
        const active = tab === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => setTab(item.id)}
            flex={1}
            minHeight={48}
            justifyContent="center"
            alignItems="center"
            borderBottomWidth={3}
            borderBottomColor={active ? '#00B14F' : 'transparent'}
          >
            <Text fontSize="$sm" fontWeight="$medium" color={active ? '#00B14F' : '$dashboardMuted'}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );

  if (!warehouseId) {
    return (
      <Box flex={1} p="$4" bg="#F9FAFB" justifyContent="center">
        <Text color="$textLight600" textAlign="center">
          {t('select_warehouse')}
        </Text>
      </Box>
    );
  }

  if (q.isPending) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="#F9FAFB">
        <ActivityIndicator size="large" color="#00B14F" />
        <Text mt="$3" color="$dashboardMuted">
          {t('loading')}
        </Text>
      </Box>
    );
  }

  if (q.isError || !data) {
    return (
      <Box flex={1} p="$4" bg="#F9FAFB" justifyContent="center" style={{ paddingTop: insets.top + 8 }}>
        <Pressable onPress={() => navigation.goBack()} mb="$4">
          <Text color="#0891B2" size="md">
            ← {t('back')}
          </Text>
        </Pressable>
        <Text color="$textLight600" textAlign="center">
          {t('error_load')}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$white">
      <ScrollView flex={1} stickyHeaderIndices={[0, 2]} showsVerticalScrollIndicator={false}>
        {header}
        <Box px="$3" pt="$3" bg="#F9FAFB">
          <CustomerSummary
            data={data}
            onPhonePress={() => {
              if (phoneForContact) setContactOpen(true);
            }}
            updatedAgo={updatedAgo}
            isOffline={isOffline}
          />
        </Box>
        {tabBar}
        <Box bg="$white" px="$3" pb="$6" pt="$4" minHeight={320}>
          {tab === 'lots' ? (
            <LotsList lots={data.lots} onOpenLot={(lotId) => navigation.navigate('LotDetail', { lotId })} />
          ) : null}
          {tab === 'receipts' ? (
            <ReceiptsList
              receipts={data.receipts}
              hasMore={q.hasNextPage ?? false}
              isFetchingMore={q.isFetchingNextPage}
              onLoadMore={() => void q.fetchNextPage()}
              onOpenReceipt={(id) => navigation.navigate('TransactionDetail', { id, kind: 'receipt' })}
            />
          ) : null}
        </Box>
      </ScrollView>
      <ContactSheet
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        code={data.customerCode}
        phone={phoneForContact}
      />
    </Box>
  );
}
