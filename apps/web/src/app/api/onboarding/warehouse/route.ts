import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { randomBytes } from 'node:crypto';

const BodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().max(200).optional(),
  capacity_bags: z.number().int().min(1).max(1_000_000).optional(),
});

async function uniqueWarehouseCode(admin: ReturnType<typeof createSupabaseAdminClient>): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const code = `W-${randomBytes(3).toString('hex').toUpperCase()}`;
    const { data } = await admin.from('warehouses').select('id').eq('warehouse_code', code).maybeSingle();
    if (!data) return code;
  }
  return `W-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 });
  }

  const routeClient = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: userErr,
  } = await routeClient.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const { data: roleRow, error: roleErr } = await admin
    .from('user_roles')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleErr || !roleRow?.tenant_id) {
    return NextResponse.json({ error: 'No tenant for user' }, { status: 403 });
  }

  if (roleRow.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only owners can create the first warehouse' }, { status: 403 });
  }

  const { name, location, capacity_bags } = parsed.data;
  const warehouse_code = await uniqueWarehouseCode(admin);

  const { data: warehouse, error: whErr } = await admin
    .from('warehouses')
    .insert({
      tenant_id: roleRow.tenant_id,
      warehouse_name: name,
      warehouse_code,
      city: location ?? null,
      state: null,
      capacity_bags: capacity_bags ?? 10_000,
    })
    .select('id, warehouse_name')
    .single();

  if (whErr || !warehouse) {
    console.error(whErr);
    return NextResponse.json({ error: 'Could not create warehouse' }, { status: 500 });
  }

  const { error: assignErr } = await admin.from('user_warehouse_assignments').insert({
    user_id: user.id,
    warehouse_id: warehouse.id,
  });

  if (assignErr) {
    console.error(assignErr);
    await admin.from('warehouses').delete().eq('id', warehouse.id);
    return NextResponse.json({ error: 'Could not assign warehouse' }, { status: 500 });
  }

  const { error: settingsErr } = await admin.from('warehouse_settings').insert({
    warehouse_id: warehouse.id,
    tenant_id: roleRow.tenant_id,
  });

  if (settingsErr) {
    console.error(settingsErr);
  }

  return NextResponse.json({
    warehouse_id: warehouse.id,
    name: warehouse.warehouse_name,
    message: 'Warehouse created',
  });
}
