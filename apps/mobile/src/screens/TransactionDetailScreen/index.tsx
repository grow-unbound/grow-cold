import { formatUpdatedAgo } from '@growcold/shared';
import { Box, HStack, Pressable, ScrollView, Text } from '@gluestack-ui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactionDetailQuery } from '../../features/money/useTransactionDetailQuery';
import type { RootStackParamList } from '../../navigation/types';
import { AllocationBreakdown } from './components/AllocationBreakdown';
import { TransactionSummary } from './components/TransactionSummary';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionDetail'>;

export function TransactionDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation('pages');
  const insets = useSafeAreaInsets();
  const { id, kind } = route.params;
  const q = useTransactionDetailQuery(kind, id);
  const net = useNetInfo();
  const isOffline = net.isConnected === false;

  if (q.isPending) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="$white">
        <ActivityIndicator size="large" color="#00B14F" />
        <Text mt="$3" color="$dashboardMuted">
          {t('loading')}
        </Text>
      </Box>
    );
  }

  if (q.isError || !q.data) {
    return (
      <Box flex={1} p="$4" pt={insets.top + 12} bg="$white" justifyContent="center">
        <Text color="$red600">{t('error_load')}</Text>
        <Pressable mt="$4" onPress={() => navigation.goBack()}>
          <Text color="$primary600" fontWeight="$semibold">
            {t('money.back_to_money')}
          </Text>
        </Pressable>
      </Box>
    );
  }

  const data = q.data;
  const headerTitle =
    data.kind === 'receipt'
      ? t('transaction_detail.header_receipt', { ref: data.headerReference })
      : t('transaction_detail.header_payment', { ref: data.headerReference });

  const meta =
    q.dataUpdatedAt > 0 ? (
      <Text fontSize="$xs" color="#6B7280" textAlign="center" mt="$2" px="$3">
        {t('transaction_detail.updated_ago', { time: formatUpdatedAgo(q.dataUpdatedAt) })}
      </Text>
    ) : null;

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
        accessibilityLabel={t('transaction_detail.back_aria')}
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
        fontSize={18}
        fontWeight="$semibold"
        color="$textLight900"
        numberOfLines={1}
        px="$1"
      >
        {headerTitle}
      </Text>
      <HStack alignItems="center" minWidth={48} justifyContent="flex-end">
        {isOffline ? (
          <Text fontSize={11} color="#DC2626" fontWeight="$semibold" numberOfLines={1} mr="$1">
            {t('transaction_detail.offline')}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('transaction_detail.menu_aria')}
          accessibilityHint={t('transaction_detail.menu_disabled_hint')}
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
      </HStack>
    </Box>
  );

  return (
    <Box flex={1} bg="$white">
      <ScrollView flex={1} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {header}
        <Box px="$3" pt="$3" pb="$6" bg="$white">
          <TransactionSummary data={data} />
          {meta}
          {data.showAllocationPlaceholder ? <AllocationBreakdown /> : null}
        </Box>
      </ScrollView>
    </Box>
  );
}
