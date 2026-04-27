import type { LotDetailData } from '@growcold/shared';
import { formatUpdatedAgo } from '@growcold/shared';
import { Box, Pressable, ScrollView, Text } from '@gluestack-ui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLotDetailQuery } from '../../features/lot-detail/useLotDetailQuery';
import type { RootStackParamList } from '../../navigation/types';
import { ChargesBreakdown } from './ChargesBreakdown';
import { DeliveriesList } from './DeliveriesList';
import { LotSummary } from './LotSummary';
import { RentsPlaceholder } from './RentsPlaceholder';

type Props = NativeStackScreenProps<RootStackParamList, 'LotDetail'>;

type TabId = 'deliveries' | 'charges' | 'rents';

function LotDetailLoaded({
  data,
  dataUpdatedAt,
  isOffline,
  onBack,
}: {
  data: LotDetailData;
  dataUpdatedAt: number;
  isOffline: boolean;
  onBack: () => void;
}) {
  const { t } = useTranslation('pages');
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('deliveries');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'deliveries', label: t('lot_detail.tab_deliveries') },
    { id: 'charges', label: t('lot_detail.tab_charges') },
    { id: 'rents', label: t('lot_detail.tab_rents') },
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
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('lot_detail.back_aria')}
        p="$2"
        minWidth={48}
        minHeight={48}
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="$lg" color="$dashboardLodged" fontWeight="$medium">
          ←
        </Text>
      </Pressable>
      <Text
        flex={1}
        textAlign="center"
        fontSize="$lg"
        fontWeight="$semibold"
        color="$textLight900"
        numberOfLines={1}
      >
        {t('lot_detail.lot_header_label', { number: data.lot_number })}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('lot_detail.menu_aria')}
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
            <Text
              fontSize="$sm"
              fontWeight={active ? '$semibold' : '$medium'}
              color={active ? '#00B14F' : '$dashboardMuted'}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );

  const meta =
    dataUpdatedAt > 0 || isOffline ? (
      <Text fontSize="$xs" color="$dashboardMuted" textAlign="center" mt="$2">
        {isOffline ? t('lot_detail.offline') : ''}
        {isOffline && dataUpdatedAt > 0 ? ' · ' : ''}
        {dataUpdatedAt > 0
          ? t('lot_detail.updated_ago', { time: formatUpdatedAgo(dataUpdatedAt) })
          : ''}
      </Text>
    ) : null;

  return (
    <Box flex={1} bg="$white">
      <ScrollView flex={1} stickyHeaderIndices={[0, 2]} showsVerticalScrollIndicator={false}>
        {header}
        <Box px="$3" pt="$3" bg="$backgroundLight50">
          <LotSummary data={data} />
          {meta}
        </Box>
        {tabBar}
        <Box bg="$white" minHeight={320}>
          {tab === 'deliveries' ? <DeliveriesList deliveries={data.deliveries} /> : null}
          {tab === 'charges' ? <ChargesBreakdown charges={data.charges} /> : null}
          {tab === 'rents' ? <RentsPlaceholder /> : null}
        </Box>
      </ScrollView>
    </Box>
  );
}

export function LotDetailsScreen({ navigation, route }: Props) {
  const { t } = useTranslation('pages');
  const { lotId } = route.params;
  const q = useLotDetailQuery(lotId);
  const net = useNetInfo();
  const isOffline = net.isConnected === false;

  if (q.isPending) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="$backgroundLight50">
        <ActivityIndicator size="large" color="#00B14F" />
        <Text mt="$3" color="$dashboardMuted">
          {t('loading')}
        </Text>
      </Box>
    );
  }

  if (q.isError || !q.data) {
    return (
      <Box flex={1} p="$4" bg="$backgroundLight50" justifyContent="center">
        <Text color="$dashboardDanger">{t('error_load')}</Text>
        <Pressable mt="$4" onPress={() => navigation.goBack()}>
          <Text color="$dashboardLodged" fontWeight="$semibold">
            {t('back')}
          </Text>
        </Pressable>
      </Box>
    );
  }

  return (
    <LotDetailLoaded
      data={q.data}
      dataUpdatedAt={q.dataUpdatedAt}
      isOffline={isOffline}
      onBack={() => navigation.goBack()}
    />
  );
}
