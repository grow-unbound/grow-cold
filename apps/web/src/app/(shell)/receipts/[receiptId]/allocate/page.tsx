import { ReceiptAllocatePageClient } from '@/components/receipts/receipt-allocate-page';

export default async function AllocateReceiptPage({
  params,
}: {
  params: Promise<{ receiptId: string }>;
}) {
  const { receiptId } = await params;
  return <ReceiptAllocatePageClient receiptId={receiptId} />;
}
