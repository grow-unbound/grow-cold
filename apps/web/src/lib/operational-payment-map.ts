/** Maps DB row from operational_payments for shared Zod schemas. */
export function mapOperationalPaymentRow(r: Record<string, unknown>): Record<string, unknown> {
  const dateStr = (v: unknown) => (v == null ? null : String(v).slice(0, 10));
  const amt = r.amount as number | string;
  return {
    id: r.id,
    warehouse_id: r.warehouse_id,
    payment_type_id: r.payment_type_id,
    expenditure_head: r.expenditure_head,
    status: r.status,
    due_date: dateStr(r.due_date),
    payment_date: dateStr(r.payment_date),
    amount: amt,
    payment_method: r.payment_method,
    delivery_id: r.delivery_id,
    lot_id: r.lot_id,
    party_name: r.party_name,
    party_phone: r.party_phone,
    notes: r.notes,
    recorded_by: r.recorded_by,
    external_reference_id: r.external_reference_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
