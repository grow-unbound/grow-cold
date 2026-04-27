import { ListLocationsResponseSchema, StockTabWarehouseQuerySchema } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { authorizeCommandCenterRequest } from '@/lib/command-center-route';

export async function GET(request: Request) {
  const auth = await authorizeCommandCenterRequest(request, StockTabWarehouseQuerySchema);
  if ('response' in auth) return auth.response;

  try {
    const { data, error } = await auth.supabase
      .from('locations')
      .select('id, name')
      .eq('warehouse_id', auth.data.warehouseId)
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(
      ListLocationsResponseSchema.parse({ data: data ?? [] }),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }
}
