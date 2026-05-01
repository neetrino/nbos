import { describe, expect, it } from 'vitest';
import {
  PAYROLL_RUNS_LIST_MONTH_FROM_QUERY,
  PAYROLL_RUNS_LIST_MONTH_TO_QUERY,
  PAYROLL_RUNS_LIST_STATUS_QUERY,
  parsePayrollRunsListMonthParam,
  parsePayrollRunsListStatusParam,
  payrollRunsListHref,
} from './payroll-runs-list-url';

describe('parsePayrollRunsListStatusParam', () => {
  it('returns ALL when missing or invalid', () => {
    expect(parsePayrollRunsListStatusParam(null)).toBe('ALL');
    expect(parsePayrollRunsListStatusParam('')).toBe('ALL');
    expect(parsePayrollRunsListStatusParam('UNKNOWN')).toBe('ALL');
  });

  it('accepts valid status values', () => {
    expect(parsePayrollRunsListStatusParam('APPROVED')).toBe('APPROVED');
    expect(parsePayrollRunsListStatusParam('draft')).toBe('DRAFT');
  });
});

describe('parsePayrollRunsListMonthParam', () => {
  it('returns undefined when missing or invalid', () => {
    expect(parsePayrollRunsListMonthParam(null)).toBeUndefined();
    expect(parsePayrollRunsListMonthParam('')).toBeUndefined();
    expect(parsePayrollRunsListMonthParam('2026-13')).toBeUndefined();
  });

  it('accepts YYYY-MM', () => {
    expect(parsePayrollRunsListMonthParam('2026-01')).toBe('2026-01');
  });
});

describe('payrollRunsListHref', () => {
  it('omits query for ALL or empty', () => {
    expect(payrollRunsListHref()).toBe('/finance/payroll');
    expect(payrollRunsListHref('ALL')).toBe('/finance/payroll');
  });

  it('sets status query', () => {
    expect(payrollRunsListHref('CLOSED')).toBe(
      `/finance/payroll?${PAYROLL_RUNS_LIST_STATUS_QUERY}=CLOSED`,
    );
  });

  it('sets month range without status', () => {
    expect(
      payrollRunsListHref(undefined, { payrollMonthFrom: '2026-01', payrollMonthTo: '2026-03' }),
    ).toBe(
      `/finance/payroll?${PAYROLL_RUNS_LIST_MONTH_FROM_QUERY}=2026-01&${PAYROLL_RUNS_LIST_MONTH_TO_QUERY}=2026-03`,
    );
  });
});
