import { Box, HStack, Pressable, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Modal, Pressable as RNPressable, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ProfileMenu } from '../../components/ProfileMenu';
import { supabase } from '../../lib/supabase';
import { useAuthReady } from '../../features/home/useAuthReady';
import {
  useAlertsQuery,
  useBusinessSnapshotQuery,
  useTodaysActivityQuery,
} from '../../features/home/useHomeQueries';
import { useWarehouseStore } from '../../stores/warehouse-store';
import { AlertsSection } from './components/AlertsSection';
import { BusinessSnapshot } from './components/BusinessSnapshot';
import { MoneyPerformance } from './components/MoneyPerformance';
import { PartiesPerformance } from './components/PartiesPerformance';
import { StockPerformance } from './components/StockPerformance';
import { TodaysActivity } from './components/TodaysActivity';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('home');
  const { t: tNav } = useTranslation('nav');
  const { t: tPages } = useTranslation('pages');
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const [searchOpen, setSearchOpen] = useState(false);
  const authReady = useAuthReady();
  const configured = !!supabase && authReady && warehouseId.length > 0;
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => sub();
  }, []);

  const snapshot = useBusinessSnapshotQuery();
  const activity = useTodaysActivityQuery();
  const alerts = useAlertsQuery();

  const updatedLabel = t('updated', { time: new Date().toLocaleTimeString() });

  return (
    <Box flex={1} bg="$dashboardSurface">
      {offline ? (
        <Box bg="$backgroundLight200" px="$4" py="$2">
          <Text size="sm" color="$textLight500">
            {t('offline_banner')}
          </Text>
        </Box>
      ) : null}
      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 32 }}>
        <VStack px="$4" pt="$2" space="md">
          <HStack
            justifyContent="space-between"
            alignItems="center"
            pt={Math.max(insets.top, 8)}
            pb="$2"
          >
            <Text fontSize={20} fontWeight="$semibold" color="$textLight900" flex={1} mr="$2">
              {tNav('home')}
            </Text>
            <HStack space="md" alignItems="center">
              <Pressable
                onPress={() => setSearchOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Search"
                p="$2"
                style={{ minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text fontSize="$xl">🔍</Text>
              </Pressable>
              <ProfileMenu />
            </HStack>
          </HStack>

          {!configured ? (
            <Text fontSize={16} color="$textLight500">
              {t('configure_env')}
            </Text>
          ) : null}

          {configured && snapshot.isError ? (
            <Text color="$dashboardDanger">{tPages('error_load')}</Text>
          ) : null}

          <BusinessSnapshot
            data={snapshot.data}
            isLoading={configured && snapshot.isPending}
          />
          <TodaysActivity
            data={activity.data}
            isLoading={configured && activity.isPending}
          />
          <AlertsSection alerts={alerts.data} isLoading={configured && alerts.isPending} />

          {configured ? (
            <>
              <Text fontSize={16} fontWeight="$bold" color="$textLight900" mt="$4">
                {t('summary')}
              </Text>
              <StockPerformance />
              <MoneyPerformance />
              <PartiesPerformance />
              <Text size="xs" color="$textLight500" mt="$2">
                {updatedLabel}
              </Text>
            </>
          ) : null}
        </VStack>
      </ScrollView>

      <Modal visible={searchOpen} transparent animationType="fade" onRequestClose={() => setSearchOpen(false)}>
        <RNPressable
          onPress={() => setSearchOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24 }}>
            <RNText style={{ fontSize: 16, marginBottom: 16, color: '#363A45' }}>{t('search_coming')}</RNText>
            <RNPressable onPress={() => setSearchOpen(false)} accessibilityRole="button">
              <RNText style={{ color: '#00B14F', fontWeight: '600' }}>OK</RNText>
            </RNPressable>
          </View>
        </RNPressable>
      </Modal>
    </Box>
  );
}
