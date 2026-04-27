import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

export type StorageDisplayStatus = 'completed' | 'fresh' | 'aging' | 'stale';

export interface StorageStatusResult {
  status: StorageDisplayStatus;
  /** Calendar days from lodgement (start-of-day) to reference date; nonnegative. */
  daysSinceLodgement: number;
}

/**
 * Lot Details UI status: completed when no balance; else age buckets from lodgement (180 / 365 days).
 */
export function computeStorageStatus(
  lodgementDateYmd: string,
  balanceBags: number,
  referenceDate: Date = new Date(),
): StorageStatusResult {
  const lodgement = startOfDay(parseISO(lodgementDateYmd));
  const ref = startOfDay(referenceDate);
  const daysSinceLodgement = Math.max(0, differenceInCalendarDays(ref, lodgement));

  if (balanceBags === 0) {
    return { status: 'completed', daysSinceLodgement };
  }
  if (daysSinceLodgement <= 180) {
    return { status: 'fresh', daysSinceLodgement };
  }
  if (daysSinceLodgement <= 365) {
    return { status: 'aging', daysSinceLodgement };
  }
  return { status: 'stale', daysSinceLodgement };
}
