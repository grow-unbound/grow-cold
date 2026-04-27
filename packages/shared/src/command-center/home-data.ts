import { eachDayOfInterval, startOfDay } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../api/types';
import { toISODate } from './date-ranges';
import type { PeriodBounds } from './types';

type SB = SupabaseClient<Database>;

const LOT_STATUSES_SNAPSHOT = ['ACTIVE', 'STALE', 'DELIVERED'] as const;

/** Keep PostgREST `.in()` URLs under ~16KB (undici / Supabase limits). */
const IN_CHUNK = 100;

function chunkIds(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) out.push(ids.slice(i, i + IN_CHUNK));
  return out;
}

async function lotIdsForWarehouse(client: SB, warehouseId: string): Promise<string[]> {
  const { data, error } = await client.from('lots').select('id').eq('warehouse_id', warehouseId);
  if (error) throw error;
  return (data ?? []).map((r) => r.id);
}

async function fetchDeliveriesInRange(
  client: SB,
  lotIds: string[],
  from: string,
  to: string,
): Promise<{ id: string; lot_id: string; delivery_date: string; num_bags_out: number }[]> {
  if (lotIds.length === 0) return [];
  const rows: { id: string; lot_id: string; delivery_date: string; num_bags_out: number }[] = [];
  for (const part of chunkIds(lotIds)) {
    const { data, error } = await client
      .from('deliveries')
      .select('id, lot_id, delivery_date, num_bags_out')
      .in('lot_id', part)
      .gte('delivery_date', from)
      .lte('delivery_date', to);
    if (error) throw error;
    rows.push(...(data ?? []));
  }
  return rows;
}

async function fetchChargesForLots(
  client: SB,
  lotIds: string[],
  filter: { is_paid?: boolean; paid_date_eq?: string; paid_from?: string; paid_to?: string },
): Promise<{ charge_amount: number; is_paid: boolean; paid_date: string | null; lot_id: string }[]> {
  if (lotIds.length === 0) return [];
  const rows: { charge_amount: number; is_paid: boolean; paid_date: string | null; lot_id: string }[] =
    [];
  for (const part of chunkIds(lotIds)) {
    let q = client
      .from('transaction_charges')
      .select('charge_amount, is_paid, paid_date, lot_id')
      .in('lot_id', part);
    if (filter.is_paid !== undefined) q = q.eq('is_paid', filter.is_paid);
    if (filter.paid_date_eq) q = q.eq('paid_date', filter.paid_date_eq);
    if (filter.paid_from) q = q.gte('paid_date', filter.paid_from);
    if (filter.paid_to) q = q.lte('paid_date', filter.paid_to);
    const { data, error } = await q;
    if (error) throw error;
    for (const r of data ?? []) {
      rows.push({
        charge_amount: Number(r.charge_amount),
        is_paid: r.is_paid,
        paid_date: r.paid_date,
        lot_id: r.lot_id,
      });
    }
  }
  return rows;
}

export interface BusinessSnapshot {
  cashBalance: number;
  receivedToday: number;
  paidToday: number;
  totalBags: number;
  totalLots: number;
  staleLots: number;
}

export interface TodaysActivity {
  lodgementsCount: number;
  lodgementsBags: number;
  deliveriesCount: number;
  deliveriesBags: number;
  collectedAmount: number;
  collectedCustomerCount: number;
}

export type AlertNavTarget =
  | { kind: 'party'; customerId: string }
  | { kind: 'stock_stale' }
  | { kind: 'money_pending' };

export interface HomeAlert {
  id: string;
  message: string;
  nav: AlertNavTarget;
}

export interface StockPerformanceData {
  lodgedBags: number;
  lodgedLots: number;
  deliveredBags: number;
  deliveredLots: number;
  avgBagsPerDay: number;
  activeLotsCount: number;
  prevLodgedBags: number;
  prevDeliveredBags: number;
  prevLodgedLots: number;
  prevDeliveredLots: number;
  prevAvgBagsPerDay: number;
  prevActiveLots: number;
  series: { label: string; lodged: number; delivered: number }[];
}

