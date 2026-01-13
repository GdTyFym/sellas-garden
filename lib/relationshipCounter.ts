export const relationshipConfig = {
  RELATIONSHIP_START_DATE: '2025-11-02',
  MILESTONE_LABEL: 'Anniversary',
  DISPLAY_LOCALE: 'id-ID' as const
};

export const { RELATIONSHIP_START_DATE, MILESTONE_LABEL, DISPLAY_LOCALE } = relationshipConfig;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const parseYMD = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error('RELATIONSHIP_START_DATE must be YYYY-MM-DD');
  }
  return {
    y: Number(match[1]),
    m: Number(match[2]),
    d: Number(match[3])
  };
};

export const toCivilDayUTC = (date: Date) =>
  Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / MS_PER_DAY);

export const daysBetweenCivilDays = (a: number, b: number) => b - a;

export const daysSince = (start: Date, now: Date) =>
  daysBetweenCivilDays(toCivilDayUTC(start), toCivilDayUTC(now));

export const nextAnniversaryDate = (start: Date, now: Date) => {
  const startMonth = start.getUTCMonth();
  const startDay = start.getUTCDate();
  const nowYear = now.getUTCFullYear();
  const todayUTC = Date.UTC(nowYear, now.getUTCMonth(), now.getUTCDate());
  const candidateUTC = Date.UTC(nowYear, startMonth, startDay);
  if (candidateUTC < todayUTC) {
    return new Date(Date.UTC(nowYear + 1, startMonth, startDay));
  }
  return new Date(candidateUTC);
};

export const countdownTo = (target: Date, now: Date) => {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);
  return { days, hours, minutes, seconds };
};
