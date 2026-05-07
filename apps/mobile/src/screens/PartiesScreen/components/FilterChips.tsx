import { useTranslation } from 'react-i18next';
import { FilterChipRow } from '../../../components/FilterChipRow';

export type PartiesListFilter = 'all' | 'active' | 'pending';

interface Props {
  value: PartiesListFilter;
  onChange: (v: PartiesListFilter) => void;
}

export function FilterChips({ value, onChange }: Props) {
  const { t } = useTranslation('pages');
  return (
    <FilterChipRow
      value={value}
      onChange={onChange}
      accessibilityLabel={t('parties.filter_aria')}
      options={[
        { id: 'all', label: t('parties.filter_all') },
        { id: 'active', label: t('parties.filter_active') },
        { id: 'pending', label: t('parties.filter_pending') },
      ]}
    />
  );
}
