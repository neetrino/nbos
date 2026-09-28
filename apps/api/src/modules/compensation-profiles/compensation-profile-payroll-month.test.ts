import { describe, expect, it } from 'vitest';
import {
  approvedProfileCoversPayrollMonth,
  endOfPayrollMonthUtc,
  lastDateOfPayrollMonth,
  payrollMonthForInstant,
  payrollMonthRangesOverlap,
  previousPayrollMonth,
  startOfPayrollMonthUtc,
} from './compensation-profile-payroll-month';

describe('compensation-profile payroll month', () => {
  it('bounds a month in Asia/Yerevan, not UTC midnight', () => {
    expect(startOfPayrollMonthUtc('2026-10').toISOString()).toBe('2026-09-30T20:00:00.000Z');
    expect(endOfPayrollMonthUtc('2026-09').toISOString()).toBe('2026-09-30T19:59:59.999Z');
  });

  it('assigns an instant near UTC month-end to the Yerevan calendar month', () => {
    expect(payrollMonthForInstant(new Date('2026-09-30T21:00:00.000Z'))).toBe('2026-10');
    expect(payrollMonthForInstant(new Date('2026-09-30T19:00:00.000Z'))).toBe('2026-09');
  });

  it('does not let a November-ending DATE cover December', () => {
    const novemberEnd = lastDateOfPayrollMonth(previousPayrollMonth('2026-12'));
    expect(novemberEnd.toISOString().slice(0, 10)).toBe('2026-11-30');
    expect(
      approvedProfileCoversPayrollMonth(
        { effectiveFrom: new Date('2026-01-01T00:00:00.000Z'), effectiveTo: novemberEnd },
        '2026-11',
      ),
    ).toBe(true);
    expect(
      approvedProfileCoversPayrollMonth(
        { effectiveFrom: new Date('2026-01-01T00:00:00.000Z'), effectiveTo: novemberEnd },
        '2026-12',
      ),
    ).toBe(false);
  });

  it('detects overlapping open-ended month ranges', () => {
    expect(
      payrollMonthRangesOverlap({ from: '2026-01', to: null }, { from: '2026-12', to: null }),
    ).toBe(true);
    expect(
      payrollMonthRangesOverlap({ from: '2026-01', to: '2026-11' }, { from: '2026-12', to: null }),
    ).toBe(false);
  });
});
