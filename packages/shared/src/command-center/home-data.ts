import { eachDayOfInterval, startOfDay } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CommandCenterActivityResponseSchema,
  CommandCenterAlertsResponseSchema,
  CommandCenterHomeResponseSchema,
  CommandCenterSnapshotResponseSchema,
  type CommandCenterHomeResponse,
} from '../api/endpoints/command-center';
import type { Database } from '../api/types';
import { toISODate } from './date-ranges';
import type { PeriodBounds } from './types';

type SB = SupabaseClient<Database>;

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

async function activeLotsNearEndOfPeriod(
  client: SB,
  warehouseId: string,
  periodEnd: Date,
): Promise<number> {
  const d = toISODate(periodEnd);
  const { data: dayRow } = await client
    .from('daily_stock_summary')
    .select('active_lots_eod')
    .eq('warehouse_id', warehouseId)
    .eq('summary_date', d)
    .maybeSingle();
  if (dayRow?.active_lots_eod !== undefined && dayRow.active_lots_eod !== null) {
    return dayRow.active_lots_eod;
  }
  const { data: snap } = await client
    .from('warehouse_snapshot')
    .select('active_lots')
    .eq('warehouse_id', warehouseId)
    .maybeSingle();
  return snap?.active_lots ?? 0;
}

export async function fetchBusinessSnapshot(
  client: SB,
  warehouseId: string,
  _today: Date,
): Promise<BusinessSnapshot> {
  const { data, error } = await client
    .from('warehouse_snapshot')
    .select(
      'cash_balance, today_receipts, today_payments, total_bags, total_lots, stale_lots',
    )
    .eq('warehouse_id', warehouseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      cashBalance: 0,
      receivedToday: 0,
      paidToday: 0,
      totalBags: 0,
      totalLots: 0,
      staleLots: 0,
    };
  }
  return {
    cashBalance: Number(data.cash_balance),
    receivedToday: Number(data.today_receipts),
    paidToday: Number(data.today_payments),
    totalBags: data.total_bags,
    totalLots: data.total_lots,
    staleLots: data.stale_lots,
  };
}

export async function fetchTodaysActivity(
  client: SB,
  warehouseId: string,
  today: Date,
): Promise<TodaysActivity> {
  const day = toISODate(today);
  const [stockRes, moneyRes] = await Promise.all([
    client
      .from('stock_events')
      .select('event_type, num_bags')
      .eq('warehouse_id', warehouseId)
      .eq('event_date', day),
    client
      .from('money_events')
      .select('event_type, amount, customer_id')
      .eq('warehouse_id', warehouseId)
      .eq('event_date', day),
  ]);
  if (stockRes.error) throw stockRes.error;
  if (moneyRes.error) throw moneyRes.error;

  let lodgementsCount = 0;
  let lodgementsBags = 0;
  let deliveriesCount = 0;
  let deliveriesBags = 0;
  for (const r of stockRes.data ?? []) {
    const n = r.num_bags ?? 0;
    if (r.event_type === 'LODGEMENT') {
      lodgementsCount += 1;
      lodgementsBags += n;
    } else if (r.event_type === 'DELIVERY') {
      deliveriesCount += 1;
      deliveriesBags += n;
    }
  }

  let collectedAmount = 0;
  const receiptCustomers = new Set<string>();
  for (const r of moneyRes.data ?? []) {
    if (r.event_type === 'RECEIPT' && r.amount != null) {
      collectedAmount += Number(r.amount);
      if (r.customer_id) receiptCustomers.add(r.customer_id);
    }
  }

  return {
    lodgementsCount,
    lodgementsBags,
    deliveriesCount,
    deliveriesBags,
    collectedAmount,
    collectedCustomerCount: receiptCustomers.size,
  };
}

export async function fetchAlerts(client: SB, warehouseId: string, _today: Date): Promise<HomeAlert[]> {
  const { data: ws, error: wsErr } = await client
    .from('warehouse_snapshot')
    .select('lots_aged_365_plus, pending_payables')
    .eq('warehouse_id', warehouseId)
    .maybeSingle();
  if (wsErr) throw wsErr;

  const alerts: HomeAlert[] = [];

  const { data: rentRows, error: rentErr } = await client
    .from('customer_summary')
    .select('customer_id, outstanding_rents, customers(customer_name)')
    .eq('warehouse_id', warehouseId)
    .gt('outstanding_rents', 0)
    .order('outstanding_rents', { ascending: false })
    .limit(3);
  if (rentErr) throw rentErr;

  type RentRow = {
    customer_id: string;
    outstanding_rents: number;
    customers: { customer_name: string } | null;
  };
  for (const row of (rentRows ?? []) as RentRow[]) {
    const name = row.customers?.customer_name ?? 'Customer';
    alerts.push({
      id: `rent-${row.customer_id}`,
      message: `${name}: rent overdue · ${Number(row.outstanding_rents).toFixed(0)}`,
      nav: { kind: 'party', customerId: row.customer_id },
    });
  }

  const aged = ws?.lots_aged_365_plus ?? 0;
  if (aged > 0) {
    alerts.push({
      id: 'stale-aged',
      message: `${aged} lots aged over 1 year`,
      nav: { kind: 'stock_stale' },
    });
  }

  const pending = Number(ws?.pending_payables ?? 0);
  if (pending > 0) {
    alerts.push({
      id: 'pending-payables',
      message: `₹${pending.toFixed(0)} operational payables pending`,
      nav: { kind: 'money_pending' },
    });
  }

  return alerts.slice(0, 5);
}

