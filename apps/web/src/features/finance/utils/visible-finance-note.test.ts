import { describe, expect, it } from 'vitest';

import { isOriginalPayrollCashPayment, visibleFinanceNote } from './visible-finance-note';

describe('visibleFinanceNote', () => {
  it('hides the payroll cash prefix and keeps the financier comment', () => {
    const notes = 'nbos:v1:payrollCash:{"salaryAmount":"300000.00"}\nPaid in cash';
    expect(visibleFinanceNote(notes)).toBe('Paid in cash');
  });

  it('hides a source-amount title with no comment', () => {
    expect(
      visibleFinanceNote('nbos:v1:sourceAmounts:[{"bonusEntryId":"be-50","amount":"50.00"}]'),
    ).toBe(null);
  });

  it('keeps an ordinary note', () => {
    expect(visibleFinanceNote('Bank transfer')).toBe('Bank transfer');
  });

  it('treats only the original payroll cash line as refundable', () => {
    expect(isOriginalPayrollCashPayment('nbos:v1:payrollCash:{"salaryAmount":"300000.00"}')).toBe(
      true,
    );
    expect(isOriginalPayrollCashPayment('nbos:v1:payrollCashRefund:{"salaryAmount":"0.00"}')).toBe(
      false,
    );
  });
});
