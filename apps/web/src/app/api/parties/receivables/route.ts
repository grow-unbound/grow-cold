import {
  PartiesReceivablesQuerySchema,
  PartiesReceivablesSummarySchema,
  fetchPartiesReceivablesSummary,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { authorizeCommandCenterRequest } from '@/lib/command-center-route';

export async function GET(request: Request) {
  const auth = await authorizeCommandCenterRequest(request, PartiesReceivablesQuerySchema);
  if ('response' in auth) return auth.response;

  try {
    const body = await fetchPartiesReceivablesSummary(auth.supabase, auth.data.warehouseId);
    return NextResponse.json(PartiesReceivablesSummarySchema.parse(body));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
}
