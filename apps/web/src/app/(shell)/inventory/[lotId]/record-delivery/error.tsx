'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function RecordDeliveryError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation('pages');
  const params = useParams();
  const lotId = typeof params.lotId === 'string' ? params.lotId : '';

  return (
    <div className="card w-full max-w-[560px]">
      <h2 className="text-lg font-semibold text-neutral-900">{t('error_load')}</h2>
      <p className="mt-2 text-body-sm text-danger-600">{error.message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary min-h-touch" onClick={reset}>
          {t('try_again')}
        </button>
        {lotId ? (
          <Link
            href={`/inventory/${lotId}`}
            className="btn-secondary inline-flex min-h-touch items-center justify-center rounded-base px-4"
          >
            {t('back')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
