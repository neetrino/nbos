import { describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';

import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';

const RELEASE_AMOUNT = new Decimal(300_000);
const ORIGINAL_CARRY = new Decimal(100_000);

function createTxMock() {
  return {
    payrollRun: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'run1',
        status: 'DRAFT',
        payrollMonth: '2026-04',
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    bonusRelease: {
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    bonusEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    salaryLine: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'sl-april',
        payrollRunId: 'run1',
        employeeId: 'e1',
        baseSalary: new Decimal(100_000),
        bonusesTotal: new Decimal(0),
        totalPayable: new Decimal(100_000),
        paidAmount: new Decimal(0),
        remainingAmount: new Decimal(100_000),
        status: 'PENDING',
      }),
      update: vi.fn().mockResolvedValue({}),
      aggregate: vi.fn().mockResolvedValue({
        _sum: {
          baseSalary: new Decimal(100_000),
          bonusesTotal: new Decimal(0),
          totalPayable: new Decimal(100_000),
          paidAmount: new Decimal(0),
        },
      }),
    },
    compensationProfile: { findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn() },
    kpiPolicy: { findFirst: vi.fn() },
    kpiResult: { findFirst: vi.fn() },
  };
}

async function attachStoredCarry(params: {
  storedAmount: Decimal | null;
  storedRemaining: Decimal | null;
  expectedIncluded: Decimal;
  expectedRemembered: Decimal | null;
}): Promise<void> {
  const tx = createTxMock();
  tx.bonusRelease.findMany.mockResolvedValue([
    {
      id: 'rel-april',
      employeeId: 'e1',
      amount: RELEASE_AMOUNT,
      status: 'APPROVED',
      payrollRunId: null,
      payrollCarryOverAmount: params.storedAmount,
      payrollCarryOverRemaining: params.storedRemaining,
      bonusEntry: { id: 'be1', type: 'DELIVERY', order: { code: 'ORD-1' } },
    },
  ]);

  await attachBonusReleasesToPayrollRun(tx as never, {
    payrollRunId: 'run1',
    releaseIds: ['rel-april'],
  });

  expect(tx.bonusRelease.update).toHaveBeenCalledWith({
    where: { id: 'rel-april' },
    data: expect.objectContaining({
      payrollIncludedAmount: params.expectedIncluded,
      payrollCarryOverAmount: params.expectedRemembered,
      payrollCarryOverRemaining: null,
    }),
  });
  expect(tx.salaryLine.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        bonusesTotal: params.expectedIncluded,
      }),
    }),
  );
}

describe('attachBonusReleasesToPayrollRun consumed carry', () => {
  it('includes 200000 and remembers 100000 when later month consumed the carry', async () => {
    await attachStoredCarry({
      storedAmount: ORIGINAL_CARRY,
      storedRemaining: null,
      expectedIncluded: new Decimal(200_000),
      expectedRemembered: new Decimal(100_000),
    });
  });

  it('includes 300000 and clears carry when none of the 100000 was consumed', async () => {
    await attachStoredCarry({
      storedAmount: ORIGINAL_CARRY,
      storedRemaining: new Decimal(100_000),
      expectedIncluded: new Decimal(300_000),
      expectedRemembered: null,
    });
  });

  it('includes 240000 and remembers 60000 when 40000 remains unpaid', async () => {
    await attachStoredCarry({
      storedAmount: ORIGINAL_CARRY,
      storedRemaining: new Decimal(40_000),
      expectedIncluded: new Decimal(240_000),
      expectedRemembered: new Decimal(60_000),
    });
  });

  it('second cycle still includes 200000 while remembered consumed stays 100000', async () => {
    await attachStoredCarry({
      storedAmount: new Decimal(100_000),
      storedRemaining: null,
      expectedIncluded: new Decimal(200_000),
      expectedRemembered: new Decimal(100_000),
    });
  });

  it('partial second cycle still includes 240000', async () => {
    await attachStoredCarry({
      storedAmount: new Decimal(60_000),
      storedRemaining: null,
      expectedIncluded: new Decimal(240_000),
      expectedRemembered: new Decimal(60_000),
    });
  });

  it('includes the full amount for a brand-new release with no carry', async () => {
    await attachStoredCarry({
      storedAmount: null,
      storedRemaining: null,
      expectedIncluded: RELEASE_AMOUNT,
      expectedRemembered: null,
    });
  });
});
