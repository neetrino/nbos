import { describe, expect, it } from 'vitest';
import {
  PAYROLL_RUNS_LIST_STATUS_QUERY,
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
});
