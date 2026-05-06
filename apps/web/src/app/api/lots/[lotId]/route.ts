import {
  GetLotResponseSchema,
  UpdateLotRequestSchema,
  UpdateLotResponseSchema,
} from '@growcold/shared';
import type { Database } from '@growcold/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { assembleLotDetailRow } from '@/lib/lot-detail-assemble';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

type LotUpdate = Database['public']['Tables']['lots']['Update'];

type RouteContext = { params: Promise<{ lotId: string }> };

async function countDeliveriesForLot(supabase: SupabaseClient, lotId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('lot_id', lotId);
  if (error) {
    console.error(error);
    throw new Error('delivery_count_failed');
  }
  return (count ?? 0) > 0;
}

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

  const { data: lot, error } = await supabase.from('lots').select('*').eq('id', lotId).maybeSingle();
  if (error) {
    console.error(error);
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

  const row = await assembleLotDetailRow(supabase, lot);
  const out = GetLotResponseSchema.parse({ data: row });
  return NextResponse.json(out);
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const parsed = UpdateLotRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid body';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update', code: 'VALIDATION_ERROR' }, { status: 400 });
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
  if (!role || role === 'STAFF') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  let has_deliveries: boolean;
  try {
    has_deliveries = await countDeliveriesForLot(supabase, lotId);
  } catch {
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  if (has_deliveries) {
    if (updates.customer_id != null && updates.customer_id !== lot.customer_id) {
      return NextResponse.json(
        { error: 'Cannot change party when lot has deliveries', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    if (updates.product_id != null && updates.product_id !== lot.product_id) {
      return NextResponse.json(
        { error: 'Cannot change product when lot has deliveries', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
  }

  if (updates.lot_number != null && updates.lot_number !== lot.lot_number) {
    const { data: dup } = await supabase
      .from('lots')
      .select('id')
      .eq('warehouse_id', lot.warehouse_id)
      .eq('lot_number', updates.lot_number)
      .maybeSingle();
    if (dup) {
      return NextResponse.json(
        { error: 'Lot number already exists', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
  }

  if (updates.original_bags != null && updates.original_bags < lot.balance_bags) {
    return NextResponse.json(
      { error: 'Original bags cannot be less than remaining balance', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const patchRow: LotUpdate = {};
  if (updates.lot_number !== undefined) patchRow.lot_number = updates.lot_number;
  if (updates.location_ids !== undefined) patchRow.location_ids = updates.location_ids;
  if (updates.original_bags !== undefined) patchRow.original_bags = updates.original_bags;
  if (updates.customer_id !== undefined) patchRow.customer_id = updates.customer_id;
  if (updates.product_id !== undefined) patchRow.product_id = updates.product_id;
  if (updates.driver_name !== undefined) patchRow.driver_name = updates.driver_name;
  if (updates.vehicle_number !== undefined) patchRow.vehicle_number = updates.vehicle_number;
  if (updates.notes !== undefined) patchRow.notes = updates.notes;

  const { data: updated, error: updErr } = await supabase
    .from('lots')
    .update(patchRow)
    .eq('id', lotId)
    .select('*')
    .single();

  if (updErr || !updated) {
    console.error(updErr);
    return NextResponse.json({ error: 'Could not update lot', code: 'DB_ERROR' }, { status: 500 });
  }

  const row = await assembleLotDetailRow(supabase, updated);
  const out = UpdateLotResponseSchema.parse({ data: row });
  return NextResponse.json(out);
}
