'use client';

import { useParams } from 'next/navigation';
import { AddChargesForm } from '@/components/inventory/add-charges-form';

export default function LotChargesPage() {
  const params = useParams();
  const lotId = typeof params.lotId === 'string' ? params.lotId : '';

  if (!lotId) {
    return null;
  }

  return <AddChargesForm lotId={lotId} />;
}
