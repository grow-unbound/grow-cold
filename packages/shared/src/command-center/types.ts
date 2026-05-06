export type HomeTimeFilter = 'today' | 'yesterday' | 'week' | 'month';

export interface PeriodBounds {
  start: Date;
  end: Date;
}

export interface PeriodPair {
  current: PeriodBounds;
  previous: PeriodBounds;
}
