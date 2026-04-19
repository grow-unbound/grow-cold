import { ListProductsQuerySchema, ListProductsResponseSchema } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { toProductApi } from '@/lib/api-row-mappers';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';

export async function GET(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = ListProductsQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { limit, offset } = parsed.data;

  const q = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('product_name')
    .range(offset, offset + limit - 1);

  const { data: rows, error, count } = await q;
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const data = (rows ?? []).map(toProductApi);
  const total = count ?? 0;
  const body = ListProductsResponseSchema.parse({
    data,
    count: total,
    hasMore: offset + data.length < total,
  });
  return NextResponse.json(body);
}
