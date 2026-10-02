import { describe, expect, it } from 'vitest';

import { planExpenseBonusAssignments } from './expense-payment-bonus-assignment';

const BONUS = { bonusReleaseId: 'rel-60', remaining: '60000.00' };

describe('planExpenseBonusAssignments', () => {
  it('assigns 20000 of a 320000 payment to the named bonus', () => {
    const plan = planExpenseBonusAssignments({
      amountText: '320000',
      salaryRemaining: '300000.00',
      carryRemaining: '0.00',
      bonuses: [BONUS],
      drafts: [{ bonusReleaseId: 'rel-60', amountText: '20000' }],
    });

    expect(plan.valid).toBe(true);
    expect(plan.salaryPart).toBe('300000.00');
    expect(plan.bonusAssignments).toEqual([{ bonusReleaseId: 'rel-60', amount: '20000.00' }]);
    expect(plan.unassigned).toBe('0.00');
  });

  it('rejects 320000 when the 20000 above salary is not assigned', () => {
    const plan = planExpenseBonusAssignments({
      amountText: '320000',
      salaryRemaining: '300000.00',
      carryRemaining: '0.00',
      bonuses: [BONUS],
      drafts: [{ bonusReleaseId: 'rel-60', amountText: '' }],
    });

    expect(plan.valid).toBe(false);
    expect(plan.bonusAssignments).toEqual([]);
    expect(plan.unassigned).toBe('20000.00');
  });

  it('pays 20000 of earlier carry only when that amount is typed', () => {
    const unnamed = planExpenseBonusAssignments({
      amountText: '20000',
      salaryRemaining: '0.00',
      carryRemaining: '20000.00',
      bonuses: [],
      drafts: [],
    });
    const named = planExpenseBonusAssignments({
      amountText: '20000',
      salaryRemaining: '0.00',
      carryRemaining: '20000.00',
      bonuses: [],
      drafts: [],
      carryDraft: '20000',
    });

    expect(unnamed.valid).toBe(false);
    expect(named.valid).toBe(true);
    expect(named.carryAmount).toBe('20000.00');
  });

  it('pays salary only when the payment does not exceed remaining salary', () => {
    const plan = planExpenseBonusAssignments({
      amountText: '200000',
      salaryRemaining: '300000.00',
      carryRemaining: '0.00',
      bonuses: [BONUS],
      drafts: [],
    });

    expect(plan.valid).toBe(true);
    expect(plan.salaryPart).toBe('200000.00');
    expect(plan.bonusAssignments).toEqual([]);
  });
});
