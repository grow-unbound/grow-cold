import { Pressable, Text } from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

export type PartiesListFilter = 'all' | 'active' | 'pending';

const GREEN = '#00B14F';

interface Props {
  value: PartiesListFilter;
  onChange: (v: PartiesListFilter) => void;
}

const ORDER: PartiesListFilter[] = ['all', 'active', 'pending'];

export function FilterChips({ value, onChange }: Props) {
  const { t } = useTranslation('pages');
  const labels: Record<PartiesListFilter, string> = {
    all: t('parties.filter_all'),
    active: t('parties.filter_active'),
    pending: t('parties.filter_pending'),
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
      {ORDER.map((id) => {
        const active = value === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            bg={active ? GREEN : '$white'}
            borderWidth={1}
            borderColor={active ? GREEN : '#E5E7EB'}
            borderRadius={9999}
            px="$3"
            py="$1.5"
            justifyContent="center"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t('parties.filter_aria')}
          >
            <Text
              size="sm"
              fontWeight="$semibold"
              color={active ? '$white' : '#6B7280'}
            >
              {labels[id]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
