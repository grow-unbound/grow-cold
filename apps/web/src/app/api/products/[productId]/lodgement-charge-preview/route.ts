import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
  ChargesBootstrapRowSchema,
  type ChargesBootstrapResponse,
} from '@/lib/charges-api-schemas';
import { chargeCodeIsTransport, defaultBagsForChargeCode } from '@/lib/charges-defaults';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

type RouteContext = { params: Promise<{ productId: string }> };

const QuerySchema = z.object({
  warehouseId: z.string().uuid(),
  originalBags: z.coerce.number().int().positive().default(1),
});

interface ChargeRowPreview {
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

  const { productId } = await context.params;
  const url = new URL(request.url);
  const parsedQ = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsedQ.success) {
    const msg = parsedQ.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { warehouseId, originalBags } = parsedQ.data;
  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const { data: wh, error: whErr } = await supabase
    .from('warehouses')
    .select('tenant_id')
    .eq('id', warehouseId)
    .maybeSingle();
  if (whErr || !wh) {
    console.error(whErr);
    return NextResponse.json({ error: 'Warehouse not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const { data: pcs, error: pcErr } = await supabase
    .from('product_charges')
    .select(
      `
      product_charge_type_id,
      charges_per_bag,
      charge_types!inner(id, tenant_id, code, display_name, is_active)
    `,
    )
    .eq('product_id', productId);

  if (pcErr) {
    console.error(pcErr);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const chargeRowsUnsorted: ChargeRowPreview[] = [];

  for (const row of pcs ?? []) {
    const ct = row.charge_types as unknown as {
      id: string;
      tenant_id: string;
      code: string;
      display_name: string;
      is_active: boolean;
    };
    if (!ct?.is_active || ct.tenant_id !== wh.tenant_id) continue;
    if (ct.code.trim().toUpperCase() === 'RENT') continue;

    const is_transport = chargeCodeIsTransport(ct.code);
    const defBags = defaultBagsForChargeCode(ct.code, originalBags);
    const cpbRaw = typeof row.charges_per_bag === 'number' ? row.charges_per_bag : Number(row.charges_per_bag);
    const rate_per_bag =
      is_transport ? null :
      Number.isFinite(cpbRaw) && !Number.isNaN(cpbRaw) ?
        Math.round(Number(cpbRaw) * 10000) / 10000
      : null;

    chargeRowsUnsorted.push({
      charge_type_id: ct.id,
      charge_type_code: ct.code,
      display_name: ct.display_name,
      product_charge_type_id: row.product_charge_type_id,
      charges_per_bag: is_transport ? null : rate_per_bag != null ? String(rate_per_bag) : null,
      rate_per_bag,
      default_bags: defBags,
      is_transport,
      has_labor: !is_transport,
    });
  }

  chargeRowsUnsorted.sort((a, b) => a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }));

  const charge_rows = chargeRowsUnsorted.map((r) => ChargesBootstrapRowSchema.parse(r));
  const body: Pick<ChargesBootstrapResponse['data'], 'charge_rows'> = { charge_rows };

  return NextResponse.json({ data: body });
}
