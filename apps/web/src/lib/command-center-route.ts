import type { Database } from '@growcold/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getRoleForWarehouse } from '@/lib/warehouse-role';

type Supabase = SupabaseClient<Database>;

export type CommandCenterAuthFailure = { response: NextResponse };

export type CommandCenterAuthOk<T extends z.ZodType> = {
  supabase: Supabase;
  data: z.infer<T>;
};

export async function authorizeCommandCenterRequest<T extends z.ZodType>(
  request: Request,
  querySchema: T,
): Promise<CommandCenterAuthOk<T> | CommandCenterAuthFailure> {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 }),
    };
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid query';
    return {
      response: NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 }),
    };
  }

  const warehouseId = (parsed.data as { warehouseId: string }).warehouseId;
  const role = await getRoleForWarehouse(supabase, user.id, warehouseId);
  if (!role) {
    return { response: NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 }) };
  }

  return { supabase, data: parsed.data };
}
