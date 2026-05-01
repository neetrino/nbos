import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { buildPayrollRunWhereFromScope } from './payroll-run-list-scope';

describe('buildPayrollRunWhereFromScope', () => {
  it('returns empty object when no filters', () => {
    expect(buildPayrollRunWhereFromScope({})).toEqual({});
  });

  it('applies status when provided', () => {
    expect(buildPayrollRunWhereFromScope({ status: 'APPROVED' })).toEqual({
      status: 'APPROVED',
    });
  });

  it('applies month range', () => {
    expect(
      buildPayrollRunWhereFromScope({
        payrollMonthFrom: '2026-01',
        payrollMonthTo: '2026-03',
      }),
    ).toEqual({
      payrollMonth: { gte: '2026-01', lte: '2026-03' },
    });
  });

  it('rejects invalid month from', () => {
    expect(() => buildPayrollRunWhereFromScope({ payrollMonthFrom: '2026-13' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects when from is after to', () => {
    expect(() =>
      buildPayrollRunWhereFromScope({
        payrollMonthFrom: '2026-04',
        payrollMonthTo: '2026-01',
      }),
    ).toThrow(BadRequestException);
  });
});
