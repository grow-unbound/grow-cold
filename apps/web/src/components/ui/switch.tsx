'use client';

import { cn } from '@/lib/utils';

type SwitchProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

/** Controlled two-state toggle. 48px tap zone, brand-ui active state. */
export function Switch({ id, checked, onCheckedChange, disabled, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:shadow-focus',
        checked ? 'bg-brand-ui' : 'bg-border',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-fast',
          checked && 'translate-x-[1.35rem]',
        )}
        aria-hidden
      />
    </button>
  );
}
