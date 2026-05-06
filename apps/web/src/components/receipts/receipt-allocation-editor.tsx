'use client';

import {
  computeFifoAllocations,
  formatINR,
  outstandingAllocatableRowSchema,
  type OutstandingAllocatableRow,
} from '@growcold/shared';
import { Coins, Package, Truck, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfirmReceiptAllocation, useOutstandingAllocatable } from '@/lib/shell-queries';
import { cn } from '@/lib/utils';

interface ReceiptAllocationEditorProps {
  warehouseId: string;
  receiptId: string;
  customerId: string;
  customerName: string;
  receiptAmount: number;
  layout: 'cards' | 'rows';
  showSyncNote?: boolean;
  onConfirmed?: () => void;
}

interface LineState {
  line_kind: 'rent' | 'charge';
  line_id: string;
  rent_accrual_id?: string;
  charge_id?: string;
  remaining: number;
  applied: number;
  meta: OutstandingAllocatableRow;
}

function iconForRow(row: OutstandingAllocatableRow) {
  if (row.line_kind === 'rent') return Package;
  const code = row.charge_type_code?.toUpperCase() ?? '';
  if (code.includes('TRANSPORT')) return Truck;
  if (
    code.includes('HAMALI') ||
    code.includes('COOLIE') ||
    code.includes('MAMULLE') ||
    code.includes('PLATFORM')
  ) {
    return User;
  }
  return Coins;
}

function buildBaseLines(rows: OutstandingAllocatableRow[], receiptAmount: number): LineState[] {
  const fifoInputs = rows.map((row) => ({
    line_kind: row.line_kind,
    line_id: row.line_id,
    sort_date: row.sort_date,
    remaining_amount: Number(row.remaining_amount),
  }));
  const fifo = computeFifoAllocations(receiptAmount, fifoInputs);
  const metaById = new Map(rows.map((r) => [r.line_id, outstandingAllocatableRowSchema.parse(r)]));
  const next: LineState[] = [];
  for (const f of fifo) {
    const rawMeta = metaById.get(f.line_id);
    if (!rawMeta) continue;
    const metaParsed = outstandingAllocatableRowSchema.parse(rawMeta);
    next.push({
      line_kind: f.line_kind,
      line_id: f.line_id,
      rent_accrual_id: f.rent_accrual_id,
      charge_id: f.charge_id,
      remaining: Number(metaParsed.remaining_amount),
      applied: f.applied,
      meta: metaParsed,
    });
  }
  return next;
}

interface AllocationFifoBodyProps {
  layout: 'cards' | 'rows';
  receiptAmount: number;
  baseLines: LineState[];
  confirmMutate: (body: {
    lines: {
      rent_accrual_id?: string;
      charge_id?: string;
      amount: string;
    }[];
  }) => Promise<unknown>;
  isConfirmPending: boolean;
  onConfirmed?: () => void;
}

function AllocationFifoBody({
  layout,
  receiptAmount,
  baseLines,
  confirmMutate,
  isConfirmPending,
  onConfirmed,
}: AllocationFifoBodyProps) {
  const { t } = useTranslation('pages');
  const [lines, setLines] = useState<LineState[]>(() => baseLines);

  const lastIndex = lines.length > 0 ? lines.length - 1 : -1;

  const totalApplied = useMemo(() => lines.reduce((s, l) => s + l.applied, 0), [lines]);
  const credit = Math.max(0, receiptAmount - totalApplied);
  const over = totalApplied - receiptAmount > 0.009;

  function handleLastAppliedChange(raw: string): void {
    if (lastIndex < 0) return;
    const cleaned = raw.replace(/,/g, '').trim();
    const num = Number.parseFloat(cleaned);
    if (!Number.isFinite(num)) return;

    const sumExceptLast = lines.slice(0, lastIndex).reduce((s, l) => s + l.applied, 0);
    const last = lines[lastIndex];
    const maxByReceipt = receiptAmount - sumExceptLast;
    const maxApplied = Math.min(last.remaining, maxByReceipt);
    const clamped = Math.min(Math.max(0, num), maxApplied);

    setLines((prev) => {
      const copy = [...prev];
      copy[lastIndex] = { ...copy[lastIndex], applied: Math.round(clamped * 100) / 100 };
      return copy;
    });
  }

  async function handleConfirm(): Promise<void> {
    if (over) return;
    if (lastIndex >= 0) {
      const last = lines[lastIndex];
      if (last.applied <= 0 || last.applied > last.remaining + 0.009) {
        toast.error(t('receipts.partial_invalid'));
        return;
      }
    }

    const payloadLines = lines
      .filter((l) => l.applied > 0)
      .map((l) => ({
        rent_accrual_id: l.line_kind === 'rent' ? l.line_id : undefined,
        charge_id: l.line_kind === 'charge' ? l.line_id : undefined,
        amount: String(Math.round(l.applied * 100) / 100),
      }));

    try {
      await confirmMutate({ lines: payloadLines });
      toast.success(t('receipts.confirm_toast'));
      onConfirmed?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('save_error'));
    }
  }

  return (
    <>
      <ul
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-2',
          layout === 'rows' && 'gap-1',
        )}
      >
        {lines.map((line, idx) => {
          const Icon = iconForRow(line.meta);
          const full = idx !== lastIndex || line.applied >= line.remaining - 0.009;
          const editable = idx === lastIndex && lines.length > 0;

          const inner = (
            <>
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-base',
                  full ? 'bg-inward-bg text-inward' : 'bg-pending-bg text-pending',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {line.meta.lot_number}
                </p>
                <p className="truncate text-caption text-text-secondary">
                  {line.meta.line_label} · {line.meta.display_period}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-caption text-text-tertiary">{t('receipts.due_label')}</p>
                <p className="text-body-sm text-text-secondary">{formatINR(line.remaining)}</p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    full ? 'text-inward' : 'text-pending',
                  )}
                >
                  {t('receipts.applied_label')}{' '}
                  {editable ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={t('receipts.applied_label')}
                      className="input-base ml-1 inline-block w-28 py-1 text-right"
                      value={line.applied === 0 ? '' : String(line.applied)}
                      onChange={(e) => handleLastAppliedChange(e.target.value)}
                    />
                  ) : (
                    formatINR(line.applied)
                  )}
                  {full ? ' ✓' : null}
                </p>
              </div>
            </>
          );

          if (layout === 'cards') {
            return (
              <li key={line.line_id} className="card rounded-base border border-border p-3">
                <div className="flex flex-row items-start gap-3">{inner}</div>
              </li>
            );
          }

          return (
            <li
              key={line.line_id}
              className="flex flex-row items-center gap-3 border-b border-border py-2 last:border-b-0"
            >
              {inner}
            </li>
          );
        })}
      </ul>

      <div
        className={cn(
          'mt-auto space-y-2 border-t border-border pt-3',
          over && 'rounded-base bg-outward-bg px-2 py-2',
        )}
      >
        <div className="flex justify-between text-body-sm">
          <span className="text-text-secondary">{t('receipts.applied_total')}</span>
          <span className={cn('font-semibold', over && 'text-outward')}>
            {formatINR(totalApplied)}
          </span>
        </div>
        <div className="flex justify-between text-body-sm">
          <span className="text-text-secondary">{t('receipts.credit_total')}</span>
          <span
            className={cn('font-semibold', credit > 0 ? 'text-pending' : 'text-text-primary')}
          >
            {formatINR(credit)}
          </span>
        </div>
        {credit > 0 ? (
          <p className="text-caption text-pending">{t('receipts.credit_unapplied_help')}</p>
        ) : null}
        {over ? (
          <p className="text-caption text-outward">{t('receipts.over_allocation')}</p>
        ) : null}

        <Button
          type="button"
          className="btn-primary mt-2 min-h-touch w-full"
          disabled={isConfirmPending || over || !(receiptAmount > 0)}
          onClick={() => void handleConfirm()}
        >
          {t('receipts.confirm_allocation')}
        </Button>
      </div>
    </>
  );
}

