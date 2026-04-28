import { describe, it, expect } from 'vitest';
import { parsePayrollLinkFromExpenseNotes } from './parse-payroll-expense-notes';

describe('parsePayrollLinkFromExpenseNotes', () => {
  it('parses canonical NBOS payroll note', () => {
    const parsed = parsePayrollLinkFromExpenseNotes('NBOS payrollRunId=run-1; salaryLineId=line-2');
    expect(parsed).toEqual({ payrollRunId: 'run-1', salaryLineId: 'line-2' });
  });

  it('returns null when marker missing', () => {
    expect(parsePayrollLinkFromExpenseNotes('Other note')).toBeNull();
    expect(parsePayrollLinkFromExpenseNotes(null)).toBeNull();
  });
});
