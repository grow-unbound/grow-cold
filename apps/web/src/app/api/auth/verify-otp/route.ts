import { OtpVerifyRequestSchema } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otp-secret';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler';

const MAX_OTP_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = OtpVerifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { session_id, code } = parsed.data;

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server misconfigured', code: 'CONFIG' }, { status: 500 });
  }

  const { data: challenge, error: chErr } = await admin
    .from('auth_otp_challenges')
    .select('id, user_id, otp_hash, expires_at, attempt_count, locked_until, consumed_at')
    .eq('id', session_id)
    .maybeSingle();

  if (chErr || !challenge) {
    return NextResponse.json(
      { error: 'Email not recognized. Try again or start over.', code: 'SESSION_NOT_FOUND' },
      { status: 404 },
    );
  }

  if (challenge.consumed_at) {
    return NextResponse.json({ error: 'Code already used.', code: 'ALREADY_VERIFIED' }, { status: 400 });
  }

  const now = Date.now();
  if (challenge.locked_until && new Date(challenge.locked_until).getTime() > now) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 5 minutes.', code: 'LOCKED' },
      { status: 429 },
    );
  }

  if (new Date(challenge.expires_at).getTime() < now) {
    return NextResponse.json({ error: 'Code expired. Request a new one.', code: 'EXPIRED' }, { status: 400 });
  }

  const valid = await verifyOtpCode(code, challenge.otp_hash);
  if (!valid) {
    const nextAttempt = challenge.attempt_count + 1;
    const lockedUntil =
      nextAttempt >= MAX_OTP_ATTEMPTS ? new Date(now + LOCKOUT_MS).toISOString() : null;

    await admin
      .from('auth_otp_challenges')
      .update({
        attempt_count: nextAttempt,
        locked_until: lockedUntil,
      })
      .eq('id', session_id);

    if (lockedUntil) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in 5 minutes.', code: 'LOCKED' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: 'Code is incorrect. Try again.', code: 'INVALID_OTP' }, { status: 400 });
  }

  const verifiedAt = new Date().toISOString();
  const { error: consumeErr } = await admin
    .from('auth_otp_challenges')
    .update({ consumed_at: verifiedAt })
    .eq('id', session_id);

  if (consumeErr) {
    console.error(consumeErr);
    return NextResponse.json({ error: 'Verification failed.', code: 'UPDATE_FAILED' }, { status: 500 });
  }

  const { data: profile, error: profileErr } = await admin
    .from('user_profiles')
    .select('email')
    .eq('id', challenge.user_id)
    .maybeSingle();

  if (profileErr || !profile?.email) {
    return NextResponse.json({ error: 'Account misconfigured.', code: 'PROFILE_ERROR' }, { status: 500 });
  }

  await admin.from('user_profiles').update({ email_verified_at: verifiedAt }).eq('id', challenge.user_id);

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email,
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error(linkErr);
    return NextResponse.json({ error: 'Could not create session.', code: 'SESSION_FAILED' }, { status: 500 });
  }

  const routeClient = await createSupabaseRouteHandlerClient();
  const { error: verifyErr } = await routeClient.auth.verifyOtp({
    type: 'email',
    token_hash: linkData.properties.hashed_token,
  });

  if (verifyErr) {
    console.error(verifyErr);
    return NextResponse.json({ error: 'Could not create session.', code: 'SESSION_FAILED' }, { status: 500 });
  }

  const { count, error: cntErr } = await admin
    .from('user_warehouse_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', challenge.user_id);

  if (cntErr) {
    console.error(cntErr);
  }

  const next = count === 0 ? 'create_warehouse' : 'home';

  return NextResponse.json({
    message: 'Signed in',
    next,
  });
}
