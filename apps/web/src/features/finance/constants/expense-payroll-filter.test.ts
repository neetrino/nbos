import { describe, expect, it } from 'vitest';
import {
  EXPENSE_PAYROLL_EMPLOYEE_URL_QUERY,
  EXPENSE_PAYROLL_MONTH_URL_QUERY,
  EXPENSE_PAYROLL_PRESET_QUERY,
  expensesPayrollPresetHref,
} from './expense-payroll-filter';

describe('expensesPayrollPresetHref', () => {
  it('builds preset URL with month and employee', () => {
    const href = expensesPayrollPresetHref({
      payrollMonth: '2026-04',
      employeeId: 'emp-1',
    });
    const url = new URL(href, 'https://app.test');
    expect(url.pathname).toBe('/finance/expenses');
    expect(url.searchParams.get(EXPENSE_PAYROLL_PRESET_QUERY)).toBe('1');
    expect(url.searchParams.get(EXPENSE_PAYROLL_MONTH_URL_QUERY)).toBe('2026-04');
    expect(url.searchParams.get(EXPENSE_PAYROLL_EMPLOYEE_URL_QUERY)).toBe('emp-1');
  });
});