type DailyStockRow = {
  summary_date: string;
  lodged_bags: number;
  lodged_lots: number;
  delivered_bags: number;
  delivered_lots: number;
};

async function aggregateDailyStock(
  client: SB,
  warehouseId: string,
  bounds: PeriodBounds,
): Promise<{
  lodgedBags: number;
  lodgedLots: number;
  deliveredBags: number;
  deliveredLots: number;
  lodgedByDay: Map<string, number>;
  deliveredByDay: Map<string, number>;
}> {
  const from = toISODate(bounds.start);
  const to = toISODate(bounds.end);
  const { data, error } = await client
    .from('daily_stock_summary')
    .select('summary_date, lodged_bags, lodged_lots, delivered_bags, delivered_lots')
    .eq('warehouse_id', warehouseId)
    .gte('summary_date', from)
    .lte('summary_date', to);
  if (error) throw error;
  const rows = (data ?? []) as DailyStockRow[];
  let lodgedBags = 0;
  let lodgedLots = 0;
  let deliveredBags = 0;
  let deliveredLots = 0;
  const lodgedByDay = new Map<string, number>();
  const deliveredByDay = new Map<string, number>();
  for (const row of rows) {
    lodgedBags += row.lodged_bags;
    lodgedLots += row.lodged_lots;
    deliveredBags += row.delivered_bags;
    deliveredLots += row.delivered_lots;
    lodgedByDay.set(row.summary_date, (lodgedByDay.get(row.summary_date) ?? 0) + row.lodged_bags);
    deliveredByDay.set(row.summary_date, (deliveredByDay.get(row.summary_date) ?? 0) + row.delivered_bags);
  }
  return { lodgedBags, lodgedLots, deliveredBags, deliveredLots, lodgedByDay, deliveredByDay };
}

export async function fetchStockPerformance(
  client: SB,
  warehouseId: string,
  current: PeriodBounds,
  previous: PeriodBounds,
): Promise<StockPerformanceData> {
  const [curAgg, prevAgg, curAct, prevAct] = await Promise.all([
    aggregateDailyStock(client, warehouseId, current),
    aggregateDailyStock(client, warehouseId, previous),
    activeLotsNearEndOfPeriod(client, warehouseId, current.end),
    activeLotsNearEndOfPeriod(client, warehouseId, previous.end),
  ]);

  const daysCur = calendarDaysInBounds(current);
  const daysPrev = calendarDaysInBounds(previous);
  const avgBagsPerDay = (curAgg.lodgedBags + curAgg.deliveredBags) / daysCur;
  const prevAvgBagsPerDay = (prevAgg.lodgedBags + prevAgg.deliveredBags) / daysPrev;

  const days = eachDayOfInterval({
    start: startOfDay(current.start),
    end: startOfDay(current.end),
  });
  const series = days.map((day) => {
    const key = toISODate(day);
    return {
      label: key.slice(5),
      lodged: curAgg.lodgedByDay.get(key) ?? 0,
      delivered: curAgg.deliveredByDay.get(key) ?? 0,
    };
  });

  return {
    lodgedBags: curAgg.lodgedBags,
    lodgedLots: curAgg.lodgedLots,
    deliveredBags: curAgg.deliveredBags,
    deliveredLots: curAgg.deliveredLots,
    avgBagsPerDay,
    activeLotsCount: curAct,
    prevLodgedBags: prevAgg.lodgedBags,
    prevDeliveredBags: prevAgg.deliveredBags,
    prevLodgedLots: prevAgg.lodgedLots,
    prevDeliveredLots: prevAgg.deliveredLots,
    prevAvgBagsPerDay,
    prevActiveLots: prevAct,
    series,
  };
}

type DailyMoneyRow = {
  summary_date: string;
  receipts_amount: number;
  payments_amount: number;
  net_amount: number | null;
};

