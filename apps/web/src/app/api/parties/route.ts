import {
  PartiesListQuerySchema,
  PartiesListResponseSchema,
  fetchPartiesPage,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { authorizeCommandCenterRequest } from '@/lib/command-center-route';

export async function GET(request: Request) {
  const auth = await authorizeCommandCenterRequest(request, PartiesListQuerySchema);
  if ('response' in auth) return auth.response;

  const { warehouseId, filter, q, limit, offset } = auth.data;
  try {
    const body = await fetchPartiesPage(
      auth.supabase,
      warehouseId,
      filter,
      q ?? '',
      limit,
      offset,
    );
    return NextResponse.json(PartiesListResponseSchema.parse(body));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
}
