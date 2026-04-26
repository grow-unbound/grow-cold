'use client';

import { useCallback, useId } from 'react';

export type IndiaPhoneFieldProps = {
  id?: string;
  label: string;
  /** Up to 10 national digits (no +91). */
  value: string;
  onChange: (nationalDigits: string) => void;
  disabled?: boolean;
  errorMessage?: string | null;
  placeholder?: string;
};

function formatDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function IndiaPhoneField({
  id: idProp,
  label,
  value,
  onChange,
  disabled,
  errorMessage,
  placeholder,
}: IndiaPhoneFieldProps) {
  const autoId = useId();
  const id = idProp ?? `phone-in-${autoId}`;

  const onInputChange = useCallback(
    (raw: string) => {
      const d = raw.replace(/\D/g, '').slice(0, 10);
      onChange(d);
    },
    [onChange],
  );

  return (
    <div className="form-field">
      <label htmlFor={id} className="text-label-lg font-semibold text-neutral-700">
        {label}
      </label>
      <div
        className={`flex min-h-touch w-full min-w-0 items-stretch overflow-hidden rounded-base border-2 bg-white transition-[border-color,box-shadow] focus-within:border-primary-500 focus-within:ring-0 focus-within:shadow-focus disabled:opacity-50 ${
          errorMessage ? 'border-danger-500' : 'border-neutral-200'
        }`}
      >
        <span
          className="inline-flex shrink-0 items-center border-r-2 border-neutral-200 bg-neutral-50 px-3 text-base font-medium text-neutral-700"
          aria-hidden
        >
          +91
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-touch min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-base text-neutral-900 outline-none ring-0 placeholder:text-neutral-400"
          value={formatDisplay(value)}
          onChange={(e) => onInputChange(e.target.value)}
        />
      </div>
      {errorMessage ? (
        <p className="error-text" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
