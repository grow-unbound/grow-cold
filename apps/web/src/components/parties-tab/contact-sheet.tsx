'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  code: string;
  phoneDigits: string;
}

function waLink(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.length === 0) return '';
  const intl = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${intl}`;
}

export function ContactSheet({ open, onClose, code, phoneDigits }: Props) {
  const { t } = useTranslation('pages');
  if (!open) return null;
  const tel = `tel:${phoneDigits.replace(/\D/g, '')}`;
  const wa = waLink(phoneDigits);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-3"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-labelledby="contact-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 id="contact-title" className="text-lg font-semibold text-neutral-900">
            {t('parties.contact_title', { code })}
          </h2>
          <p className="text-sm text-neutral-600">{phoneDigits}</p>
        </div>
        <div className="flex flex-col gap-1 p-2">
          <a
            href={tel}
            className={cn('flex min-h-touch items-center rounded-lg px-3 py-3 text-base font-medium text-cyan-700')}
            onClick={onClose}
          >
            {t('parties.call')}
          </a>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-touch items-center rounded-lg px-3 py-3 text-base font-medium text-cyan-700"
              onClick={onClose}
            >
              {t('parties.whatsapp')}
            </a>
          ) : null}
          <button type="button" className="min-h-touch rounded-lg px-3 py-3 text-left text-base text-neutral-700" onClick={onClose}>
            {t('parties.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