export interface MoneyPerformanceData {
  collected: number;
  paidOut: number;
  net: number;
  avgPerDay: number;
  prevCollected: number;
  prevPaidOut: number;
  prevNet: number;
  prevAvgPerDay: number;
  series: { label: string; lodged: number; delivered: number }[];
}

export interface PartiesPerformanceData {
  collections: number;
  activeCustomers: number;
  newCustomers: number;
  paidInFull: number;
  prevCollections: number;
  prevActiveCustomers: number;
  prevNewCustomers: number;
  prevPaidInFull: number;
  series: { label: string; lodged: number; delivered: number }[];
}

function calendarDaysInBounds(b: PeriodBounds): number {
  const days = eachDayOfInterval({ start: startOfDay(b.start), end: startOfDay(b.end) });
  return Math.max(1, days.length);
}

export async function fetchBusinessSnapshot(
  client: SB,
  warehouseId: string,
  today: Date,
): Promise<BusinessSnapshot> {
  const todayStr = toISODate(today);
  const lotIds = await lotIdsForWarehouse(client, warehouseId);

  const [receiptsRes, lotsRes, staleRes, allPaidCharges, receiptsTodayRes, paidTodayCharges] =
    await Promise.all([
      client.from('customer_receipts').select('total_amount').eq('warehouse_id', warehouseId),
      client
        .from('lots')
        .select('id, balance_bags, status')
        .eq('warehouse_id', warehouseId)
        .in('status', [...LOT_STATUSES_SNAPSHOT]),
      client
        .from('lots')
        .select('id', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .eq('status', 'STALE'),
      fetchChargesForLots(client, lotIds, { is_paid: true }),
      client
        .from('customer_receipts')
        .select('total_amount')
        .eq('warehouse_id', warehouseId)
        .eq('receipt_date', todayStr),
      fetchChargesForLots(client, lotIds, { is_paid: true, paid_date_eq: todayStr }),
    ]);

  if (receiptsRes.error) throw receiptsRes.error;
  if (lotsRes.error) throw lotsRes.error;
  if (staleRes.error) throw staleRes.error;
  if (receiptsTodayRes.error) throw receiptsTodayRes.error;

  const receiptsSum = (receiptsRes.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const paidChargesSum = allPaidCharges.reduce((s, r) => s + r.charge_amount, 0);
  const totalBags = (lotsRes.data ?? []).reduce((s, l) => s + l.balance_bags, 0);
  const totalLots = lotsRes.data?.length ?? 0;
  const staleLots = staleRes.count ?? 0;

  const receivedToday = (receiptsTodayRes.data ?? []).reduce(
    (s, r) => s + Number(r.total_amount),
    0,
  );
  const paidToday = paidTodayCharges.reduce((s, r) => s + r.charge_amount, 0);

  return {
    cashBalance: receiptsSum - paidChargesSum,
    receivedToday,
    paidToday,
    totalBags,
    totalLots,
    staleLots,
  };
}

export async function fetchTodaysActivity(
  client: SB,
  warehouseId: string,
  today: Date,
): Promise<TodaysActivity> {
  const todayStr = toISODate(today);
  const lotIds = await lotIdsForWarehouse(client, warehouseId);

  const [lotsToday, deliveriesToday, recRes] = await Promise.all([
    client
      .from('lots')
      .select('id, original_bags')
      .eq('warehouse_id', warehouseId)
      .eq('lodgement_date', todayStr),
    fetchDeliveriesInRange(client, lotIds, todayStr, todayStr),
    client
      .from('customer_receipts')
      .select('total_amount, customer_id')
      .eq('warehouse_id', warehouseId)
      .eq('receipt_date', todayStr),
  ]);

  if (lotsToday.error) throw lotsToday.error;
  if (recRes.error) throw recRes.error;

  const lodgementsCount = lotsToday.data?.length ?? 0;
  const lodgementsBags = (lotsToday.data ?? []).reduce((s, l) => s + l.original_bags, 0);
  const deliveriesCount = deliveriesToday.length;
  const deliveriesBags = deliveriesToday.reduce((s, d) => s + d.num_bags_out, 0);
  const collectedAmount = (recRes.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const collectedCustomerCount = new Set((recRes.data ?? []).map((r) => r.customer_id)).size;

  return {
    lodgementsCount,
    lodgementsBags,
    deliveriesCount,
    deliveriesBags,
    collectedAmount,
    collectedCustomerCount,
  };
}

export async function fetchAlerts(client: SB, warehouseId: string, today: Date): Promise<HomeAlert[]> {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = toISODate(cutoff);
  const yearAgo = new Date(today);
  yearAgo.setDate(yearAgo.getDate() - 365);
  const yearAgoStr = toISODate(yearAgo);
  const lotIds = await lotIdsForWarehouse(client, warehouseId);

  const [oldLots, pendingCharges, overdueRentRes] = await Promise.all([
    client
      .from('lots')
      .select('id', { count: 'exact', head: true })
      .eq('warehouse_id', warehouseId)
      .in('status', ['ACTIVE', 'STALE'])
      .lt('lodgement_date', yearAgoStr),
    fetchChargesForLots(client, lotIds, { is_paid: false }),
    client
      .from('rent_accruals')
      .select('id, rental_amount, accrual_date, lot_id, lots!inner(warehouse_id)')
      .eq('is_paid', false)
      .lt('accrual_date', cutoffStr)
      .eq('lots.warehouse_id', warehouseId)
      .limit(200),
  ]);

  if (overdueRentRes.error) throw overdueRentRes.error;
  const overdueRent = { data: overdueRentRes.data ?? [] };
  if (oldLots.error) throw oldLots.error;

  const alerts: HomeAlert[] = [];
  const lotCustomer = new Map<string, string>();
  const overdueLotIds = [...new Set((overdueRent.data ?? []).map((r) => r.lot_id))];
  if (overdueLotIds.length > 0) {
    const { data: lotRows, error: le } = await client
      .from('lots')
      .select('id, customer_id')
      .in('id', overdueLotIds)
      .eq('warehouse_id', warehouseId);
    if (le) throw le;
    for (const l of lotRows ?? []) lotCustomer.set(l.id, l.customer_id);
  }

  const byCustomer = new Map<string, number>();
  for (const row of overdueRent.data ?? []) {
    const cid = lotCustomer.get(row.lot_id);
    if (!cid) continue;
    byCustomer.set(cid, (byCustomer.get(cid) ?? 0) + Number(row.rental_amount));
  }
  const topCustomers = [...byCustomer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  if (topCustomers.length > 0) {
    const ids = topCustomers.map(([id]) => id);
    const { data: names } = await client.from('customers').select('id, customer_name').in('id', ids);
    const nameBy = new Map((names ?? []).map((c) => [c.id, c.customer_name]));
    for (const [customerId, amt] of topCustomers) {
      alerts.push({
        id: `rent-${customerId}`,
        message: `${nameBy.get(customerId) ?? 'Customer'}: rent overdue · ${amt.toFixed(0)}`,
        nav: { kind: 'party', customerId },
      });
    }
  }

  const agedCount = oldLots.count ?? 0;
  if (agedCount > 0) {
    alerts.push({
      id: 'stale-aged',
      message: `${agedCount} lots aged over 1 year`,
      nav: { kind: 'stock_stale' },
    });
  }

  const pendingSum = pendingCharges.reduce((s, r) => s + r.charge_amount, 0);
  if (pendingSum > 0) {
    alerts.push({
      id: 'pending-charges',
      message: `₹${pendingSum.toFixed(0)} staff / hamali charges pending`,
      nav: { kind: 'money_pending' },
    });
  }

  return alerts.slice(0, 5);
}

async function fetchStockPeriod(
  client: SB,
  warehouseId: string,
  bounds: PeriodBounds,
  lotIds: string[],
): Promise<{
  lodgedBags: number;
  lodgedLots: number;
  deliveredBags: number;
  deliveredLots: number;
  lodgedByDay: Map<string, number>;
  deliveredByDay: Map<string, number>;
  activeLotIds: Set<string>;
}> {
  const from = toISODate(bounds.start);
  const to = toISODate(bounds.end);

  const { data: lotsRows, error: lotsErr } = await client
    .from('lots')
    .select('id, original_bags, lodgement_date')
    .eq('warehouse_id', warehouseId)
    .gte('lodgement_date', from)
    .lte('lodgement_date', to);
  if (lotsErr) throw lotsErr;

  const deliveries = await fetchDeliveriesInRange(client, lotIds, from, to);

  const lodgedByDay = new Map<string, number>();
  let lodgedBags = 0;
  const activeLotIds = new Set<string>();
  for (const l of lotsRows ?? []) {
    lodgedBags += l.original_bags;
    const d = l.lodgement_date;
    lodgedByDay.set(d, (lodgedByDay.get(d) ?? 0) + l.original_bags);
    activeLotIds.add(l.id);
  }
  const lodgedLots = lotsRows?.length ?? 0;

  const deliveredByDay = new Map<string, number>();
  let deliveredBags = 0;
  const deliveredLotIds = new Set<string>();
  for (const d of deliveries) {
    deliveredBags += d.num_bags_out;
    deliveredLotIds.add(d.lot_id);
    activeLotIds.add(d.lot_id);
    const day = d.delivery_date;
    deliveredByDay.set(day, (deliveredByDay.get(day) ?? 0) + d.num_bags_out);
  }
  const deliveredLots = deliveredLotIds.size;

  return {
    lodgedBags,
    lodgedLots,
    deliveredBags,
    deliveredLots,
    lodgedByDay,
    deliveredByDay,
    activeLotIds,
  };
}

export async function fetchStockPerformance(
  client: SB,
  warehouseId: string,
  current: PeriodBounds,
  previous: PeriodBounds,
): Promise<StockPerformanceData> {
  const lotIds = await lotIdsForWarehouse(client, warehouseId);
  const [cur, prev] = await Promise.all([
    fetchStockPeriod(client, warehouseId, current, lotIds),
    fetchStockPeriod(client, warehouseId, previous, lotIds),
  ]);

  const daysCur = calendarDaysInBounds(current);
  const daysPrev = calendarDaysInBounds(previous);
  const avgBagsPerDay = (cur.lodgedBags + cur.deliveredBags) / daysCur;
  const prevAvgBagsPerDay = (prev.lodgedBags + prev.deliveredBags) / daysPrev;

  const days = eachDayOfInterval({ start: startOfDay(current.start), end: startOfDay(current.end) });
  const series = days.map((day) => {
    const key = toISODate(day);
    return {
      label: key.slice(5),
      lodged: cur.lodgedByDay.get(key) ?? 0,
      delivered: cur.deliveredByDay.get(key) ?? 0,
    };
  });

  return {
    lodgedBags: cur.lodgedBags,
    lodgedLots: cur.lodgedLots,
    deliveredBags: cur.deliveredBags,
    deliveredLots: cur.deliveredLots,
    avgBagsPerDay,
    activeLotsCount: cur.activeLotIds.size,
    prevLodgedBags: prev.lodgedBags,
    prevDeliveredBags: prev.deliveredBags,
    prevLodgedLots: prev.lodgedLots,
    prevDeliveredLots: prev.deliveredLots,
    prevAvgBagsPerDay,
    prevActiveLots: prev.activeLotIds.size,
    series,
  };
}

async function fetchMoneyPeriod(
  client: SB,
  warehouseId: string,
  bounds: PeriodBounds,
  lotIds: string[],
): Promise<{ collected: number; paidOut: number }> {
  const from = toISODate(bounds.start);
  const to = toISODate(bounds.end);

  const [recRes, paidCharges] = await Promise.all([
    client
      .from('customer_receipts')
      .select('total_amount')
      .eq('warehouse_id', warehouseId)
      .gte('receipt_date', from)
      .lte('receipt_date', to),
    fetchChargesForLots(client, lotIds, { is_paid: true, paid_from: from, paid_to: to }),
  ]);

  if (recRes.error) throw recRes.error;

  const collected = (recRes.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const paidOut = paidCharges.reduce((s, r) => s + r.charge_amount, 0);
  return { collected, paidOut };
}

async function moneySeriesForPeriod(
  client: SB,
  warehouseId: string,
  lotIds: string[],
  bounds: PeriodBounds,
): Promise<{ label: string; lodged: number; delivered: number }[]> {
  const from = toISODate(bounds.start);
  const to = toISODate(bounds.end);
  const byDay = new Map<string, { lodged: number; delivered: number }>();

  const [recRes, paidCharges] = await Promise.all([
    client
      .from('customer_receipts')
      .select('receipt_date, total_amount')
      .eq('warehouse_id', warehouseId)
      .gte('receipt_date', from)
      .lte('receipt_date', to),
    fetchChargesForLots(client, lotIds, { is_paid: true, paid_from: from, paid_to: to }),
  ]);
  if (recRes.error) throw recRes.error;

  for (const r of recRes.data ?? []) {
    const d = r.receipt_date;
    const cur = byDay.get(d) ?? { lodged: 0, delivered: 0 };
    cur.lodged += Number(r.total_amount);
    byDay.set(d, cur);
  }
  for (const c of paidCharges) {
    const d = c.paid_date;
    if (!d) continue;
    const cur = byDay.get(d) ?? { lodged: 0, delivered: 0 };
    cur.delivered += c.charge_amount;
    byDay.set(d, cur);
  }

  const days = eachDayOfInterval({ start: startOfDay(bounds.start), end: startOfDay(bounds.end) });
  return days.map((day) => {
    const k = toISODate(day);
    const v = byDay.get(k) ?? { lodged: 0, delivered: 0 };
    return { label: k.slice(5), lodged: v.lodged, delivered: v.delivered };
  });
}

export async function fetchMoneyPerformance(
  client: SB,
  warehouseId: string,
  current: PeriodBounds,
  previous: PeriodBounds,
): Promise<MoneyPerformanceData> {
  const lotIds = await lotIdsForWarehouse(client, warehouseId);
  const [cur, prev, series] = await Promise.all([
    fetchMoneyPeriod(client, warehouseId, current, lotIds),
    fetchMoneyPeriod(client, warehouseId, previous, lotIds),
    moneySeriesForPeriod(client, warehouseId, lotIds, current),
  ]);
  const daysCur = calendarDaysInBounds(current);
  const daysPrev = calendarDaysInBounds(previous);
  const net = cur.collected - cur.paidOut;
  const prevNet = prev.collected - prev.paidOut;
  return {
    collected: cur.collected,
    paidOut: cur.paidOut,
    net,
    avgPerDay: net / daysCur,
    prevCollected: prev.collected,
    prevPaidOut: prev.paidOut,
    prevNet,
    prevAvgPerDay: prevNet / daysPrev,
    series,
  };
}

function paidInFullCount(
  lots: { customer_id: string; balance_bags: number }[],
  customerIds: Set<string>,
): number {
  const bagsByCustomer = new Map<string, number>();
  for (const l of lots) {
    bagsByCustomer.set(
      l.customer_id,
      (bagsByCustomer.get(l.customer_id) ?? 0) + l.balance_bags,
    );
  }
  let n = 0;
  for (const cid of customerIds) {
    if (!bagsByCustomer.has(cid)) continue;
    if ((bagsByCustomer.get(cid) ?? 0) === 0) n += 1;
  }
  return n;
}

export async function fetchPartiesPerformance(
  client: SB,
  warehouseId: string,
  current: PeriodBounds,
  previous: PeriodBounds,
): Promise<PartiesPerformanceData> {
  const cFrom = toISODate(current.start);
  const cTo = toISODate(current.end);
  const pFrom = toISODate(previous.start);
  const pTo = toISODate(previous.end);

  const [curRec, prevRec, lotsRes] = await Promise.all([
    client
      .from('customer_receipts')
      .select('customer_id, total_amount, receipt_date')
      .eq('warehouse_id', warehouseId)
      .gte('receipt_date', cFrom)
      .lte('receipt_date', cTo),
    client
      .from('customer_receipts')
      .select('customer_id, total_amount')
      .eq('warehouse_id', warehouseId)
      .gte('receipt_date', pFrom)
      .lte('receipt_date', pTo),
    client
      .from('lots')
      .select('id, customer_id, lodgement_date, balance_bags, status')
      .eq('warehouse_id', warehouseId),
  ]);

  if (curRec.error) throw curRec.error;
  if (prevRec.error) throw prevRec.error;
  if (lotsRes.error) throw lotsRes.error;

  const lots = lotsRes.data ?? [];

  const collections = (curRec.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const prevCollections = (prevRec.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0);

  const activeCurrent = new Set((curRec.data ?? []).map((r) => r.customer_id));
  for (const l of lots) {
    const ld = l.lodgement_date;
    if (ld >= cFrom && ld <= cTo) activeCurrent.add(l.customer_id);
  }
  const delCur = await fetchDeliveriesInRange(
    client,
    lots.map((l) => l.id),
    cFrom,
    cTo,
  );
  for (const d of delCur) {
    const lot = lots.find((x) => x.id === d.lot_id);
    if (lot) activeCurrent.add(lot.customer_id);
  }

  const activePrev = new Set((prevRec.data ?? []).map((r) => r.customer_id));
  for (const l of lots) {
    const ld = l.lodgement_date;
    if (ld >= pFrom && ld <= pTo) activePrev.add(l.customer_id);
  }
  const delPrev = await fetchDeliveriesInRange(
    client,
    lots.map((l) => l.id),
    pFrom,
    pTo,
  );
  for (const d of delPrev) {
    const lot = lots.find((x) => x.id === d.lot_id);
    if (lot) activePrev.add(lot.customer_id);
  }

  const custRows = await client.from('customers').select('id, created_at').eq('warehouse_id', warehouseId);
  if (custRows.error) throw custRows.error;
  let newCustomers = 0;
  let prevNewCustomers = 0;
  for (const c of custRows.data ?? []) {
    const cd = c.created_at.slice(0, 10);
    if (cd >= cFrom && cd <= cTo) newCustomers += 1;
    if (cd >= pFrom && cd <= pTo) prevNewCustomers += 1;
  }

  const paidInFull = paidInFullCount(lots, activeCurrent);
  const prevPaidInFull = paidInFullCount(lots, activePrev);

  const partyByDay = new Map<string, { lodged: number; delivered: number }>();
  for (const r of curRec.data ?? []) {
    const d = r.receipt_date;
    const cur = partyByDay.get(d) ?? { lodged: 0, delivered: 0 };
    cur.lodged += Number(r.total_amount);
    cur.delivered += 1;
    partyByDay.set(d, cur);
  }
  const partyDays = eachDayOfInterval({
    start: startOfDay(current.start),
    end: startOfDay(current.end),
  });
  const series = partyDays.map((day) => {
    const k = toISODate(day);
    const v = partyByDay.get(k) ?? { lodged: 0, delivered: 0 };
    return { label: k.slice(5), lodged: v.lodged, delivered: v.delivered };
  });

  return {
    collections,
    activeCustomers: activeCurrent.size,
    newCustomers,
    paidInFull,
    prevCollections,
    prevActiveCustomers: activePrev.size,
    prevNewCustomers,
    prevPaidInFull,
    series,
  };
}
