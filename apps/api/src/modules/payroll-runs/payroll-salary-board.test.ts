import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  addPayrollMonths,
  enumeratePayrollMonths,
  querySalaryBoard,
  SALARY_BOARD_MAX_MONTH_SPAN,
} from './payroll-salary-board';

describe('payroll-salary-board helpers', () => {
  it('addPayrollMonths rolls across year boundaries', () => {
    expect(addPayrollMonths('2025-12', 1)).toBe('2026-01');
    expect(addPayrollMonths('2026-01', -1)).toBe('2025-12');
  });

  it('enumeratePayrollMonths is inclusive', () => {
    expect(enumeratePayrollMonths('2026-01', '2026-03')).toEqual(['2026-01', '2026-02', '2026-03']);
  });
});

describe('querySalaryBoard', () => {
  it('rejects invalid month token', async () => {
    const prisma = createMockPrisma();
    await expect(
      querySalaryBoard(prisma as never, { payrollMonthFrom: '2026-13', payrollMonthTo: '2026-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('builds grid for one month with a salary line', async () => {
    const prisma: MockPrisma = createMockPrisma();
    prisma.employee.findMany.mockResolvedValue([
      {
        id: 'e1',
        firstName: 'A',
        lastName: 'Zed',
        position: null,
        departments: [{ departmentId: 'd-sales', isPrimary: true }],
      },
    ]);
    prisma.payrollRun.findMany.mockResolvedValue([
      { id: 'r1', payrollMonth: '2026-04', status: 'DRAFT' },
    ]);
    prisma.salaryLine.findMany.mockResolvedValue([
      {
        id: 'sl1',
        payrollRunId: 'r1',
        employeeId: 'e1',
        totalPayable: new Decimal('100.00'),
        paidAmount: new Decimal('0'),
        remainingAmount: new Decimal('100.00'),
        status: 'PENDING',
      },
    ]);

    const result = await querySalaryBoard(prisma as never, {
      payrollMonthFrom: '2026-04',
      payrollMonthTo: '2026-04',
    });

    expect(result.months).toEqual(['2026-04']);
    expect(result.columns[0]).toMatchObject({
      payrollMonth: '2026-04',
      payrollRunId: 'r1',
      runStatus: 'DRAFT',
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].employee).toMatchObject({
      departmentIds: ['d-sales'],
      primaryDepartmentId: 'd-sales',
    });
    expect(result.rows[0].cells[0]).toMatchObject({
      salaryLineId: 'sl1',
      payrollRunId: 'r1',
      lineStatus: 'PENDING',
      totalPayable: '100.00',
    });
  });

  it('rejects ranges wider than max span', async () => {
    const prisma = createMockPrisma();
    const from = '2026-01';
    const to = addPayrollMonths(from, SALARY_BOARD_MAX_MONTH_SPAN);
    await expect(
      querySalaryBoard(prisma as never, { payrollMonthFrom: from, payrollMonthTo: to }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
