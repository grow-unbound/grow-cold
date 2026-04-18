import { SignupRequestSchema } from '@growcold/shared';
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

  const parsed = SignupRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { full_name, phone, email, company_name, agreed_to_terms } = parsed.data;

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server misconfigured', code: 'CONFIG' }, { status: 500 });
  }

  const { data: phoneRow } = await admin.from('user_profiles').select('id').eq('phone', phone).maybeSingle();
  if (phoneRow) {
    return NextResponse.json(
      { error: 'This phone number is already registered.', code: 'PHONE_EXISTS' },
      { status: 409 },
    );
  }

  const { data: emailRow } = await admin.from('user_profiles').select('id').eq('email', email).maybeSingle();
  if (emailRow) {
    return NextResponse.json(
      { error: 'This email is already registered.', code: 'EMAIL_EXISTS' },
      { status: 409 },
    );
  }

  let userId: string | null = null;
  let tenantId: string | null = null;

  async function rollbackSignup(): Promise<void> {
    if (!userId) return;
    if (tenantId) {
      await admin.from('audit_log').delete().eq('tenant_id', tenantId);
      const { error: tDel } = await admin.from('tenants').delete().eq('id', tenantId);
      if (tDel) console.error('rollback tenant:', tDel);
    }
    const { error: uDel } = await admin.auth.admin.deleteUser(userId);
    if (uDel) console.error('rollback user:', uDel);
  }

  try {
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      phone,
      email,
      email_confirm: false,
      phone_confirm: false,
      user_metadata: { full_name },
    });

    if (authErr || !authData.user) {
      const msg = authErr?.message ?? 'Could not create account';
      if (/already|duplicate|exists/i.test(msg)) {
        return NextResponse.json(
          { error: 'Phone or email is already in use.', code: 'AUTH_DUPLICATE' },
          { status: 409 },
        );
      }
      console.error(authErr);
      return NextResponse.json({ error: msg, code: 'SIGNUP_FAILED' }, { status: 400 });
    }

    userId = authData.user.id;

    const { data: tenant, error: tenantErr } = await admin
      .from('tenants')
      .insert({ name: company_name })
      .select('id')
      .single();

    if (tenantErr || !tenant) {
      console.error(tenantErr);
      throw new Error('TENANT_INSERT_FAILED');
    }

    tenantId = tenant.id;

    const now = new Date().toISOString();
    const { error: profileErr } = await admin.from('user_profiles').insert({
      id: userId,
      phone,
      email,
      display_name: full_name,
      terms_accepted_at: agreed_to_terms ? now : null,
      is_active: true,
    });

    if (profileErr) {
      console.error(profileErr);
      throw new Error('PROFILE_INSERT_FAILED');
    }

    const { error: roleErr } = await admin.from('user_roles').insert({
      user_id: userId,
      tenant_id: tenant.id,
      role: 'OWNER',
    });

    if (roleErr) {
      console.error(roleErr);
      throw new Error('ROLE_INSERT_FAILED');
    }

    const otp = generateSixDigitOtp();
    const otpHash = await hashOtpCode(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { data: challenge, error: chErr } = await admin
      .from('auth_otp_challenges')
      .insert({
        user_id: userId,
        purpose: 'signup',
        otp_hash: otpHash,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (chErr || !challenge) {
      console.error(chErr);
      throw new Error('OTP_INSERT_FAILED');
    }

    const { error: auditErr } = await admin.from('audit_log').insert({
      tenant_id: tenant.id,
      warehouse_id: null,
      user_id: userId,
      entity_type: 'signup',
      entity_id: userId,
      action: 'SIGNUP',
      new_values: { email, phone, company_name },
      reason: 'Public signup',
    });

    if (auditErr) {
      console.error(auditErr);
    }

    const sendResult = await sendOtpEmail({ to: email, otp, fullName: full_name });
    if (!sendResult.ok) {
      console.error(sendResult.message);
      throw new Error('OTP_SEND_FAILED');
    }

    return NextResponse.json({
      session_id: challenge.id,
      otp_sent_to: email,
      message: 'OTP sent. Check your email.',
      next_step: 'verify_otp',
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'OTP_SEND_FAILED') {
      await rollbackSignup();
      return NextResponse.json(
        { error: 'Failed to send verification email.', code: 'OTP_SEND_FAILED' },
        { status: 502 },
      );
    }
    await rollbackSignup();
    console.error(e);
    return NextResponse.json({ error: 'Signup could not be completed.', code: 'SIGNUP_FAILED' }, { status: 500 });
  }
}
