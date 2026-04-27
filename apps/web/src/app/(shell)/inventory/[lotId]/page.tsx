'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLotDetail } from '@/lib/shell-queries';
import { LotDetailsView } from '@/screens/LotDetailsScreen/LotDetailsView';

export default function LotDetailPage() {
  const { t } = useTranslation('pages');
  const params = useParams();
  const lotId = typeof params.lotId === 'string' ? params.lotId : null;
  const q = useLotDetail(lotId);

  if (!lotId) {
    return null;
  }

  if (q.isPending) {
    return (
      <div className="card w-full max-w-4xl mx-auto">
        <p className="text-body-sm text-neutral-600">{t('loading')}</p>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="card w-full max-w-4xl mx-auto">
        <p className="text-danger-600 text-body-sm">{t('error_load')}</p>
        <Link href="/inventory" className="btn-secondary mt-2 inline-flex">
          {t('back')}
        </Link>
      </div>
    );
  }

  return (
    <LotDetailsView
      data={q.data.data}
      dataUpdatedAt={q.dataUpdatedAt}
      isOffline={typeof navigator !== 'undefined' ? !navigator.onLine : false}
    />
  );
}
