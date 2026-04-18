import { z } from 'zod';

/** India MVP: +91 followed by 10 digits starting 6–9 */
export const indiaPhoneSchema = z
  .string()
  .trim()
  .regex(/^\+91[6-9]\d{9}$/, 'Enter a valid Indian mobile number (+91…)');

export const SignupRequestSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Name contains invalid characters'),
  phone: indiaPhoneSchema,
  email: z.string().trim().email('Enter a valid email'),
  company_name: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name is too long'),
  agreed_to_terms: z
    .boolean()
    .refine((v) => v === true, { message: 'You must accept the terms' }),
});

export const LoginPhoneRequestSchema = z.object({
  phone: indiaPhoneSchema,
});

/** POST /api/auth/verify-otp body */
export const OtpVerifyRequestSchema = z.object({
  session_id: z.string().uuid(),
  code: z
    .string()
    .trim()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Digits only'),
});

export const ResendOtpRequestSchema = z.object({
  session_id: z.string().uuid(),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type LoginPhoneRequest = z.infer<typeof LoginPhoneRequestSchema>;
export type OtpVerifyRequest = z.infer<typeof OtpVerifyRequestSchema>;
export type ResendOtpApiRequest = z.infer<typeof ResendOtpRequestSchema>;
