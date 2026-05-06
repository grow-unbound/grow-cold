import { useTranslation } from 'react-i18next';
import { FilterChipRow } from '../../../components/FilterChipRow';

export type MoneyMovementFilter = 'all' | 'receipt' | 'payment';

interface Props {
  value: MoneyMovementFilter;
  onChange: (v: MoneyMovementFilter) => void;
}

export function FilterChips({ value, onChange }: Props) {
  const { t } = useTranslation('pages');
  return (
    <FilterChipRow
      value={value}
      onChange={onChange}
      options={[
        { id: 'all', label: t('money.filter_all') },
        { id: 'receipt', label: t('money.filter_receipts') },
        { id: 'payment', label: t('money.filter_payments') },
      ]}
    />
  );
}
