import { countdownTo, daysSince, nextAnniversaryDate, parseYMD } from '@/lib/relationshipCounter';

describe('relationshipCounter', () => {
  it('parses YYYY-MM-DD into parts', () => {
    expect(parseYMD('2024-02-09')).toEqual({ y: 2024, m: 2, d: 9 });
  });

  it('calculates daysSince using UTC civil days', () => {
    const start = new Date(Date.UTC(2024, 0, 1));
    const now = new Date(Date.UTC(2024, 0, 10));
    expect(daysSince(start, now)).toBe(9);
  });

  it('returns the next anniversary correctly around boundaries', () => {
    const start = new Date(Date.UTC(2020, 7, 17));
    const before = new Date(Date.UTC(2024, 7, 16, 12));
    const onDay = new Date(Date.UTC(2024, 7, 17, 23));
    const after = new Date(Date.UTC(2024, 7, 18, 1));

    expect(nextAnniversaryDate(start, before).toISOString().slice(0, 10)).toBe('2024-08-17');
    expect(nextAnniversaryDate(start, onDay).toISOString().slice(0, 10)).toBe('2024-08-17');
    expect(nextAnniversaryDate(start, after).toISOString().slice(0, 10)).toBe('2025-08-17');
  });

  it('builds a non-negative countdown with rollovers', () => {
    const now = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
    const target = new Date(Date.UTC(2024, 0, 2, 1, 2, 3));
    expect(countdownTo(target, now)).toEqual({
      days: 1,
      hours: 1,
      minutes: 2,
      seconds: 3
    });

    const past = new Date(Date.UTC(2023, 11, 31, 23, 59, 0));
    expect(countdownTo(past, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    });
  });
});
