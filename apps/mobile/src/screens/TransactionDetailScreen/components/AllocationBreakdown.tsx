import { Box, Text, VStack } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

export function AllocationBreakdown() {
  const { t } = useTranslation('pages');
  return (
    <VStack space="md" mt="$4">
      <Text fontSize={12} fontWeight="$semibold" color="#7A6F61" letterSpacing={1.2}>
        {t('transaction_detail.section_allocation')}
      </Text>
      <Box
        borderRadius={12}
        borderWidth={1}
        borderColor="#E5DED2"
        bg="$white"
        p="$4"
        alignItems="center"
      >
        <Text fontSize={14} fontWeight="$semibold" color="#7A6F61" textAlign="center" mb="$2">
          {t('transaction_detail.allocation_future_title')}
        </Text>
        <Text fontSize={14} color="#7A6F61" textAlign="center" lineHeight={22}>
          {t('transaction_detail.allocation_future_body')}
        </Text>
      </Box>
    </VStack>
  );
}
