import { Box, Pressable, Text, VStack } from '@gluestack-ui/themed';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { HomeAlert } from '@growcold/shared';
import type { RootStackParamList } from '../../../navigation/types';
import type { RootTabParamList } from '../../../navigation/RootTabs';

interface Props {
  alerts: HomeAlert[] | undefined;
  isLoading: boolean;
}

export function AlertsSection({ alerts, isLoading }: Props) {
  const { t } = useTranslation('home');
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  if (isLoading) {
    return <Box h={100} mt="$6" borderRadius={12} bg="$bgInset" />;
  }

  const items = alerts ?? [];

  return (
    <Box mt="$6">
      <Text size="sm" fontWeight="$bold" color="$outward" textTransform="uppercase" mb="$2">
        {t('needs_attention')}
      </Text>
      {items.length === 0 ? (
        <Text fontSize={16} color="$textTertiary">
          {t('alerts_empty')}
        </Text>
      ) : (
        <VStack space="sm">
          {items.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => {
                if (a.nav.kind === 'party') {
                  const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
                  root?.navigate('PartyDetail', { customerId: a.nav.customerId });
                } else if (a.nav.kind === 'stock_stale') {
                  navigation.navigate('Stock');
                } else {
                  navigation.navigate('Money');
                }
              }}
              accessibilityRole="button"
              py="$2"
            >
              <Text fontSize={16} color="$textPrimary">
                • {a.message}
              </Text>
            </Pressable>
          ))}
        </VStack>
      )}
    </Box>
  );
}
