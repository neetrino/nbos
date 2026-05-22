import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { findSalaryLinesBlockingPayrollClose } from './payroll-run-close-validation';

describe('findSalaryLinesBlockingPayrollClose', () => {
  it('allows close when all payable lines are PAID', () => {
    const count = findSalaryLinesBlockingPayrollClose([
      { status: 'PAID', totalPayable: new Decimal(100) },
      { status: 'PAID', totalPayable: new Decimal(50) },
    ]);
    expect(count).toBe(0);
  });

  it('allows close for zero-payable lines in any status', () => {
    const count = findSalaryLinesBlockingPayrollClose([
      { status: 'PENDING', totalPayable: new Decimal(0) },
      { status: 'APPROVED', totalPayable: new Decimal(0) },
    ]);
    expect(count).toBe(0);
  });

  it('allows HELD payable lines', () => {
    const count = findSalaryLinesBlockingPayrollClose([
      { status: 'HELD', totalPayable: new Decimal(200) },
    ]);
    expect(count).toBe(0);
  });

  it('blocks APPROVED or PARTIALLY_PAID payable lines', () => {
    const count = findSalaryLinesBlockingPayrollClose([
      { status: 'APPROVED', totalPayable: new Decimal(100) },
      { status: 'PARTIALLY_PAID', totalPayable: new Decimal(80) },
    ]);
    expect(count).toBe(2);
  });
});
