import { NextResponse } from 'next/server';
import { SaveChargesRequestSchema } from '@/lib/charges-api-schemas';
import { isoDateYYYYMMDD } from '@/lib/charges-defaults';
import { deleteAndInsertChargesForLotMovement } from '@/lib/lot-movement-charges-persist';
import { validateLotChargeRows } from '@/lib/validate-lot-charge-rows';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

type RouteContext = { params: Promise<{ lotId: string }> };

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsedBody = SaveChargesRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    const msg = parsedBody.error.issues[0]?.message ?? 'Validation failed';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { movement, delivery_id, charge_date: body_charge_date } = parsedBody.data;

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

  let expectedChargeDate = isoDateYYYYMMDD(lot.lodgement_date);
  if (movement === 'delivery') {
    if (!delivery_id) {
      return NextResponse.json(
        { error: 'delivery_id required for delivery movement', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const { data: del, error: delErr } = await supabase
      .from('deliveries')
      .select('id, lot_id, delivery_date')
      .eq('id', delivery_id)
      .maybeSingle();
    if (delErr || !del || del.lot_id !== lotId) {
      return NextResponse.json({ error: 'Delivery not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    expectedChargeDate = isoDateYYYYMMDD(del.delivery_date);
    if (body_charge_date !== expectedChargeDate) {
      return NextResponse.json({ error: 'charge_date mismatch', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
  } else {
    if (delivery_id != null) {
      return NextResponse.json(
        { error: 'delivery_id must be null for lodgement', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    if (body_charge_date !== expectedChargeDate) {
      return NextResponse.json({ error: 'charge_date mismatch', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
  }

  const validated = await validateLotChargeRows(supabase, lot, parsedBody.data.rows);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.message, code: validated.code },
      { status: validated.status },
    );
  }
  if (!validated.hasPositive) {
    return NextResponse.json({ error: 'No charges entered', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const laborPaymentDateYYYYMMDD = parsedBody.data.labor_payment_date ?? expectedChargeDate;

  const persist = await deleteAndInsertChargesForLotMovement({
    supabase,
    userId: user.id,
    lot,
    lotId,
    movement,
    deliveryId: movement === 'lodgement' ? null : delivery_id,
    chargeDateYYYYMMDD: expectedChargeDate,
    laborPaymentDateYYYYMMDD,
    rows: parsedBody.data.rows,
  });

  if (!('ok' in persist && persist.ok)) {
    const st = 'status' in persist && persist.status ? persist.status : 500;
    return NextResponse.json(
      { error: 'error' in persist ? persist.error : 'Persist failed', code: 'status' in persist ? persist.code : 'DB_ERROR' },
      { status: st },
    );
  }

  return NextResponse.json({ data: { ok: true }, error: null });
}
