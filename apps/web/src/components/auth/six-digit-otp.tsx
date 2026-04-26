'use client';

import {
  type ClipboardEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type SixDigitOtpProps = {
  disabled?: boolean;
  /** Current 6-digit code (may be partial). Fires on every change. */
  onChange?: (code: string) => void;
  /** When the 6th digit completes a valid code, fires once per distinct code until cleared. */
  onComplete?: (code: string) => void;
  /** When true, inputs show error styling (e.g. after failed verify). */
  error?: boolean;
};

export function SixDigitOtp({ disabled, onChange, onComplete, error }: SixDigitOtpProps) {
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: 6 }, () => ''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const lastCompleteEmittedRef = useRef('');

  const focusAt = useCallback((i: number) => {
    const el = inputsRef.current[i];
    if (el) el.focus();
  }, []);

  useEffect(() => {
    onChangeRef.current?.(digits.join(''));
  }, [digits]);

  useEffect(() => {
    const code = digits.join('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      lastCompleteEmittedRef.current = '';
      return;
    }
    if (lastCompleteEmittedRef.current === code) return;
    lastCompleteEmittedRef.current = code;
    onCompleteRef.current?.(code);
  }, [digits]);

  const setAt = (index: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < 5) focusAt(index + 1);
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        focusAt(index - 1);
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      focusAt(index - 1);
      e.preventDefault();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      focusAt(index + 1);
      e.preventDefault();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 0) return;
    e.preventDefault();
    setDigits(() => {
      return Array.from({ length: 6 }, (_, i) => text[i] ?? '');
    });
    focusAt(Math.min(text.length, 5));
  };

  const borderClass = error
    ? 'border-danger-500 focus:border-danger-500 focus:ring-1'
    : 'border-neutral-200 focus:border-primary-500 focus:ring-1';

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2" role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={i === 0}
          maxLength={1}
          disabled={disabled}
          value={d}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={i === 0 ? onPaste : undefined}
          className={`h-touch w-9 rounded-lg border-2 text-center text-base font-semibold outline-none ring-primary-500 sm:w-10 ${borderClass}`}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
