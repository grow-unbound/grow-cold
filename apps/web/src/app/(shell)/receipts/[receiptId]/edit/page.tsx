import { AddReceiptFlow } from '@/components/receipts/add-receipt-flow';

export default async function EditReceiptPage({
  params,
}: {
  params: Promise<{ receiptId: string }>;
}) {
  const { receiptId } = await params;
  return <AddReceiptFlow mode="edit" receiptId={receiptId} />;
}
