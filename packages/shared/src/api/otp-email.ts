export type OtpEmailPayload = {
  to: string;
  otp: string;
  fullName: string;
};

export function otpVerificationEmailSubject(): string {
  return 'Your GrowCold verification code';
}

export function otpVerificationEmailText({ fullName, otp }: OtpEmailPayload): string {
  const name = fullName.trim() || 'there';
  return [
    `Hi ${name},`,
    '',
    `Your verification code is: ${otp}`,
    '',
    'This code expires in 10 minutes.',
    '',
    "If you didn't request this, ignore this email.",
    '',
    '—GrowCold Team',
  ].join('\n');
}

/** e.g. ravi@example.com → r***@example.com */
export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at <= 0) return '****';
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return '****';
  const visible = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${visible}@${domain}`;
}
