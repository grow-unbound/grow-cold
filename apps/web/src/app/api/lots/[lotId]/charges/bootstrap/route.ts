import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { parseChargeNotes } from '@/lib/charge-notes';
import type { ChargesBootstrapResponse } from '@/lib/charges-api-schemas';
import {
  ChargesBootstrapMovementSchema,
  ChargesBootstrapResponseSchema,
} from '@/lib/charges-api-schemas';
import { chargeCodeIsTransport, defaultBagsForChargeCode, isoDateYYYYMMDD } from '@/lib/charges-defaults';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';
import { fetchStockMovementPaymentTypeId } from '@/lib/stock-movement-payment-type';

type RouteContext = { params: Promise<{ lotId: string }> };

interface ChargeRowBootstrap {
  charge_type_id: string;
  charge_type_code: string;
  display_name: string;
  product_charge_type_id: string;
  charges_per_bag: string | null;
  rate_per_bag: number | null;
  default_bags: number | null;
  is_transport: boolean;
  has_labor: boolean;
}

export async function GET(request: Request, context: RouteContext) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { lotId } = await context.params;
  const url = new URL(request.url);
  const movementParsed = ChargesBootstrapMovementSchema.safeParse(url.searchParams.get('movement'));
  const movement = movementParsed.success ? movementParsed.data : 'lodgement';
  const deliveryIdRaw = url.searchParams.get('deliveryId');
  const deliveryIdParam = deliveryIdRaw && deliveryIdRaw.length > 0 ? deliveryIdRaw : null;
  const forNewDelivery = url.searchParams.get('forNewDelivery') === '1';

  if (movement === 'delivery' && !deliveryIdParam && !forNewDelivery) {
    return NextResponse.json(
      { error: 'deliveryId required when movement is delivery', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  if (forNewDelivery && movement !== 'lodgement') {
    return NextResponse.json(
      { error: 'forNewDelivery requires movement=lodgement', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { data: lot, error: lotErr } = await supabase.from('lots').select('*').eq('id', lotId).maybeSingle();
  if (lotErr) {
    console.error(lotErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
  if (!lot) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const role = await getRoleForWarehouse(supabase, user.id, lot.warehouse_id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  if (role === 'STAFF' && !['ACTIVE', 'STALE'].includes(lot.status)) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  let charge_date = isoDateYYYYMMDD(lot.lodgement_date);
  let scopedDeliveryId: string | null = null;

  if (forNewDelivery) {
    charge_date = isoDateYYYYMMDD(new Date().toISOString());
    scopedDeliveryId = null;
  } else if (movement === 'delivery') {
    const { data: del, error: delErr } = await supabase
      .from('deliveries')
      .select('id, lot_id, delivery_date')
      .eq('id', deliveryIdParam!)
      .maybeSingle();
    if (delErr || !del || del.lot_id !== lotId) {
      return NextResponse.json({ error: 'Delivery not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    charge_date = isoDateYYYYMMDD(del.delivery_date);
    scopedDeliveryId = del.id;
  }

  const [{ data: party }, { data: deliveries }] = await Promise.all([
    supabase.from('customers').select('customer_code, customer_name').eq('id', lot.customer_id).single(),
    supabase
      .from('deliveries')
      .select('id, num_bags_out, delivery_date')
      .eq('lot_id', lotId)
      .order('delivery_date', { ascending: false }),
  ]);

  const { data: pcs, error: pcErr } = await supabase
    .from('product_charges')
    .select(
      `
      product_charge_type_id,
      charges_per_bag,
      charge_types!inner(id, tenant_id, code, display_name, is_active)
    `,
    )
    .eq('product_id', lot.product_id);

  if (pcErr) {
    console.error(pcErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const chargeRowsUnsorted: ChargeRowBootstrap[] = [];

  for (const row of pcs ?? []) {
    const ct = row.charge_types as unknown as {
      id: string;
      tenant_id: string;
      code: string;
      display_name: string;
      is_active: boolean;
    };
    if (!ct?.is_active || ct.tenant_id !== lot.tenant_id) continue;
    if (ct.code.trim().toUpperCase() === 'RENT') continue;

    const is_transport = chargeCodeIsTransport(ct.code);
    const defBags = defaultBagsForChargeCode(ct.code, lot.original_bags);
    const cpbRaw =
      typeof row.charges_per_bag === 'number' ? row.charges_per_bag : Number(row.charges_per_bag);
    const rate_per_bag =
      is_transport ? null :
      Number.isFinite(cpbRaw) && !Number.isNaN(cpbRaw)
        ? Math.round(Number(cpbRaw) * 10000) / 10000
        : null;

    chargeRowsUnsorted.push({
      charge_type_id: ct.id,
      charge_type_code: ct.code,
      display_name: ct.display_name,
      product_charge_type_id: row.product_charge_type_id,
      charges_per_bag: is_transport ? null : (rate_per_bag != null ? String(rate_per_bag) : null),
      rate_per_bag,
      default_bags: defBags,
      is_transport,
      has_labor: !is_transport,
    });
  }

  chargeRowsUnsorted.sort((a, b) => a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }));

  let existing: ChargesBootstrapResponse['data']['existing'] = [];

  if (forNewDelivery) {
    existing = [];
  } else {
    const paymentTypeId = await fetchStockMovementPaymentTypeId(supabase, lot.tenant_id);
    const laborByPct = new Map<
      string,
      { paid: number; method: 'CASH' | 'UPI' | 'OTHER' | null }
    >();

    if (paymentTypeId) {
      let opQ = supabase
        .from('operational_payments')
        .select('product_charge_type_id, amount, payment_method')
        .eq('lot_id', lotId)
        .eq('warehouse_id', lot.warehouse_id)
        .eq('payment_type_id', paymentTypeId)
        .eq('status', 'PAID');
      opQ =
        scopedDeliveryId == null ? opQ.is('delivery_id', null) : opQ.eq('delivery_id', scopedDeliveryId);
      const { data: ops, error: opErr } = await opQ;
      if (opErr) {
        console.error(opErr);
        return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
      }
      for (const o of ops ?? []) {
        if (!o.product_charge_type_id) continue;
        const meth = o.payment_method;
        laborByPct.set(o.product_charge_type_id, {
          paid: Number(o.amount),
          method: meth === 'CASH' || meth === 'UPI' || meth === 'OTHER' ? meth : null,
        });
      }
    }

    let txnQuery = supabase
      .from('transaction_charges')
      .select('id, product_charge_type_id, charge_amount, legacy_amount_paid, num_bags, notes')
      .eq('lot_id', lotId)
      .eq('charge_date', charge_date);

    txnQuery =
      scopedDeliveryId == null ? txnQuery.is('delivery_id', null) : txnQuery.eq('delivery_id', scopedDeliveryId);

    const { data: existingRows, error: exErr } = await txnQuery;
    if (exErr) {
      console.error(exErr);
      return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
    }

    const pctSet = new Set(chargeRowsUnsorted.map((r) => r.product_charge_type_id));
    const tcByPct = new Map(
      (existingRows ?? [])
        .filter((r) => pctSet.has(r.product_charge_type_id))
        .map((r) => [r.product_charge_type_id, r] as const),
    );

    const pushedPct = new Set<string>();

    for (const tpl of chargeRowsUnsorted) {
      const tc = tcByPct.get(tpl.product_charge_type_id);
      const lab = laborByPct.get(tpl.product_charge_type_id);
      let laborPaid = lab?.paid ?? 0;
      let labor_payment_method: 'CASH' | 'UPI' | 'OTHER' | null = lab?.method ?? null;

      if (laborPaid <= 0 && tc?.legacy_amount_paid != null && Number(tc.legacy_amount_paid) > 0) {
        laborPaid = Number(Number(tc.legacy_amount_paid).toFixed(2));
      }
      if (labor_payment_method == null && tc) {
        const parsed = parseChargeNotes(tc.notes);
        const m = parsed.labor_payment_method;
        if (m === 'CASH' || m === 'UPI' || m === 'OTHER') labor_payment_method = m;
      }

      const recv = tc ? Number(tc.charge_amount) : 0;
      const numBags = tc?.num_bags ?? (tpl.is_transport ? null : tpl.default_bags);
      const receivable_manual = tc ? parseChargeNotes(tc.notes).receivable_manual === true : false;

      if (tc || laborPaid > 0 || recv > 0) {
        existing.push({
          id: tc?.id ?? randomUUID(),
          product_charge_type_id: tpl.product_charge_type_id,
          charge_amount: recv,
          num_bags: numBags,
          legacy_amount_paid: laborPaid > 0 ? laborPaid : null,
          receivable_manual,
          labor_payment_method,
        });
        pushedPct.add(tpl.product_charge_type_id);
      }
    }

    for (const tpl of chargeRowsUnsorted) {
      if (pushedPct.has(tpl.product_charge_type_id)) continue;
      const lab = laborByPct.get(tpl.product_charge_type_id);
      if (!lab || lab.paid <= 0) continue;
      existing.push({
        id: randomUUID(),
        product_charge_type_id: tpl.product_charge_type_id,
        charge_amount: 0,
        num_bags: tpl.is_transport ? null : tpl.default_bags,
        legacy_amount_paid: lab.paid,
        receivable_manual: false,
        labor_payment_method: lab.method,
      });
    }
  }

  const payload: ChargesBootstrapResponse = {
    data: {
      lot: {
        id: lot.id,
        lot_number: lot.lot_number,
        lodgement_date: lot.lodgement_date,
        original_bags: lot.original_bags,
        balance_bags: lot.balance_bags,
        warehouse_id: lot.warehouse_id,
        customer_id: lot.customer_id,
      },
      party: {
        customer_code: party?.customer_code ?? '',
        customer_name: party?.customer_name ?? 'Unknown',
      },
      deliveries: (deliveries ?? []).map((d) => ({
        id: d.id,
        num_bags_out: d.num_bags_out,
        delivery_date: d.delivery_date,
      })),
      charge_rows: chargeRowsUnsorted,
      movement,
      charge_date,
      delivery_id: scopedDeliveryId,
      existing,
    },
  };

  const validated = ChargesBootstrapResponseSchema.safeParse(payload);
  if (!validated.success) {
    console.error(validated.error);
    return NextResponse.json({ error: 'Shape error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
  return NextResponse.json(validated.data);
}
