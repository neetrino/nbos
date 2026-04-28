import { describe, expect, it } from 'vitest';
import {
  buildWalletBonusesCsvContent,
  buildWalletSalaryCsvContent,
} from './export-employee-wallet-csv';
import type { EmployeeWalletBonusRow, EmployeeWalletSalaryRow } from '@/lib/api/me';

const bonusRow: EmployeeWalletBonusRow = {
  id: 'b1',
  type: 'SALES',
  status: 'VESTED',
  walletGroup: 'NEXT_PAYROLL',
  amount: '100.00',
  percent: '5',
  project: { code: 'P', name: 'Proj' },
  order: { code: 'O-1' },
  createdAt: '2026-04-01T00:00:00.000Z',
};

const salaryRow: EmployeeWalletSalaryRow = {
  id: 's1',
  payrollRunId: 'run-1',
  payrollMonth: '2026-04',
  runStatus: 'APPROVED',
  baseSalary: '1000',
  bonusesTotal: '0',
  totalPayable: '1000',
  paidAmount: '0',
  remainingAmount: '1000',
  lineStatus: 'APPROVED',
  expenseId: 'exp-1',
};

describe('buildWalletBonusesCsvContent', () => {
  it('includes header and bonus row', () => {
    const csv = buildWalletBonusesCsvContent([bonusRow]);
    expect(csv).toContain('walletGroup');
    expect(csv).toContain('NEXT_PAYROLL');
    expect(csv).toContain('Proj');
  });

  it('header only when empty', () => {
    expect(buildWalletBonusesCsvContent([])).toMatch(/^id,/);
  });
});

describe('buildWalletSalaryCsvContent', () => {
  it('includes header and salary row', () => {
    const csv = buildWalletSalaryCsvContent([salaryRow]);
    expect(csv).toContain('payrollRunId');
    expect(csv).toContain('2026-04');
    expect(csv).toContain('exp-1');
  });

  it('header only when empty', () => {
    expect(buildWalletSalaryCsvContent([])).toMatch(/^id,/);
  });
});
