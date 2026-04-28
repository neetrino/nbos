import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { EmployeeWalletService } from './employee-wallet.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('EmployeeWalletService', () => {
  let service: EmployeeWalletService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new EmployeeWalletService(prisma as never);
  });

  it('throws when employee missing', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    await expect(service.getWallet('missing')).rejects.toThrow(NotFoundException);
  });

  it('returns snapshot with bonuses and salary lines', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'e1',
      firstName: 'A',
      lastName: 'B',
      position: 'Dev',
      level: 'MID',
      baseSalary: new Decimal(100_000),
      role: { name: 'Developer' },
    });
    prisma.bonusEntry.findMany.mockResolvedValue([
      {
        id: 'b1',
        type: 'SALES',
        status: 'EARNED',
        amount: new Decimal(10_000),
        percent: new Decimal(5),
        project: { code: 'P1', name: 'Proj' },
        order: { code: 'O1' },
        createdAt: new Date('2026-01-01'),
      },
    ]);
    prisma.salaryLine.findMany.mockResolvedValue([
      {
        id: 'sl1',
        payrollRunId: 'run-1',
        baseSalary: new Decimal(100_000),
        bonusesTotal: new Decimal(0),
        totalPayable: new Decimal(100_000),
        paidAmount: new Decimal(0),
        remainingAmount: new Decimal(100_000),
        status: 'APPROVED',
        payrollRun: { payrollMonth: '2026-03', status: 'APPROVED' },
        expense: { id: 'ex1' },
      },
    ]);

    const snap = await service.getWallet('e1');
    expect(snap.employee.baseSalary).toBe('100000');
    expect(snap.bonuses).toHaveLength(1);
    expect(snap.bonuses[0].walletGroup).toBe('IN_PROGRESS');
    expect(snap.salaryHistory).toHaveLength(1);
    expect(snap.salaryHistory[0].expenseId).toBe('ex1');
    expect(snap.salaryHistory[0].payrollRunId).toBe('run-1');
  });
});
