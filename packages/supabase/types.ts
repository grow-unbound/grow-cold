/**
 * Regenerate when local DB is up:
 * `pnpm db:types` from repo root (writes this file).
 * Below is a minimal placeholder so TS builds before first `supabase gen types`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      current_tenant_id: { Args: Record<string, never>; Returns: string | null };
      accessible_warehouse_ids: { Args: Record<string, never>; Returns: string[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
