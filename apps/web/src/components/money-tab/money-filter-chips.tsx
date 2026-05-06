'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type MoneyMovementFilter = 'all' | 'receipt' | 'payment';

interface Props {
  value: MoneyMovementFilter;
  onChange: (v: MoneyMovementFilter) => void;
}

export function MoneyFilterChips({ value, onChange }: Props) {
  const { t } = useTranslation('pages');
  const chips: { id: MoneyMovementFilter; label: string }[] = [
    { id: 'all', label: t('money.filter_all') },
    { id: 'receipt', label: t('money.filter_receipts') },
    { id: 'payment', label: t('money.filter_payments') },
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t('money.transactions')}
    >
      {chips.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c.id)}
            className={cn(active ? 'chip-active' : 'chip-inactive')}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
