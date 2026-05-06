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
        orderId: 'ord-1',
        projectId: 'proj-1',
        type: 'SALES',
        status: 'EARNED',
        amount: new Decimal(10_000),
        percent: new Decimal(5),
        salesBonusSlot: 'SELLER',
        calculationSnapshot: { paymentModel: 'CLASSIC' },
        project: { code: 'P1', name: 'Proj' },
        order: { code: 'O1', paymentType: 'CLASSIC' },
        createdAt: new Date('2026-01-01'),
      },
    ]);
    prisma.bonusRelease.findMany.mockImplementation(
      async (args: { where?: Record<string, unknown> }) => {
        if (args.where && 'bonusEntryId' in args.where) {
          return [
            {
              bonusEntryId: 'b1',
              amount: new Decimal(2000),
              status: 'PAID',
              releaseType: 'AUTO',
              updatedAt: new Date('2026-01-15'),
              payrollRun: { payrollMonth: '2026-02' },
            },
          ];
        }
        return [
          {
            id: 'rel-1',
            status: 'PAID',
            amount: new Decimal(2000),
            updatedAt: new Date('2026-01-15'),
            payrollRunId: 'run-pr',
            payrollRun: { id: 'run-pr', payrollMonth: '2026-02' },
            bonusEntry: { order: { code: 'O1' } },
          },
        ];
      },
    );
    prisma.productBonusPool.findMany.mockResolvedValue([
      {
        orderId: 'ord-1',
        availableFunding: new Decimal(50_000),
        overFundingAmount: new Decimal(0),
        totalPlannedAmount: new Decimal(10_000),
        totalReleasedAmount: new Decimal(2000),
        totalPaidAmount: new Decimal(2000),
        totalRemainingAmount: new Decimal(8000),
        status: 'PARTIALLY_RELEASED',
        product: { name: 'Website' },
        extension: null,
      },
    ]);
    prisma.salaryLine.findMany.mockResolvedValue([
      {
        id: 'sl1',
        payrollRunId: 'run-1',
        baseSalary: new Decimal(100_000),
        bonusesTotal: new Decimal(0),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
        totalPayable: new Decimal(100_000),
        paidAmount: new Decimal(0),
        remainingAmount: new Decimal(100_000),
        status: 'APPROVED',
        payrollRun: { payrollMonth: '2026-03', status: 'APPROVED' },
        expense: { id: 'ex1', expensePayments: [] },
      },
    ]);

    const snap = await service.getWallet('e1');
    expect(snap.employee.baseSalary).toBe('100000');
    expect(snap.bonuses).toHaveLength(1);
    expect(snap.bonuses[0].productLabel).toBe('Website');
    expect(snap.bonuses[0].walletGroup).toBe('IN_PROGRESS');
    expect(snap.bonuses[0].releasedAmount).toBe('2000.00');
    expect(snap.bonuses[0].paidAmount).toBe('2000.00');
    expect(snap.bonuses[0].remainingAmount).toBe('8000.00');
    expect(snap.bonuses[0].payrollMonth).toBe('2026-02');
    expect(snap.bonuses[0].salesAccrualHint).toBe('Seller · Classic');
    expect(snap.nextPayroll?.payrollMonth).toBe('2026-03');
    expect(snap.nextPayroll?.payrollRunId).toBe('run-1');
    expect(snap.salaryHistory).toHaveLength(1);
    expect(snap.salaryHistory[0].expenseId).toBe('ex1');
    expect(snap.salaryHistory[0].payrollRunId).toBe('run-1');
    expect(snap.projectBreakdown).toHaveLength(1);
    expect(snap.projectBreakdown[0].order.code).toBe('O1');
    expect(snap.projectBreakdown[0].productLabel).toBe('Website');
    expect(snap.projectBreakdown[0].payoutState).toBe('PARTIAL');
    expect(snap.activity.some((a) => a.kind === 'BONUS_RELEASE')).toBe(true);
  });
});
