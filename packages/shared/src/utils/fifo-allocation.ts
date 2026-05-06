/** Outstanding row inputs must be sorted ascending by `sort_date`, then `line_kind`, then `line_id` (matches DB RPC order). */

export interface FifoOutstandingRow {
  line_kind: 'rent' | 'charge';
  line_id: string;
  sort_date: string;
  remaining_amount: number;
}

export interface FifoAppliedLine {
  line_kind: 'rent' | 'charge';
  line_id: string;
  rent_accrual_id?: string;
  charge_id?: string;
  applied: number;
}

/** Oldest-first FIFO until receipt amount is exhausted. Omits rows with zero applied. */
export function computeFifoAllocations(
  receiptAmount: number,
  outstandingSorted: FifoOutstandingRow[],
): FifoAppliedLine[] {
  if (!(receiptAmount > 0) || outstandingSorted.length === 0) {
    return [];
  }

  let remaining = receiptAmount;
  const out: FifoAppliedLine[] = [];

  for (const row of outstandingSorted) {
    if (remaining <= 0) break;
    const cap = row.remaining_amount;
    if (!(cap > 0)) continue;

    const applied = Math.min(cap, remaining);
    if (!(applied > 0)) continue;

    out.push({
      line_kind: row.line_kind,
      line_id: row.line_id,
      rent_accrual_id: row.line_kind === 'rent' ? row.line_id : undefined,
      charge_id: row.line_kind === 'charge' ? row.line_id : undefined,
      applied,
    });
    remaining -= applied;
  }

  return out;
}
