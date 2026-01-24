export const sumBudgets = (items: Array<{ budget?: number | string | null }>) => {
  return items.reduce((total, item) => {
    if (item.budget === null || item.budget === undefined || item.budget === '') {
      return total;
    }
    const value = Number(item.budget);
    return Number.isNaN(value) ? total : total + value;
  }, 0);
};
