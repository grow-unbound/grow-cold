import {
  CommandCenterActivityResponseSchema,
  CommandCenterWarehouseQuerySchema,
  fetchTodaysActivity,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { authorizeCommandCenterRequest } from '@/lib/command-center-route';

export async function GET(request: Request) {
  const auth = await authorizeCommandCenterRequest(request, CommandCenterWarehouseQuerySchema);
  if ('response' in auth) return auth.response;

  try {
    const body = await fetchTodaysActivity(auth.supabase, auth.data.warehouseId, new Date());
    return NextResponse.json(CommandCenterActivityResponseSchema.parse(body));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
}
