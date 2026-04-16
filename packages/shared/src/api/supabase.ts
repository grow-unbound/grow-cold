import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from './types';

export interface CreateGrowColdSupabaseClientParams {
  supabaseUrl: string;
  supabaseAnonKey: string;
  options?: SupabaseClientOptions<'public'>;
}

export function createGrowColdSupabaseClient<TDatabase extends Database = Database>(
  params: CreateGrowColdSupabaseClientParams,
): SupabaseClient<TDatabase> {
  return createClient(
    params.supabaseUrl,
    params.supabaseAnonKey,
    params.options as never,
  ) as SupabaseClient<TDatabase>;
}
