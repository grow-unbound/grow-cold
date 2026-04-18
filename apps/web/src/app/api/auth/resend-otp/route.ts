import { ResendOtpRequestSchema } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { generateSixDigitOtp, hashOtpCode } from '@/lib/otp-secret';
import { sendOtpEmail } from '@/lib/send-otp-email';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_RESENDS = 3;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = ResendOtpRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { session_id } = parsed.data;

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server misconfigured', code: 'CONFIG' }, { status: 500 });
  }

  const { data: challenge, error: chErr } = await admin
    .from('auth_otp_challenges')
    .select('id, user_id, resend_count, consumed_at, expires_at')
    .eq('id', session_id)
    .maybeSingle();

  if (chErr || !challenge) {
    return NextResponse.json({ error: 'Session not found.', code: 'SESSION_NOT_FOUND' }, { status: 404 });
  }

  if (challenge.consumed_at) {
    return NextResponse.json({ error: 'Code already used.', code: 'ALREADY_VERIFIED' }, { status: 400 });
  }

  if (challenge.resend_count >= MAX_RESENDS) {
    return NextResponse.json(
      { error: 'Maximum resend attempts reached. Start again.', code: 'RESEND_LIMIT' },
      { status: 429 },
    );
  }

  const { data: profile, error: profileErr } = await admin
    .from('user_profiles')
    .select('email, display_name')
    .eq('id', challenge.user_id)
    .maybeSingle();

  if (profileErr || !profile?.email) {
    return NextResponse.json({ error: 'User not found.', code: 'USER_NOT_FOUND' }, { status: 404 });
  }

  const otp = generateSixDigitOtp();
  const otpHash = await hashOtpCode(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: updErr } = await admin
    .from('auth_otp_challenges')
    .update({
      otp_hash: otpHash,
      expires_at: expiresAt,
      resend_count: challenge.resend_count + 1,
      attempt_count: 0,
      locked_until: null,
    })
    .eq('id', session_id);

  if (updErr) {
    console.error(updErr);
    return NextResponse.json({ error: 'Could not resend code.', code: 'RESEND_FAILED' }, { status: 500 });
  }

  const sendResult = await sendOtpEmail({
    to: profile.email,
    otp,
    fullName: profile.display_name ?? 'there',
  });
  if (!sendResult.ok) {
    return NextResponse.json({ error: sendResult.message, code: 'OTP_SEND_FAILED' }, { status: 502 });
  }

  return NextResponse.json({
    message: 'OTP sent. Check your email.',
    next_step: 'verify_otp',
  });
}
