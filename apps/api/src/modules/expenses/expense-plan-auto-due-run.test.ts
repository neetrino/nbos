import { describe, expect, it, vi } from 'vitest';
import { EXPENSE_PLAN_MONTH_CARD_LIMIT } from './expense-plan-auto-due-scope';
import { generateExpenseCardsForDuePlans } from './expense-plan-auto-due-run';

const OCTOBER_END = new Date('2026-10-31T23:59:59.999Z');

const activePlan = (nextDueDate: Date | null) => ({
  nextDueDate,
  autoGenerate: true,
  status: 'ACTIVE',
});

describe('generateExpenseCardsForDuePlans', () => {
  it('creates every weekly occurrence that stays inside the month', async () => {
    const dues = [
      new Date('2026-10-08T00:00:00.000Z'),
      new Date('2026-10-15T00:00:00.000Z'),
      new Date('2026-10-22T00:00:00.000Z'),
      new Date('2026-10-29T00:00:00.000Z'),
      new Date('2026-11-05T00:00:00.000Z'),
    ];
    const generateCard = vi.fn().mockResolvedValue({ id: 'ex-1' });
    const readPlanDue = vi.fn(async () => activePlan(dues.shift() ?? null));

    const result = await generateExpenseCardsForDuePlans({
      planIds: ['plan-w'],
      cutoff: OCTOBER_END,
      generateCard,
      readPlanDue,
    });

    expect(generateCard).toHaveBeenCalledTimes(5);
    expect(result.created).toHaveLength(5);
    expect(result.failures).toHaveLength(0);
  });

  it('stops a plan after the first generation failure', async () => {
    const generateCard = vi.fn().mockRejectedValue(new Error('card failed'));
    const readPlanDue = vi.fn();

    const result = await generateExpenseCardsForDuePlans({
      planIds: ['plan-x'],
      cutoff: OCTOBER_END,
      generateCard,
      readPlanDue,
    });

    expect(generateCard).toHaveBeenCalledTimes(1);
    expect(readPlanDue).not.toHaveBeenCalled();
    expect(result.created).toHaveLength(0);
    expect(result.failures).toEqual([{ planId: 'plan-x', message: 'card failed' }]);
  });

  it('stops at the monthly card limit and leaves the rest for the next run', async () => {
    const generateCard = vi.fn().mockResolvedValue({ id: 'ex-1' });
    const readPlanDue = vi.fn(async () => activePlan(new Date('2026-01-01T00:00:00.000Z')));

    const result = await generateExpenseCardsForDuePlans({
      planIds: ['plan-backlog'],
      cutoff: OCTOBER_END,
      generateCard,
      readPlanDue,
    });

    expect(generateCard).toHaveBeenCalledTimes(EXPENSE_PLAN_MONTH_CARD_LIMIT);
    expect(result.created).toHaveLength(EXPENSE_PLAN_MONTH_CARD_LIMIT);
    expect(result.failures).toHaveLength(0);
  });
});
