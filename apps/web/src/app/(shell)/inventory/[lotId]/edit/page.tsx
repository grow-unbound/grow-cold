'use client';

import { useParams } from 'next/navigation';
import { LotFormScreen } from '../../_components/lot-form-screen';

export default function EditLotPage() {
  const params = useParams();
  const lotId = typeof params.lotId === 'string' ? params.lotId : '';
  if (!lotId) return null;
  return <LotFormScreen mode="edit" lotId={lotId} />;
}
