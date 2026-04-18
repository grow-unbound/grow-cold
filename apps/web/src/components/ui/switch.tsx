'use client';

import { cn } from '@/lib/utils';

type SwitchProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

/** Small two-state toggle (controlled). */
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
        'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        checked ? 'bg-primary-500' : 'bg-neutral-300',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-[1.35rem]',
        )}
        aria-hidden
      />
    </button>
  );
}
