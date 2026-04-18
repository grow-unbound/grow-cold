import type { Database as GrowColdDatabase } from '@growcold/supabase/types';

export type Database = GrowColdDatabase;

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}
