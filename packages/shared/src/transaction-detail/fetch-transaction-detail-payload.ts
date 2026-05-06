import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../api/types';
import { formatMoneyTransactionDateTime } from '../format/date';
import type { TransactionDetailData, TransactionDetailKind } from './types';

type SB = SupabaseClient<Database>;

const EM = '\u2014';

function shortTxnId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/**
 * M0 field mapping (no `purpose` column):
 * - Receipt: purpose = reference_number (trimmed) or em dash; notes = notes or em dash
 * - Payment: if notes has a newline, first line = purpose, rest = notes; if single line, purpose = em dash, notes = full
 */
export function mapReceiptPurposeNotes(
  referenceNumber: string | null,
  notes: string | null,
): { purpose: string; notes: string } {
  const ref = referenceNumber?.trim() ?? '';
  const purpose = ref.length > 0 ? ref : EM;
  const n = notes?.trim() ?? '';
  return { purpose, notes: n.length > 0 ? n : EM };
}

function mapPaymentPurposeNotes(notes: string | null): { purpose: string; notes: string } {
  const raw = notes ?? '';
  if (!raw.trim()) return { purpose: EM, notes: EM };
  if (!raw.includes('\n')) return { purpose: EM, notes: raw.trim() };
  const lines = raw.split('\n');
  const first = (lines[0] ?? '').trim();
  const rest = lines
    .slice(1)
    .join('\n')
    .trim();
  return {
    purpose: first.length > 0 ? first : EM,
    notes: rest.length > 0 ? rest : EM,
  };
}

function recorderNameFromProfile(p: {
  display_name: string | null;
  email: string | null;
  phone: string;
}): string {
  const a = p.display_name?.trim();
  if (a) return a;
  const b = p.email?.trim();
  if (b) return b;
  return p.phone;
}

export async function fetchTransactionDetailPayload(
  client: SB,
  kind: TransactionDetailKind,
  id: string,
): Promise<TransactionDetailData | null> {
  if (kind === 'receipt') {
    const { data: r, error: re } = await client
      .from('customer_receipts')
      .select('id, created_at, total_amount, payment_method, notes, reference_number, recorded_by, customer_id')
      .eq('id', id)
      .maybeSingle();
    if (re) throw re;
    if (!r) return null;

    const [custRes, profRes] = await Promise.all([
      client
        .from('customers')
        .select('customer_name, customer_code')
        .eq('id', r.customer_id)
        .maybeSingle(),
      r.recorded_by
        ? client
            .from('user_profiles')
            .select('display_name, email, phone')
            .eq('id', r.recorded_by)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (custRes.error) throw custRes.error;
    if (profRes && 'error' in profRes && profRes.error) throw profRes.error;

    const customerName = custRes.data?.customer_name?.trim() ?? EM;
    const customerCode = custRes.data?.customer_code?.trim() ?? null;

    const ref = r.reference_number?.trim() ?? '';
    const headerRef = ref.length > 0 ? ref : shortTxnId(r.id);
    const { purpose, notes: notesOut } = mapReceiptPurposeNotes(r.reference_number, r.notes);

    const rec: string | null = r.recorded_by
      ? profRes.data
        ? recorderNameFromProfile(profRes.data)
        : EM
      : null;

    return {
      kind: 'receipt',
      id: r.id,
      headerReference: headerRef,
      amount: Number(r.total_amount),
      paymentMethod: r.payment_method,
      displayDateTime: formatMoneyTransactionDateTime(r.created_at),
      createdAt: r.created_at,
      customerOrRecipient: customerName,
      customerCode,
      recordedByName: rec,
      purposeText: purpose,
      notesText: notesOut,
      referenceNumber: r.reference_number,
      showAllocationPlaceholder: true,
    };
  }

  const { data: p, error: pe } = await client
    .from('warehouse_cash_payments')
    .select('id, created_at, total_amount, payment_method, notes, recorded_by, recipient_name')
    .eq('id', id)
    .maybeSingle();
  if (pe) throw pe;
  if (!p) return null;

  const profRes = p.recorded_by
    ? await client
        .from('user_profiles')
        .select('display_name, email, phone')
        .eq('id', p.recorded_by)
        .maybeSingle()
    : ({ data: null, error: null } as const);
  if (profRes.error) throw profRes.error;

  const { purpose, notes: notesOut } = mapPaymentPurposeNotes(p.notes);
  const rec: string | null = p.recorded_by
    ? profRes.data
      ? recorderNameFromProfile(profRes.data)
      : EM
    : null;

  return {
    kind: 'payment',
    id: p.id,
    headerReference: shortTxnId(p.id),
    amount: Number(p.total_amount),
    paymentMethod: p.payment_method,
    displayDateTime: formatMoneyTransactionDateTime(p.created_at),
    createdAt: p.created_at,
    customerOrRecipient: p.recipient_name?.trim() || EM,
    customerCode: null,
    recordedByName: rec,
    purposeText: purpose,
    notesText: notesOut,
    referenceNumber: null,
    showAllocationPlaceholder: false,
  };
}
