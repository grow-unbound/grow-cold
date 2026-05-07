import { Box, Text } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

interface PlaceholderScreenProps {
  titleKey: 'home' | 'inventory' | 'stock' | 'money' | 'parties' | 'transactions';
}

export function PlaceholderScreen({ titleKey }: PlaceholderScreenProps) {
  const { t } = useTranslation('nav');
  return (
    <Box flex={1} p="$4" bg="$bgSurface">
      <Text fontSize="$xl" fontWeight="$semibold" color="$textPrimary">
        {t(titleKey)}
      </Text>
      <Text mt="$2" fontSize="$sm" color="$textSecondary">
        Placeholder — wire Supabase + flows next.
      </Text>
    </Box>
  );
}
