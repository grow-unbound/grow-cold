'use client';

import {
  type ClipboardEvent,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react';

type SixDigitOtpProps = {
  disabled?: boolean;
  onComplete: (code: string) => void;
};

export function SixDigitOtp({ disabled, onComplete }: SixDigitOtpProps) {
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: 6 }, () => ''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = useCallback((i: number) => {
    const el = inputsRef.current[i];
    if (el) el.focus();
  }, []);

  const emitIfComplete = useCallback(
    (next: string[]) => {
      const code = next.join('');
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        onComplete(code);
      }
    },
    [onComplete],
  );

  const setAt = (index: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      emitIfComplete(next);
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
      const next = Array.from({ length: 6 }, (_, i) => text[i] ?? '');
      emitIfComplete(next);
      return next;
    });
    focusAt(Math.min(text.length, 5));
  };

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
          className="h-11 w-9 rounded-base border border-neutral-200 text-center text-base font-semibold outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 sm:h-12 sm:w-10"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
