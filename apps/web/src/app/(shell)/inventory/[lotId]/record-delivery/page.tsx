'use client';

import { useParams } from 'next/navigation';
import { RecordDeliveryForm } from '@/components/inventory/record-delivery-form';

export default function RecordDeliveryPage() {
  const params = useParams();
  const lotId = typeof params.lotId === 'string' ? params.lotId : '';

  if (!lotId) {
    return null;
  }

  return <RecordDeliveryForm lotId={lotId} />;
}
