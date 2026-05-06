import { HStack, Pressable, Text } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import type { HomeTimeFilter } from '@growcold/shared';

const FILTERS: HomeTimeFilter[] = ['today', 'yesterday', 'week', 'month'];

interface TimeFilterChipsProps {
  value: HomeTimeFilter;
  onChange: (v: HomeTimeFilter) => void;
}

export function TimeFilterChips({ value, onChange }: TimeFilterChipsProps) {
  const { t } = useTranslation('home');

  function label(f: HomeTimeFilter): string {
    switch (f) {
      case 'today':
        return t('filter_today');
      case 'yesterday':
        return t('filter_yesterday');
      case 'week':
        return t('filter_week');
      case 'month':
        return t('filter_month');
      default:
        return f;
    }
  }

  return (
    <HStack flexWrap="wrap" gap="$2" py="$2">
      {FILTERS.map((f) => {
        const active = value === f;
        return (
          <Pressable
            key={f}
            onPress={() => onChange(f)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            py="$2"
            px="$4"
            borderRadius="$full"
            minHeight={48}
            justifyContent="center"
            borderWidth={1}
            borderColor="$dashboardLodged"
            bg={active ? '$dashboardLodged' : 'transparent'}
          >
            <Text fontSize="$sm" fontWeight="$medium" color={active ? '#FFFFFF' : '$dashboardLodged'}>
              {label(f)}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  );
}
