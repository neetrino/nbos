import { describe, it, expect } from 'vitest';
import {
  parsePayrollLinkFromExpenseNotes,
  resolveExpensePayrollMonthLabel,
  resolveExpensePayrollRunId,
} from './parse-payroll-expense-notes';

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

describe('resolveExpensePayrollRunId', () => {
  it('prefers linkedPayrollRun over notes', () => {
    expect(
      resolveExpensePayrollRunId({
        linkedPayrollRun: { payrollRunId: 'run-api', payrollMonth: '2026-01' },
        notes: 'NBOS payrollRunId=run-note; salaryLineId=sl',
      }),
    ).toBe('run-api');
  });

  it('falls back to notes marker', () => {
    expect(
      resolveExpensePayrollRunId({
        linkedPayrollRun: null,
        notes: 'NBOS payrollRunId=run-note; salaryLineId=sl',
      }),
    ).toBe('run-note');
  });
});

describe('resolveExpensePayrollMonthLabel', () => {
  it('returns month from API link only', () => {
    expect(
      resolveExpensePayrollMonthLabel({
        linkedPayrollRun: { payrollRunId: 'r', payrollMonth: '2026-02' },
        notes: null,
      }),
    ).toBe('2026-02');
    expect(
      resolveExpensePayrollMonthLabel({
        linkedPayrollRun: null,
        notes: 'NBOS payrollRunId=r; salaryLineId=s',
      }),
    ).toBeNull();
  });
});