export function ReceiptAllocationEditor(props: ReceiptAllocationEditorProps) {
  const {
    warehouseId,
    receiptId,
    customerId,
    customerName,
    receiptAmount,
    layout,
    showSyncNote,
    onConfirmed,
  } = props;
  const { t } = useTranslation('pages');
  const outstandingQ = useOutstandingAllocatable(warehouseId, customerId);
  const confirmM = useConfirmReceiptAllocation(warehouseId, receiptId);

  async function confirmCreditOnly(): Promise<void> {
    try {
      await confirmM.mutateAsync({ lines: [] });
      toast.success(t('receipts.confirm_toast'));
      onConfirmed?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('save_error'));
    }
  }

  const rows = useMemo(() => {
    const raw = outstandingQ.data?.data ?? [];
    return raw.map((r) => outstandingAllocatableRowSchema.parse(r));
  }, [outstandingQ.data]);
  const baseLines = useMemo(() => buildBaseLines(rows, receiptAmount), [rows, receiptAmount]);

  const fifoBodyKey = useMemo(
    () =>
      `${receiptAmount}-${baseLines.map((l) => `${l.line_id}:${l.applied.toFixed(2)}`).join(';')}`,
    [receiptAmount, baseLines],
  );

  const emptyOutstanding = !outstandingQ.isPending && rows.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="min-w-0">
        <p className="text-label font-semibold text-text-primary">{customerName}</p>
        {showSyncNote ? (
          <p className="text-caption text-text-tertiary">{t('receipts.accruals_sync_note')}</p>
        ) : null}
      </div>

      {outstandingQ.isPending ? (
        <p className="text-body-sm text-text-secondary">{t('loading')}</p>
      ) : null}
      {outstandingQ.isError ? (
        <p className="text-body-sm text-outward">{t('error_load')}</p>
      ) : null}

      {emptyOutstanding ? (
        <div className="card rounded-base border border-border bg-surface-subtle p-3">
          <p className="text-body-sm text-text-secondary">{t('receipts.no_outstanding')}</p>
          <p className="mt-2 text-sm font-semibold text-text-primary">
            {formatINR(receiptAmount)} → {t('receipts.credit_total')}
          </p>
        </div>
      ) : (
        <AllocationFifoBody
          key={fifoBodyKey}
          layout={layout}
          receiptAmount={receiptAmount}
          baseLines={baseLines}
          confirmMutate={confirmM.mutateAsync}
          isConfirmPending={confirmM.isPending}
          onConfirmed={onConfirmed}
        />
      )}

      {emptyOutstanding ? (
        <div className="mt-auto border-t border-border pt-3">
          <Button
            type="button"
            className="btn-primary min-h-touch w-full"
            disabled={confirmM.isPending || !(receiptAmount > 0)}
            onClick={() => void confirmCreditOnly()}
          >
            {t('receipts.confirm_allocation')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
