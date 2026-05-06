import {
  CommandCenterPartiesResponseSchema,
  CommandCenterPerformanceQuerySchema,
  fetchPartiesPerformance,
  getPeriodPair,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { authorizeCommandCenterRequest } from '@/lib/command-center-route';

export async function GET(request: Request) {
  const auth = await authorizeCommandCenterRequest(request, CommandCenterPerformanceQuerySchema);
  if ('response' in auth) return auth.response;

  try {
    const { filter, warehouseId } = auth.data;
    const { current, previous } = getPeriodPair(filter);
    const body = await fetchPartiesPerformance(auth.supabase, warehouseId, current, previous);
    return NextResponse.json(CommandCenterPartiesResponseSchema.parse(body));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
}
