import type { RentalMode } from '../constants';

/** Calendar-safe cutoff date YYYY-MM-DD (same semantics as Postgres `rent_yearly_cutoff_in_year`). */
export function rentYearlyCutoffInYear(year: number, cutMonth: number, cutDay: number): string {
  const lastDay = new Date(year, cutMonth, 0).getDate();
  const day = Math.min(cutDay, lastDay);
  const m = String(cutMonth).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** Match `import_staging.rental_mode_from_date` / accrual engine: YEARLY if lodgement <= cutoff in that year. */
export function computeRentalModeFromLodgementDate(
  lodgementIsoDate: string,
  yearlyRentCutoffMonth: number,
  yearlyRentCutoffDay: number,
): Extract<RentalMode, 'YEARLY' | 'MONTHLY'> {
  const y = Number.parseInt(lodgementIsoDate.slice(0, 4), 10);
  const cutoff = rentYearlyCutoffInYear(y, yearlyRentCutoffMonth, yearlyRentCutoffDay);
  return lodgementIsoDate <= cutoff ? 'YEARLY' : 'MONTHLY';
}
