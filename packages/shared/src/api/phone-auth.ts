import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { AuthErrorSchema } from './endpoints/auth';

export interface AuthSuccessResult<TData> {
  ok: true;
  data: TData;
}

export interface AuthFailureResult {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type AuthResult<TData> = AuthSuccessResult<TData> | AuthFailureResult;

function toAuthFailure(code: string, message: string): AuthFailureResult {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

export async function getSession<TDatabase extends Database = Database>(
  supabase: SupabaseClient<TDatabase>,
): Promise<AuthResult<Session | null>> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return toAuthFailure(error.code ?? 'SESSION_FETCH_FAILED', error.message);

  return {
    ok: true,
    data: data.session,
  };
}

export async function getAccessToken<TDatabase extends Database = Database>(
  supabase: SupabaseClient<TDatabase>,
): Promise<AuthResult<string | null>> {
  const sessionResult = await getSession(supabase);
  if (sessionResult.ok === false) {
    return {
      ok: false,
      error: sessionResult.error,
    };
  }

  return {
    ok: true,
    data: sessionResult.data?.access_token ?? null,
  };
}

export function parseAuthError(input: unknown): AuthFailureResult {
  const parsed = AuthErrorSchema.safeParse(input);
  if (parsed.success) return toAuthFailure(parsed.data.code, parsed.data.message);
  return toAuthFailure('UNKNOWN_AUTH_ERROR', 'Unexpected auth error');
}
