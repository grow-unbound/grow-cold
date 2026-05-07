'use client';

import type { HomeTimeFilter } from '@growcold/shared';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-wrap gap-2 py-2">
      {FILTERS.map((f) => {
        const active = value === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            aria-pressed={active}
            className={cn(
              'min-h-12 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-dashboard-lodged bg-dashboard-lodged text-white'
                : 'border-dashboard-lodged bg-transparent text-dashboard-lodged',
            )}
          >
            {label(f)}
          </button>
        );
      })}
    </div>
  );
}
