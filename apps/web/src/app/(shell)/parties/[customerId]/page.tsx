'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PartyDetailsView } from '@/screens/PartyDetailsScreen/PartyDetailsView';
import { useSessionStore } from '@/stores/session-store';

export default function PartyDetailPage() {
  const { t } = useTranslation('pages');
  const params = useParams();
  const customerId = typeof params?.customerId === 'string' ? params.customerId : null;
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);

  if (!customerId) {
    return (
      <div className="card w-full max-w-3xl lg:max-w-5xl">
        <p className="text-body-sm text-danger-600">{t('error_load')}</p>
      </div>
    );
  }

  if (!warehouseId) {
    return (
      <div className="card w-full max-w-3xl lg:max-w-5xl">
        <p className="text-body-sm text-neutral-600">{t('select_warehouse')}</p>
      </div>
    );
  }

  return <PartyDetailsView warehouseId={warehouseId} customerId={customerId} />;
}
