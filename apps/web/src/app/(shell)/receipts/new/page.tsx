import { AddReceiptFlow } from '@/components/receipts/add-receipt-flow';

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const sp = await searchParams;
  return <AddReceiptFlow lockedCustomerId={sp.customerId ?? null} mode="create" />;
}
