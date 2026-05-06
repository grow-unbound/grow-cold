import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@growcold/shared';
import { STOCK_MOVEMENT_PAYMENT_TYPE_CATEGORY, STOCK_MOVEMENT_PAYMENT_TYPE_NAME } from '@growcold/shared';

type SB = SupabaseClient<Database>;

export async function fetchStockMovementPaymentTypeId(
  supabase: SB,
  tenantId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('payment_types')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('category', STOCK_MOVEMENT_PAYMENT_TYPE_CATEGORY)
    .eq('name', STOCK_MOVEMENT_PAYMENT_TYPE_NAME)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data?.id ?? null;
}
