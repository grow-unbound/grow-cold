import { NextResponse } from 'next/server';
import {
  RecordDeliveryRequestSchema,
  RecordDeliveryResponseSchema,
} from '@growcold/shared';
import type { Database } from '@growcold/shared';
import { LotDeliveriesResponseSchema } from '@/lib/charges-api-schemas';
import { todayInBusinessTimezone } from '@/lib/business-date';
import { assembleLotDetailRow } from '@/lib/lot-detail-assemble';
import { deleteAndInsertChargesForLotMovement } from '@/lib/lot-movement-charges-persist';
import { validateLotChargeRows } from '@/lib/validate-lot-charge-rows';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

type RouteContext = { params: Promise<{ lotId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { lotId } = await context.params;
  const { data: lot, error: lotErr } = await supabase.from('lots').select('*').eq('id', lotId).maybeSingle();
  if (lotErr) {
    console.error(lotErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
  if (!lot) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const role = await getRoleForWarehouse(supabase, user.id, lot.warehouse_id);
  if (!role) return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  if (role === 'STAFF' && !['ACTIVE', 'STALE'].includes(lot.status)) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const { data: deliveries, error: dErr } = await supabase
    .from('deliveries')
    .select('id, num_bags_out, delivery_date')
    .eq('lot_id', lotId)
    .order('delivery_date', { ascending: false });

  if (dErr) {
    console.error(dErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const payload = LotDeliveriesResponseSchema.parse({ data: { deliveries: deliveries ?? [] } });
  return NextResponse.json(payload);
}

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { lotId } = await context.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = RecordDeliveryRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Validation failed';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const body = parsed.data;

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

  if (body.warehouse_id !== lot.warehouse_id) {
    return NextResponse.json({ error: 'warehouse_id mismatch', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const lotLoc = new Set(lot.location_ids ?? []);
  if (lotLoc.size === 0) {
    return NextResponse.json({ error: 'Lot has no locations', code: 'VALIDATION_ERROR' }, { status: 400 });
  }
  if (!body.location_ids.every((id) => lotLoc.has(id))) {
    return NextResponse.json(
      { error: 'Locations must be a subset of the lot locations', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  if (lot.balance_bags <= 0 || body.num_bags_out > lot.balance_bags) {
    return NextResponse.json({ error: 'Invalid bags out', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const deliveryDateYYYYMMDD = body.delivery_date ?? todayInBusinessTimezone();

  type ChargeVal = Awaited<ReturnType<typeof validateLotChargeRows>>;
  let chargeValidated: ChargeVal | null = null;
  if (body.charge_rows && body.charge_rows.length > 0) {
    chargeValidated = await validateLotChargeRows(supabase, lot, body.charge_rows, {
      maxBagsNonTransport: body.num_bags_out,
    });
    if (!chargeValidated.ok) {
      return NextResponse.json(
        { error: chargeValidated.message, code: chargeValidated.code },
        { status: chargeValidated.status },
      );
    }
  }

  const { data: insertedDel, error: insDelErr } = await supabase
    .from('deliveries')
    .insert({
      lot_id: lotId,
      delivery_date: deliveryDateYYYYMMDD,
      num_bags_out: body.num_bags_out,
      location_ids: body.location_ids,
      notes: body.notes ?? null,
      status: 'DELIVERED',
    })
    .select('id')
    .single();

  if (insDelErr || !insertedDel) {
    console.error(insDelErr);
    return NextResponse.json({ error: 'Could not create delivery', code: 'DB_ERROR' }, { status: 500 });
  }

  const deliveryId = insertedDel.id;

  const newBal = lot.balance_bags - body.num_bags_out;
  const lotUpdate: Database['public']['Tables']['lots']['Update'] = { balance_bags: newBal };
  if (newBal <= 0) {
    lotUpdate.status = 'DELIVERED';
  }

  const { data: updatedLot, error: updLotErr } = await supabase
    .from('lots')
    .update(lotUpdate)
    .eq('id', lotId)
    .select('*')
    .single();

  if (updLotErr || !updatedLot) {
    console.error(updLotErr);
    await supabase.from('deliveries').delete().eq('id', deliveryId);
    return NextResponse.json({ error: 'Could not update lot', code: 'DB_ERROR' }, { status: 500 });
  }

  const lotStateBeforeUpdate = { balance_bags: lot.balance_bags, status: lot.status };
  async function rollbackLotAndDelivery() {
    await supabase.from('lots').update(lotStateBeforeUpdate).eq('id', lotId);
    await supabase.from('deliveries').delete().eq('id', deliveryId);
  }

  const laborPayDate =
    body.labor_payment_date ?? deliveryDateYYYYMMDD;

  if (chargeValidated?.ok === true && chargeValidated.hasPositive) {
    const persist = await deleteAndInsertChargesForLotMovement({
      supabase,
      userId: user.id,
      lot,
      lotId,
      movement: 'delivery',
      deliveryId,
      chargeDateYYYYMMDD: deliveryDateYYYYMMDD,
      laborPaymentDateYYYYMMDD: laborPayDate,
      rows: body.charge_rows!,
    });
    if (!('ok' in persist && persist.ok)) {
      await rollbackLotAndDelivery();
      const st = 'status' in persist && persist.status ? persist.status : 500;
      return NextResponse.json(
        {
          error: 'error' in persist ? persist.error : 'Charges persist failed',
          code: 'status' in persist ? persist.code : 'DB_ERROR',
        },
        { status: st },
      );
    }
  }

  const detail = await assembleLotDetailRow(supabase, updatedLot);
  const outPayload = RecordDeliveryResponseSchema.parse({
    data: { delivery_id: deliveryId, lot: detail },
  });

  return NextResponse.json(outPayload);
}
