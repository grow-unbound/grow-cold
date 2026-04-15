import { Box, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSessionStore, type AppRole } from '../stores/session-store';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { t: tCommon } = useTranslation('common');
  const { t: tMenu } = useTranslation('menu');
  const { role, setRole } = useSessionStore();

  function openMenu() {
    Alert.alert(
      tCommon('app_name'),
      `${tMenu('settings')} · ${tMenu('warehouse')} · ${tMenu('profile')}`,
      [
        { text: tMenu('settings'), onPress: () => {} },
        { text: tMenu('warehouse'), onPress: () => {} },
        { text: tMenu('profile'), onPress: () => {} },
        {
          text: 'Simulate STAFF',
          onPress: () => setRole('STAFF' satisfies AppRole),
        },
        {
          text: 'Simulate MANAGER',
          onPress: () => setRole('MANAGER' satisfies AppRole),
        },
        {
          text: 'Simulate OWNER',
          onPress: () => setRole('OWNER' satisfies AppRole),
        },
        { text: 'Close', style: 'cancel' },
      ],
    );
  }

  return (
    <Box
      borderBottomWidth={1}
      borderColor="$borderLight200"
      bg="$backgroundLight0"
      px="$4"
      py="$3"
      pt={insets.top + 12}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$lg" fontWeight="$semibold" color="$textLight900">
          {tCommon('app_name')}
        </Text>
        <HStack space="sm" alignItems="center">
          <Text fontSize="$xs" color="$textLight500">
            {role}
          </Text>
          <Pressable
            onPress={openMenu}
            accessibilityRole="button"
            accessibilityLabel="User menu"
            p="$2"
            borderRadius="$md"
            bg="$backgroundLight100"
          >
            <Text fontWeight="$bold">U</Text>
          </Pressable>
        </HStack>
      </HStack>
    </Box>
  );
}
