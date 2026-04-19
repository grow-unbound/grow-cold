import { Box, Text } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

interface PlaceholderScreenProps {
  titleKey: 'home' | 'inventory' | 'parties' | 'transactions';
}

export function PlaceholderScreen({ titleKey }: PlaceholderScreenProps) {
  const { t } = useTranslation('nav');
  return (
    <Box flex={1} p="$4" bg="$backgroundLight0">
      <Text fontSize="$xl" fontWeight="$semibold" color="$textLight900">
        {t(titleKey)}
      </Text>
      <Text mt="$2" fontSize="$sm" color="$textLight600">
        Placeholder — wire Supabase + flows next.
      </Text>
    </Box>
  );
}
