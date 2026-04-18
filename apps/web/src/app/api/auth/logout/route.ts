import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';

/** Clears Supabase auth cookies set by the App Router (same contract as login/verify). */
export async function POST() {
  const supabase = await createSupabaseRouteHandlerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
