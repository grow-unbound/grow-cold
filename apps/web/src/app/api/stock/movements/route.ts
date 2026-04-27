import {
  StockTabMovementsQuerySchema,
  StockTabMovementsResponseSchema,
  fetchStockTabMovements,
} from '@growcold/shared';
import { NextResponse } from 'next/server';
import { authorizeCommandCenterRequest } from '@/lib/command-center-route';

export async function GET(request: Request) {
  const auth = await authorizeCommandCenterRequest(request, StockTabMovementsQuerySchema);
  if ('response' in auth) return auth.response;

  try {
    const { warehouseId, limit, cursor } = auth.data;
    const body = await fetchStockTabMovements(
      auth.supabase,
      warehouseId,
      limit,
      cursor ?? null,
    );
    return NextResponse.json(StockTabMovementsResponseSchema.parse(body));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
}