async function aggregateDailyMoney(
  client: SB,
  warehouseId: string,
  bounds: PeriodBounds,
): Promise<{ collected: number; paidOut: number; byDay: Map<string, { rec: number; pay: number }> }> {
  const from = toISODate(bounds.start);
  const to = toISODate(bounds.end);
  const { data, error } = await client
    .from('daily_money_summary')
    .select('summary_date, receipts_amount, payments_amount, net_amount')
    .eq('warehouse_id', warehouseId)
    .gte('summary_date', from)
    .lte('summary_date', to);
  if (error) throw error;
  const rows = (data ?? []) as DailyMoneyRow[];
  let collected = 0;
  let paidOut = 0;
  const byDay = new Map<string, { rec: number; pay: number }>();
  for (const row of rows) {
    collected += Number(row.receipts_amount);
    paidOut += Number(row.payments_amount);
    const cur = byDay.get(row.summary_date) ?? { rec: 0, pay: 0 };
    cur.rec += Number(row.receipts_amount);
    cur.pay += Number(row.payments_amount);
    byDay.set(row.summary_date, cur);
  }
  return { collected, paidOut, byDay };
}

export async function fetchMoneyPerformance(
  client: SB,
  warehouseId: string,
  current: PeriodBounds,
  previous: PeriodBounds,
): Promise<MoneyPerformanceData> {
  const [cur, prev] = await Promise.all([
    aggregateDailyMoney(client, warehouseId, current),
    aggregateDailyMoney(client, warehouseId, previous),
  ]);

  const daysCur = calendarDaysInBounds(current);
  const daysPrev = calendarDaysInBounds(previous);
  const net = cur.collected - cur.paidOut;
  const prevNet = prev.collected - prev.paidOut;

  const days = eachDayOfInterval({
    start: startOfDay(current.start),
    end: startOfDay(current.end),
  });
  const series = days.map((day) => {
    const key = toISODate(day);
    const v = cur.byDay.get(key) ?? { rec: 0, pay: 0 };
    return { label: key.slice(5), lodged: v.rec, delivered: v.pay };
  });

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

  const [curMoney, prevMoney, curAct, prevAct, newCur, newPrev, paidCur, paidPrev] =
    await Promise.all([
      aggregateDailyMoney(client, warehouseId, current),
      aggregateDailyMoney(client, warehouseId, previous),
      client
        .from('customer_summary')
        .select('customer_id', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .gte('last_activity_date', cFrom)
        .lte('last_activity_date', cTo),
      client
        .from('customer_summary')
        .select('customer_id', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .gte('last_activity_date', pFrom)
        .lte('last_activity_date', pTo),
      client
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .gte('created_at', `${cFrom}T00:00:00`)
        .lte('created_at', `${cTo}T23:59:59.999Z`),
      client
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .gte('created_at', `${pFrom}T00:00:00`)
        .lte('created_at', `${pTo}T23:59:59.999Z`),
      client
        .from('customer_summary')
        .select('customer_id', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .lte('outstanding_total', 0)
        .eq('active_lot_count', 0)
        .gte('last_activity_date', cFrom)
        .lte('last_activity_date', cTo),
      client
        .from('customer_summary')
        .select('customer_id', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .lte('outstanding_total', 0)
        .eq('active_lot_count', 0)
        .gte('last_activity_date', pFrom)
        .lte('last_activity_date', pTo),
    ]);

  if (curAct.error) throw curAct.error;
  if (prevAct.error) throw prevAct.error;
  if (newCur.error) throw newCur.error;
  if (newPrev.error) throw newPrev.error;
  if (paidCur.error) throw paidCur.error;
  if (paidPrev.error) throw paidPrev.error;

  const partyDays = eachDayOfInterval({
    start: startOfDay(current.start),
    end: startOfDay(current.end),
  });
  const series = partyDays.map((day) => {
    const key = toISODate(day);
    const v = curMoney.byDay.get(key) ?? { rec: 0, pay: 0 };
    return { label: key.slice(5), lodged: v.rec, delivered: v.pay };
  });

  return {
    collections: curMoney.collected,
    activeCustomers: curAct.count ?? 0,
    newCustomers: newCur.count ?? 0,
    paidInFull: paidCur.count ?? 0,
    prevCollections: prevMoney.collected,
    prevActiveCustomers: prevAct.count ?? 0,
    prevNewCustomers: newPrev.count ?? 0,
    prevPaidInFull: paidPrev.count ?? 0,
    series,
  };
}

export async function fetchCommandCenterHome(
  client: SB,
  warehouseId: string,
  today: Date,
): Promise<CommandCenterHomeResponse> {
  const [snapshot, activity, alerts] = await Promise.all([
    fetchBusinessSnapshot(client, warehouseId, today),
    fetchTodaysActivity(client, warehouseId, today),
    fetchAlerts(client, warehouseId, today),
  ]);
  return CommandCenterHomeResponseSchema.parse({
    snapshot: CommandCenterSnapshotResponseSchema.parse(snapshot),
    activity: CommandCenterActivityResponseSchema.parse(activity),
    alerts: CommandCenterAlertsResponseSchema.parse(alerts),
  });
}
