import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@growcold/shared';

export type AppRole = 'OWNER' | 'MANAGER' | 'STAFF';

export async function getRoleForWarehouse(
  supabase: SupabaseClient<Database>,
  userId: string,
  warehouseId: string,
): Promise<AppRole | null> {
  const { data: wh } = await supabase
    .from('warehouses')
    .select('tenant_id')
    .eq('id', warehouseId)
    .maybeSingle();
  if (!wh?.tenant_id) return null;
  const { data: row } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', wh.tenant_id)
    .maybeSingle();
  return (row?.role as AppRole) ?? null;
}
