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
  releasedAmount: '40.00',
  paidAmount: '40.00',
  remainingAmount: '60.00',
  payrollMonth: '2026-05',
  orderPaymentType: 'CLASSIC',
  salesAccrualHint: 'Seller · Classic',
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
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain('_grand_total');
    expect(lines[2]).toContain('100.00');
  });

  it('grand total sums bonus amounts', () => {
    const csv = buildWalletBonusesCsvContent([
      bonusRow,
      { ...bonusRow, id: 'b2', amount: '25.50' },
    ]);
    const last = csv.split('\r\n').pop();
    expect(last).toContain('125.50');
    expect(last).toContain('All bonus rows (2)');
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
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain('_grand_total');
    expect(lines[2]).toContain('1000.00');
  });

  it('grand total sums salary money columns', () => {
    const csv = buildWalletSalaryCsvContent([
      salaryRow,
      {
        ...salaryRow,
        id: 's2',
        baseSalary: '500',
        bonusesTotal: '100',
        totalPayable: '600',
        paidAmount: '200',
        remainingAmount: '400',
      },
    ]);
    const last = csv.split('\r\n').pop();
    expect(last).toContain('1500.00');
    expect(last).toContain('100.00');
    expect(last).toContain('1600.00');
    expect(last).toContain('200.00');
    expect(last).toContain('1400.00');
    expect(last).toContain('All payroll rows (2)');
  });

  it('header only when empty', () => {
    expect(buildWalletSalaryCsvContent([])).toMatch(/^id,/);
  });
});
