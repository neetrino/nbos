import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@nbos/database';
import { markPayrollBonusReleasesPaidForSalaryLine } from './payroll-bonus-release-paid-mark';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('markPayrollBonusReleasesPaidForSalaryLine', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('no-ops when no included releases', async () => {
    prisma.bonusRelease.findMany.mockResolvedValue([]);

    await markPayrollBonusReleasesPaidForSalaryLine(prisma as never, {
      payrollRunId: 'pr1',
      employeeId: 'e1',
    });

    expect(prisma.bonusRelease.updateMany).not.toHaveBeenCalled();
  });

  it('marks releases PAID, closes bonus entry, and resyncs pool', async () => {
    prisma.bonusRelease.findMany
      .mockResolvedValueOnce([{ id: 'r1', bonusEntryId: 'be1', amount: new Decimal(100) }])
      .mockResolvedValueOnce([
        {
          id: 'r1',
          amount: new Decimal(100),
          bonusEntry: { order: { code: 'O-1' } },
        },
      ]);
    prisma.bonusRelease.updateMany.mockResolvedValue({ count: 1 });
    prisma.payrollRun.findUnique.mockResolvedValue({ payrollMonth: new Date('2026-04-01') });
    prisma.bonusEntry.findUnique
      .mockResolvedValueOnce({
        id: 'be1',
        status: 'ACTIVE',
        amount: new Decimal(100),
        employeeId: 'e1',
        order: { code: 'O-1' },
      })
      .mockResolvedValueOnce({ orderId: 'o1' });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(100) } });
    prisma.order.findUnique.mockResolvedValue(null);

    await markPayrollBonusReleasesPaidForSalaryLine(prisma as never, {
      payrollRunId: 'pr1',
      employeeId: 'e1',
    });

    expect(prisma.bonusRelease.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['r1'] } },
      data: { status: 'PAID' },
    });
    expect(prisma.bonusEntry.update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: { status: 'PAID' },
    });
  });
});
