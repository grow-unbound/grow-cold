import { otpVerificationEmailSubject, otpVerificationEmailText, type OtpEmailPayload } from '@growcold/shared';

export type SendOtpEmailResult = { ok: true; skipped?: boolean } | { ok: false; message: string };

export async function sendOtpEmail(payload: OtpEmailPayload): Promise<SendOtpEmailResult> {
  const provider = process.env.OTP_PROVIDER ?? 'EMAIL';
  if (provider === 'WHATSAPP') {
    return { ok: false, message: 'WhatsApp OTP is not configured yet.' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const subject = otpVerificationEmailSubject();
  const text = otpVerificationEmailText(payload);

  if (!apiKey) {
    console.warn('[growcold/auth] RESEND_API_KEY missing — OTP email not sent:', {
      to: payload.to,
      preview: text.slice(0, 80),
    });
    return { ok: true, skipped: true };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'GrowCold <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[growcold/auth] Resend error:', res.status, body);
    return { ok: false, message: 'Failed to send verification email.' };
  }

  return { ok: true };
}
