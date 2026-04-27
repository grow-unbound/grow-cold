import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import type { HomeTimeFilter, PeriodBounds, PeriodPair } from './types';

/** Anchor "now" for tests; defaults to real now. */
export function getPeriodPair(filter: HomeTimeFilter, now = new Date()): PeriodPair {
  switch (filter) {
    case 'today': {
      const start = startOfDay(now);
      const end = endOfDay(now);
      const prevEnd = endOfDay(subDays(now, 1));
      const prevStart = startOfDay(subDays(now, 1));
      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }
    case 'yesterday': {
      const y = subDays(now, 1);
      const start = startOfDay(y);
      const end = endOfDay(y);
      const dby = subDays(now, 2);
      return {
        current: { start, end },
        previous: { start: startOfDay(dby), end: endOfDay(dby) },
      };
    }
    case 'week': {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      const prevWeekEnd = subDays(start, 1);
      const prevStart = startOfWeek(prevWeekEnd, { weekStartsOn: 1 });
      const prevEnd = endOfWeek(prevWeekEnd, { weekStartsOn: 1 });
      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }
    case 'month': {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const prevMonth = subMonths(now, 1);
      return {
        current: { start, end },
        previous: { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) },
      };
    }
    default: {
      const exhaustive: never = filter;
      throw new Error(`Unknown filter: ${String(exhaustive)}`);
    }
  }
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysInclusive(bounds: PeriodBounds): number {
  const ms = bounds.end.getTime() - bounds.start.getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
}
