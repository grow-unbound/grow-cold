import { z } from 'zod';

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{9,14}$/, 'Phone must be in E.164 format');

export const SendOtpRequestSchema = z.object({
  phone: phoneSchema,
});

export const SendOtpResponseSchema = z.object({
  sent: z.boolean(),
});

export const VerifyOtpRequestSchema = z.object({
  phone: phoneSchema,
  token: z.string().trim().min(4).max(10),
});

export const VerifyOtpResponseSchema = z.object({
  authenticated: z.boolean(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
});

export const AuthErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type SendOtpRequest = z.infer<typeof SendOtpRequestSchema>;
export type SendOtpResponse = z.infer<typeof SendOtpResponseSchema>;
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;
export type AuthError = z.infer<typeof AuthErrorSchema>;
