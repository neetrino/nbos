import { describe, it, expect } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { queryPayrollRunBonusReleases } from './payroll-run-bonus-releases';

describe('queryPayrollRunBonusReleases', () => {
  it('throws when run missing', async () => {
    const prisma = createMockPrisma();
    prisma.payrollRun.findUnique.mockResolvedValue(null);
    await expect(queryPayrollRunBonusReleases(prisma as never, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns included and available rows for draft run', async () => {
    const prisma: MockPrisma = createMockPrisma();
    prisma.payrollRun.findUnique.mockResolvedValue({
      id: 'run-1',
      payrollMonth: '2026-04',
      status: 'DRAFT',
    });
    prisma.salaryLine.findMany.mockResolvedValue([{ employeeId: 'e1' }]);
    prisma.bonusRelease.findMany
      .mockResolvedValueOnce([
        {
          id: 'inc-1',
          bonusEntryId: 'be-1',
          employeeId: 'e1',
          amount: new Decimal(100),
          payrollIncludedAmount: new Decimal(80),
          releaseType: 'STANDARD',
          status: 'INCLUDED_IN_PAYROLL',
          bonusEntry: { type: 'DELIVERY', order: { code: 'O1' } },
          employee: { firstName: 'A', lastName: 'B' },
          project: { code: 'P1', name: 'Proj' },
          product: { name: 'Web' },
          extension: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'av-1',
          bonusEntryId: 'be-2',
          employeeId: 'e1',
          amount: new Decimal(50),
          payrollIncludedAmount: null,
          releaseType: 'STANDARD',
          status: 'APPROVED',
          bonusEntry: { type: 'PM', order: { code: 'O2' } },
          employee: { firstName: 'A', lastName: 'B' },
          project: { code: 'P1', name: 'Proj' },
          product: null,
          extension: null,
        },
      ]);

    const result = await queryPayrollRunBonusReleases(prisma as never, 'run-1');

    expect(result.canAttach).toBe(true);
    expect(result.included).toHaveLength(1);
    expect(result.included[0].payrollIncludedAmount).toBe('80.00');
    expect(result.availableToAttach).toHaveLength(1);
  });
});
