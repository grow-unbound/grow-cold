import { ListPaymentTypesResponseSchema } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from('payment_types')
    .select('id, name, category, is_active')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Query failed', code: 'DB_ERROR' }, { status: 500 });
  }

  const body = ListPaymentTypesResponseSchema.parse({ data: rows ?? [] });
  return NextResponse.json(body);
}
