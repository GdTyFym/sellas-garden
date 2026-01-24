import { describe, expect, it } from 'vitest';
import { dayIndexToDate, generateTripDates, getCountdownDays } from '@/lib/roadmap/dateUtils';

describe('dateUtils', () => {
  it('generates seven dates from a start date', () => {
    const dates = generateTripDates('2026-02-01');
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2026-02-01');
    expect(dates[6]).toBe('2026-02-07');
  });

  it('maps a day index to a date', () => {
    expect(dayIndexToDate('2026-03-10', 3)).toBe('2026-03-13');
  });

  it('calculates countdown in days', () => {
    const countdown = getCountdownDays('2026-04-10', new Date('2026-04-08T12:00:00Z'));
    expect(countdown).toBe(2);
  });
});
