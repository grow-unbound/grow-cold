/** Operations default (India cold storage). */
export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

/** `YYYY-MM-DD` in the business calendar (not necessarily UTC midnight). */
export function todayInBusinessTimezone(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIMEZONE }).format(new Date());
}
