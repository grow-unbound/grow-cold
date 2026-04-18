import { LoginPhoneRequestSchema, maskEmail } from '@growcold/shared';
import { NextResponse } from 'next/server';
import { generateSixDigitOtp, hashOtpCode } from '@/lib/otp-secret';
import { sendOtpEmail } from '@/lib/send-otp-email';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = LoginPhoneRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { phone } = parsed.data;

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server misconfigured', code: 'CONFIG' }, { status: 500 });
  }

  const { data: profile, error: profileErr } = await admin
    .from('user_profiles')
    .select('id, email, display_name')
    .eq('phone', phone)
    .maybeSingle();

  if (profileErr) {
    console.error(profileErr);
    return NextResponse.json({ error: 'Lookup failed.', code: 'LOOKUP_FAILED' }, { status: 500 });
  }

  if (!profile?.email) {
    return NextResponse.json(
      { error: 'Phone not found. Create an account?', code: 'PHONE_NOT_FOUND' },
      { status: 404 },
    );
  }

  const otp = generateSixDigitOtp();
  const otpHash = await hashOtpCode(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { data: challenge, error: chErr } = await admin
    .from('auth_otp_challenges')
    .insert({
      user_id: profile.id,
      purpose: 'login',
      otp_hash: otpHash,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (chErr || !challenge) {
    console.error(chErr);
    return NextResponse.json({ error: 'Could not start login.', code: 'OTP_CREATE_FAILED' }, { status: 500 });
  }

  const fullName = profile.display_name ?? 'there';
  const sendResult = await sendOtpEmail({ to: profile.email, otp, fullName });
  if (!sendResult.ok) {
    return NextResponse.json({ error: sendResult.message, code: 'OTP_SEND_FAILED' }, { status: 502 });
  }

  return NextResponse.json({
    session_id: challenge.id,
    otp_sent_to: maskEmail(profile.email),
    message: 'OTP sent',
    next_step: 'verify_otp',
  });
}
