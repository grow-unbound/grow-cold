import { Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

export function RentsPlaceholder() {
  const { t } = useTranslation('pages');
  return (
    <VStack space="md" px="$4" py="$10" alignItems="center">
      <Text fontSize="$sm" fontWeight="$medium" color="$dashboardMuted" textTransform="uppercase">
        {t('lot_detail.rents_title')}
      </Text>
      <Text fontSize="$sm" color="$dashboardMuted" textAlign="center" maxWidth={400} lineHeight="$md">
        {t('lot_detail.rents_placeholder_body')}
      </Text>
    </VStack>
  );
}
