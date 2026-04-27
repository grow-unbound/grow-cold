'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type StockMovementFilter = 'all' | 'lodgement' | 'delivery';

interface Props {
  value: StockMovementFilter;
  onChange: (v: StockMovementFilter) => void;
}

export function StockFilterChips({ value, onChange }: Props) {
  const { t } = useTranslation('pages');
  const chips: { id: StockMovementFilter; label: string }[] = [
    { id: 'all', label: t('stock.filter_all') },
    { id: 'lodgement', label: t('stock.filter_lodgements') },
    { id: 'delivery', label: t('stock.filter_deliveries') },
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t('stock.transactions')}
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
