'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ReceiptAllocationEditor } from '@/components/receipts/receipt-allocation-editor';
import { Button } from '@/components/ui/button';
import { useReceiptDetail } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';

export function ReceiptAllocatePageClient({ receiptId }: { receiptId: string }) {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const receiptQ = useReceiptDetail(receiptId);

  const row = receiptQ.data?.data;
  const amount = row ? Number.parseFloat(row.total_amount) : 0;

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-text-secondary">{t('select_warehouse')}</p>
      </div>
    );
  }

  if (receiptQ.isPending) {
    return <p className="text-body-sm text-text-secondary">{t('receipts.loading_receipt')}</p>;
  }

  if (receiptQ.isError || !row) {
    return (
      <div className="card border-outward-border p-4">
        <p className="text-body-sm text-outward">{t('error_load')}</p>
        <Button type="button" variant="secondary" className="mt-3 min-h-touch" asChild>
          <Link href="/transactions">{t('back')}</Link>
        </Button>
      </div>
    );
  }

  if (row.allocation_confirmed_at) {
    return (
      <div className="card p-4">
        <p className="text-body-sm text-text-primary">{t('receipts.cannot_edit_confirmed')}</p>
        <Button type="button" className="btn-primary mt-3 min-h-touch" asChild>
          <Link href="/transactions">{t('transactions.title')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 pb-36">
      <header className="flex items-start gap-2">
        <Button type="button" variant="ghost" className="min-h-touch shrink-0 px-2" asChild>
          <Link href="/transactions">{t('back')}</Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="h2">{t('receipts.allocate_title')}</h1>
          <p className="text-caption text-text-secondary">{row.customer_name}</p>
        </div>
      </header>

      <ReceiptAllocationEditor
        warehouseId={warehouseId}
        receiptId={receiptId}
        customerId={row.customer_id}
        customerName={row.customer_name}
        receiptAmount={amount}
        layout="cards"
        showSyncNote
        onConfirmed={() => router.push('/transactions')}
      />
    </div>
  );
}
