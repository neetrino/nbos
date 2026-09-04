import { describe, expect, it } from 'vitest';
import {
  expensePlanCanCancel,
  expensePlanCanGenerateCard,
  expensePlanCanResume,
  expensePlanIsCancelled,
} from './expense-plan-status-eligibility';

describe('expense-plan-status-eligibility', () => {
  it('treats ACTIVE as cancellable and generatable', () => {
    expect(expensePlanCanCancel({ status: 'ACTIVE' })).toBe(true);
    expect(expensePlanCanResume({ status: 'ACTIVE' })).toBe(false);
    expect(expensePlanCanGenerateCard({ status: 'ACTIVE' })).toBe(true);
    expect(expensePlanIsCancelled({ status: 'ACTIVE' })).toBe(false);
  });

  it('treats CANCELLED as resumable only', () => {
    expect(expensePlanCanCancel({ status: 'CANCELLED' })).toBe(false);
    expect(expensePlanCanResume({ status: 'CANCELLED' })).toBe(true);
    expect(expensePlanCanGenerateCard({ status: 'CANCELLED' })).toBe(false);
    expect(expensePlanIsCancelled({ status: 'CANCELLED' })).toBe(true);
  });
});
