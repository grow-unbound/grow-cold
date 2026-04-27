import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../api/types';
import { mapReceiptPurposeNotes } from '../transaction-detail/fetch-transaction-detail-payload';
import { computeStorageStatus } from '../lot-detail/status';
import { partyDetailDataSchema, type PartyDetailData } from './schemas';

type SB = SupabaseClient<Database>;

/** Keep PostgREST `.in()` URLs under ~16KB (undici / Supabase limits). */
const IN_CHUNK = 100;

function chunkIds(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) out.push(ids.slice(i, i + IN_CHUNK));
  return out;
}

function maxIsoDate(...candidates: (string | null | undefined)[]): string | null {
  const xs = candidates.filter((x): x is string => typeof x === 'string' && x.length > 0);
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => (a >= b ? a : b));
}

export interface FetchPartyDetailOptions {
  receiptsLimit?: number;
  receiptsOffset?: number;
}

/**
 * Full Party (customer) detail: summary receivables, lots, paginated receipts.
 * Uses the same eligible-lot rules as parties tab (excludes WRITTEN_OFF).
 */
export async function fetchPartyDetail(
  client: SB,
  warehouseId: string,
  customerId: string,
  options: FetchPartyDetailOptions = {},
): Promise<PartyDetailData | null> {
  const receiptsLimit = options.receiptsLimit ?? 50;
  const receiptsOffset = options.receiptsOffset ?? 0;
  const receiptsTake = receiptsLimit + 1;

  const { data: customer, error: ce } = await client
    .from('customers')
    .select('id, warehouse_id, customer_code, customer_name, phone, mobile, address')
    .eq('id', customerId)
    .maybeSingle();
  if (ce) throw ce;
  if (!customer || customer.warehouse_id !== warehouseId) return null;

  const { data: lotRows, error: le } = await client
    .from('lots')
    .select('id, lot_number, lodgement_date, original_bags, balance_bags, status, product_id')
    .eq('warehouse_id', warehouseId)
    .eq('customer_id', customerId)
    .neq('status', 'WRITTEN_OFF');
  if (le) throw le;
  const lots = lotRows ?? [];
  const lotIds = lots.map((l) => l.id);

  const productIds = [...new Set(lots.map((l) => l.product_id))];
  const productNameById = new Map<string, string>();
  if (productIds.length > 0) {
    for (const part of chunkIds(productIds)) {
      const { data: prows, error: pe } = await client
        .from('products')
        .select('id, product_name')
        .in('id', part);
      if (pe) throw pe;
      for (const p of prows ?? []) {
        productNameById.set(p.id, p.product_name);
      }
    }
  }

  let rents = 0;
  let charges = 0;
  if (lotIds.length > 0) {
    for (const part of chunkIds(lotIds)) {
      const [raRes, tcRes] = await Promise.all([
        client.from('rent_accruals').select('rental_amount').in('lot_id', part).eq('is_paid', false),
        client.from('transaction_charges').select('charge_amount').in('lot_id', part).eq('is_paid', false),
      ]);
      if (raRes.error) throw raRes.error;
      if (tcRes.error) throw tcRes.error;
      for (const r of raRes.data ?? []) rents += Number(r.rental_amount);
      for (const r of tcRes.data ?? []) charges += Number(r.charge_amount);
    }
  }

  const others = 0;
  const outstanding = rents + charges + others;

  let currentStockBags = 0;
  let activeLotCount = 0;
  for (const l of lots) {
    if (l.balance_bags > 0) {
      currentStockBags += l.balance_bags;
      activeLotCount += 1;
    }
  }

  let maxLodge: string | null = null;
  for (const l of lots) {
    maxLodge = maxIsoDate(maxLodge, l.lodgement_date);
  }

  let maxDel: string | null = null;
  if (lotIds.length > 0) {
    for (const part of chunkIds(lotIds)) {
      const { data: drows, error: de } = await client
        .from('deliveries')
        .select('delivery_date')
        .in('lot_id', part);
      if (de) throw de;
      for (const d of drows ?? []) {
        maxDel = maxIsoDate(maxDel, d.delivery_date);
      }
    }
  }

  const { data: lastRecRow, error: re } = await client
    .from('customer_receipts')
    .select('receipt_date')
    .eq('warehouse_id', warehouseId)
    .eq('customer_id', customerId)
    .order('receipt_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (re) throw re;

  const lastActivityDate = maxIsoDate(maxLodge, maxDel, lastRecRow?.receipt_date ?? null);

  const lotNumberById = new Map(lots.map((l) => [l.id, l.lot_number]));

  const lotDetailRows = [...lots]
    .sort((a, b) => b.lodgement_date.localeCompare(a.lodgement_date))
    .map((l) => {
      const product_name = productNameById.get(l.product_id) ?? '';
      const delivered_bags = Math.max(0, l.original_bags - l.balance_bags);
      const { status, daysSinceLodgement } = computeStorageStatus(l.lodgement_date, l.balance_bags);
      return {
        lotId: l.id,
        lot_number: l.lot_number,
        product_name,
        original_bags: l.original_bags,
        delivered_bags,
        balance_bags: l.balance_bags,
        ageDays: daysSinceLodgement,
        storageStatus: status,
      };
    });

  const { data: receiptPage, error: rpe } = await client
    .from('customer_receipts')
    .select('id, receipt_date, total_amount, payment_method, notes, reference_number')
    .eq('warehouse_id', warehouseId)
    .eq('customer_id', customerId)
    .order('receipt_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(receiptsOffset, receiptsOffset + receiptsTake - 1);
  if (rpe) throw rpe;
  const receiptSlice = receiptPage ?? [];
  const receiptsHasMore = receiptSlice.length > receiptsLimit;
  const receiptsTrimmed = receiptsHasMore ? receiptSlice.slice(0, receiptsLimit) : receiptSlice;
  const receiptIds = receiptsTrimmed.map((r) => r.id);

  const lotNumbersByReceipt = new Map<string, Set<string>>();
  for (const id of receiptIds) lotNumbersByReceipt.set(id, new Set());

  if (receiptIds.length > 0) {
    for (const part of chunkIds(receiptIds)) {
      const { data: allocs, error: ae } = await client
        .from('receipt_allocations')
        .select('receipt_id, rent_accrual_id, charge_id')
        .in('receipt_id', part);
      if (ae) throw ae;
      const rentIds = [...new Set((allocs ?? []).map((a) => a.rent_accrual_id).filter(Boolean))] as string[];
      const chargeIds = [...new Set((allocs ?? []).map((a) => a.charge_id).filter(Boolean))] as string[];

      const lotByRentAcc = new Map<string, string>();
      for (const rp of chunkIds(rentIds)) {
        const { data: ras, error: rae } = await client.from('rent_accruals').select('id, lot_id').in('id', rp);
        if (rae) throw rae;
        for (const row of ras ?? []) lotByRentAcc.set(row.id, row.lot_id);
      }
      const lotByCharge = new Map<string, string>();
      for (const cp of chunkIds(chargeIds)) {
        const { data: crs, error: cre } = await client.from('transaction_charges').select('id, lot_id').in('id', cp);
        if (cre) throw cre;
        for (const row of crs ?? []) lotByCharge.set(row.id, row.lot_id);
      }

      for (const a of allocs ?? []) {
        const set = lotNumbersByReceipt.get(a.receipt_id);
        if (!set) continue;
        let lotId: string | null = null;
        if (a.rent_accrual_id) lotId = lotByRentAcc.get(a.rent_accrual_id) ?? null;
        else if (a.charge_id) lotId = lotByCharge.get(a.charge_id) ?? null;
        if (lotId) {
          const num = lotNumberById.get(lotId);
          if (num) set.add(num);
        }
      }
    }
  }

  const receiptDetailRows = receiptsTrimmed.map((r) => {
    const { purpose } = mapReceiptPurposeNotes(r.reference_number, r.notes);
    const nums = [...(lotNumbersByReceipt.get(r.id) ?? [])].sort();
    return {
      id: r.id,
      receipt_date: r.receipt_date,
      amount: Number(r.total_amount),
      purpose,
      lotNumbers: nums,
      payment_method: r.payment_method,
    };
  });

  const summaryUpdatedAt = new Date().toISOString();

  return partyDetailDataSchema.parse({
    customerId: customer.id,
    customerCode: customer.customer_code,
    customerName: customer.customer_name,
    phone: customer.phone,
    mobile: customer.mobile,
    address: customer.address,
    currentStockBags,
    activeLotCount,
    outstanding,
    rents,
    charges,
    others,
    lastActivityDate,
    summaryUpdatedAt,
    lots: lotDetailRows,
    receipts: receiptDetailRows,
    receiptsHasMore,
  });
}
