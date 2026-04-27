import {
  MoneyTabSummaryResponseSchema,
  MoneyTabWarehouseQuerySchema,
  fetchMoneyTabSummary,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { authorizeCommandCenterRequest } from '@/lib/command-center-route';

export async function GET(request: Request) {
  const auth = await authorizeCommandCenterRequest(request, MoneyTabWarehouseQuerySchema);
  if ('response' in auth) return auth.response;

  try {
    const body = await fetchMoneyTabSummary(auth.supabase, auth.data.warehouseId);
    return NextResponse.json(MoneyTabSummaryResponseSchema.parse(body));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
}
