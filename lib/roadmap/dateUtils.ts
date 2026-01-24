export const generateTripDates = (startDate: string) => {
  const start = new Date(`${startDate}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  });
};

export const dayIndexToDate = (startDate: string, dayIndex: number) => {
  const start = new Date(`${startDate}T00:00:00Z`);
  const date = new Date(start.getTime() + dayIndex * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

export const getCountdownDays = (startDate: string, today: Date = new Date()) => {
  const start = new Date(`${startDate}T00:00:00Z`);
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const diff = start.getTime() - todayUtc.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
};
