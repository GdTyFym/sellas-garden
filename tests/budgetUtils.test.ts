import { describe, expect, it } from 'vitest';
import { sumBudgets } from '@/lib/roadmap/budgetUtils';

describe('budgetUtils', () => {
  it('sums budgets with mixed values', () => {
    const total = sumBudgets([
      { budget: 120000 },
      { budget: '80000' },
      { budget: null },
      {}
    ]);
    expect(total).toBe(200000);
  });
});
