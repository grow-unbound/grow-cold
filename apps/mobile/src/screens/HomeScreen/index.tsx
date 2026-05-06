import { Box, HStack, Pressable, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';
import { colors as tc } from '@growcold/tokens';
import { useEffect, useState } from 'react';
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
import type { RootStackParamList } from '../../navigation/types';
import { useWarehouseStore } from '../../stores/warehouse-store';
import { AlertsSection } from './components/AlertsSection';
import { BusinessSnapshot } from './components/BusinessSnapshot';
import { MoneyPerformance } from './components/MoneyPerformance';
import { PartiesPerformance } from './components/PartiesPerformance';
import { StockPerformance } from './components/StockPerformance';
import { TodaysActivity } from './components/TodaysActivity';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation('home');
  const { t: tNav } = useTranslation('nav');
  const { t: tPages } = useTranslation('pages');
  const { t: tSearch } = useTranslation('search');
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
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

  const openSearch = () => {
    const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    root?.navigate('Search');
  };

  return (
    <Box flex={1} bg="$bgSurface">
      {offline ? (
        <Box bg="$bgInset" px="$4" py="$2">
          <Text size="sm" color="$textTertiary">
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
            <Text
              flex={1}
              mr="$2"
              fontFamily="NotoSerif_500Medium"
              fontSize={24}
              lineHeight={30}
              color="$textPrimary"
            >
              {tNav('home')}
            </Text>
            <HStack space="sm" alignItems="center">
              <Pressable
                onPress={openSearch}
                accessibilityRole="button"
                accessibilityLabel={tSearch('open_aria')}
                style={{
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Search size={22} color={tc.textSecondary} strokeWidth={1.75} />
              </Pressable>
              <ProfileMenu />
            </HStack>
          </HStack>

          {!configured ? (
            <Text fontSize={16} color="$textTertiary">
              {t('configure_env')}
            </Text>
          ) : null}

          {configured && snapshot.isError ? (
            <Text color="$outward">{tPages('error_load')}</Text>
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
              <Text fontSize={16} fontWeight="$bold" color="$textPrimary" mt="$4">
                {t('summary')}
              </Text>
              <StockPerformance />
              <MoneyPerformance />
              <PartiesPerformance />
              <Text size="xs" color="$textTertiary" mt="$2">
                {updatedLabel}
              </Text>
            </>
          ) : null}
        </VStack>
      </ScrollView>
    </Box>
  );
}
