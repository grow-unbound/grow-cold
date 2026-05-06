import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';

export type StockMovementFilter = 'all' | 'lodgement' | 'delivery';

const GREEN = '#00B14F';

interface Props {
  value: StockMovementFilter;
  onChange: (v: StockMovementFilter) => void;
}

export function FilterChips({ value, onChange }: Props) {
  const { t } = useTranslation('pages');
  const chips: { id: StockMovementFilter; label: string }[] = [
    { id: 'all', label: t('stock.filter_all') },
    { id: 'lodgement', label: t('stock.filter_lodgements') },
    { id: 'delivery', label: t('stock.filter_deliveries') },
  ];

  return (
    <Box flexDirection="row" gap="$2" px="$2" pb="$1">
      {chips.map((c) => {
        const active = value === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(c.id)}
            px="$3"
            py="$1.5"
            borderRadius="$full"
            borderWidth={1}
            borderColor={active ? GREEN : '#E5E7EB'}
            style={{ backgroundColor: active ? GREEN : '#fff' }}
          >
            <Text fontSize={13} fontWeight="$semibold" color={active ? '$white' : '#6B7280'}>
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );
}
