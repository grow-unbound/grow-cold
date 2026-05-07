import { useTranslation } from 'react-i18next';
import { FilterChipRow } from '../../../components/FilterChipRow';

export type StockMovementFilter = 'all' | 'lodgement' | 'delivery';

interface Props {
  value: StockMovementFilter;
  onChange: (v: StockMovementFilter) => void;
}

export function FilterChips({ value, onChange }: Props) {
  const { t } = useTranslation('pages');
  return (
    <FilterChipRow
      value={value}
      onChange={onChange}
      options={[
        { id: 'all', label: t('stock.filter_all') },
        { id: 'lodgement', label: t('stock.filter_lodgements') },
        { id: 'delivery', label: t('stock.filter_deliveries') },
      ]}
    />
  );
}
