'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type PartiesListFilter = 'all' | 'active' | 'pending';

interface Props {
  value: PartiesListFilter;
  onChange: (v: PartiesListFilter) => void;
}

export function PartiesFilterChips({ value, onChange }: Props) {
  const { t } = useTranslation('pages');
  const chips: { id: PartiesListFilter; label: string }[] = [
    { id: 'all', label: t('parties.filter_all') },
    { id: 'active', label: t('parties.filter_active') },
    { id: 'pending', label: t('parties.filter_pending') },
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t('parties.filter_aria')}
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
