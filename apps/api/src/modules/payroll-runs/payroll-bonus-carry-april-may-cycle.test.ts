import { describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';

import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';
import { detachBonusReleasesFromPayrollRun } from './payroll-bonus-release-detach';

type MoneyLine = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  baseSalary: Decimal;
  bonusesTotal: Decimal;
  totalPayable: Decimal;
  paidAmount: Decimal;
  remainingAmount: Decimal;
  status: string;
  payrollCarryAppliedAmount: Decimal | null;
};

function createCycleTx() {
  const aprilRelease = {
    id: 'rel-april',
    employeeId: 'e1',
    amount: new Decimal(300_000),
    payrollIncludedAmount: null as Decimal | null,
    payrollCarryOverAmount: new Decimal(100_000) as Decimal | null,
    payrollCarryOverRemaining: null as Decimal | null,
    status: 'APPROVED',
    payrollRunId: null as string | null,
    releaseType: 'MANUAL',
    bonusEntry: { id: 'be1', type: 'DELIVERY', order: { code: 'ORD-1' } },
  };
  const mayRelease = {
    id: 'rel-may',
    employeeId: 'e1',
    amount: new Decimal(50),
    payrollIncludedAmount: new Decimal(50),
    payrollCarryOverAmount: null as Decimal | null,
    payrollCarryOverRemaining: null as Decimal | null,
    status: 'INCLUDED_IN_PAYROLL',
    payrollRunId: 'run-may' as string | null,
    releaseType: 'MANUAL',
    bonusEntry: { id: 'be1', type: 'DELIVERY', order: { code: 'ORD-1' } },
  };
  const aprilLine: MoneyLine = {
    id: 'sl-april',
    payrollRunId: 'run-april',
    employeeId: 'e1',
    baseSalary: new Decimal(100_000),
    bonusesTotal: new Decimal(0),
    totalPayable: new Decimal(100_000),
    paidAmount: new Decimal(0),
    remainingAmount: new Decimal(100_000),
    status: 'PENDING',
    payrollCarryAppliedAmount: null,
  };
  const mayLine: MoneyLine = {
    id: 'sl-may',
    payrollRunId: 'run-may',
    employeeId: 'e1',
    baseSalary: new Decimal(100_000),
    bonusesTotal: new Decimal(100_050),
    totalPayable: new Decimal(200_050),
    paidAmount: new Decimal(0),
    remainingAmount: new Decimal(200_050),
    status: 'PENDING',
    payrollCarryAppliedAmount: new Decimal(100_000),
  };

  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    payrollRun: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    bonusRelease: {
      findMany: vi.fn(),
      findUnique: vi.fn().mockImplementation((args: { where: { id: string } }) => {
        if (args.where.id === aprilRelease.id) {
          return Promise.resolve(aprilRelease);
        }
        if (args.where.id === mayRelease.id) {
          return Promise.resolve(mayRelease);
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation((args: { where: { id: string }; data: object }) => {
        if (args.where.id === 'rel-april') {
          Object.assign(aprilRelease, args.data);
        }
        if (args.where.id === 'rel-may') {
          Object.assign(mayRelease, args.data);
        }
        return Promise.resolve({});
      }),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    bonusEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    salaryLine: {
      findUnique: vi.fn(),
      update: vi.fn().mockImplementation((args: { where: { id: string }; data: object }) => {
        if (args.where.id === 'sl-may') {
          Object.assign(mayLine, args.data);
        }
        if (args.where.id === 'sl-april') {
          Object.assign(aprilLine, args.data);
        }
        return Promise.resolve({});
      }),
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
    aprilRelease,
    mayRelease,
    aprilLine,
    mayLine,
  };

  return tx;
}

describe('April/May carry cycle', () => {
  it('detach April, detach all May, re-attach April totals 300000', async () => {
    const tx = createCycleTx();
    tx.payrollRun.findUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === 'run-may') {
        return Promise.resolve({ id: 'run-may', status: 'DRAFT', payrollMonth: '2026-05' });
      }
      return Promise.resolve({ id: 'run-april', status: 'DRAFT', payrollMonth: '2026-04' });
    });
    tx.bonusRelease.findMany.mockImplementation(
      (args: { where?: { id?: { in?: string[] }; payrollCarryOverAmount?: unknown } }) => {
        if (args.where?.id?.in?.includes('rel-may')) {
          return Promise.resolve([tx.mayRelease]);
        }
        if (args.where?.id?.in?.includes('rel-april')) {
          return Promise.resolve([tx.aprilRelease]);
        }
        if (args.where?.payrollCarryOverAmount) {
          return Promise.resolve([tx.aprilRelease]);
        }
        return Promise.resolve([]);
      },
    );
    tx.salaryLine.findUnique.mockImplementation(
      (args: { where: { payrollRunId_employeeId?: { payrollRunId: string } } }) => {
        const runId = args.where.payrollRunId_employeeId?.payrollRunId;
        return Promise.resolve(runId === 'run-may' ? tx.mayLine : tx.aprilLine);
      },
    );

    await detachBonusReleasesFromPayrollRun(tx as never, {
      payrollRunId: 'run-may',
      releaseIds: ['rel-may'],
    });

    expect(tx.aprilRelease.payrollCarryOverRemaining?.toString()).toBe('100000');
    expect(tx.mayLine.payrollCarryAppliedAmount).toBeNull();
    expect(tx.mayLine.bonusesTotal.toString()).toBe('0');

    await attachBonusReleasesToPayrollRun(tx as never, {
      payrollRunId: 'run-april',
      releaseIds: ['rel-april'],
    });

    expect(tx.aprilRelease.payrollIncludedAmount?.toString()).toBe('300000');
    expect(tx.aprilLine.bonusesTotal.plus(tx.mayLine.bonusesTotal).toString()).toBe('300000');
  });

  it('re-attach onto June then detach May moves 100000 onto June', async () => {
    const tx = createCycleTx();
    tx.aprilRelease.status = 'INCLUDED_IN_PAYROLL';
    tx.aprilRelease.payrollRunId = 'run-june';
    tx.aprilRelease.payrollIncludedAmount = new Decimal(200_000);
    tx.aprilRelease.payrollCarryOverAmount = new Decimal(100_000);
    tx.aprilRelease.payrollCarryOverRemaining = null;
    tx.aprilLine.payrollRunId = 'run-june';
    tx.aprilLine.bonusesTotal = new Decimal(200_000);
    tx.aprilLine.totalPayable = new Decimal(300_000);
    tx.aprilLine.remainingAmount = new Decimal(300_000);

    tx.payrollRun.findUnique.mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === 'run-may') {
        return Promise.resolve({ id: 'run-may', status: 'DRAFT', payrollMonth: '2026-05' });
      }
      return Promise.resolve({ id: 'run-june', status: 'DRAFT', payrollMonth: '2026-06' });
    });
    tx.bonusRelease.findMany.mockImplementation(
      (args: { where?: { id?: { in?: string[] }; payrollCarryOverAmount?: unknown } }) => {
        if (args.where?.id?.in?.includes('rel-may')) {
          return Promise.resolve([tx.mayRelease]);
        }
        if (args.where?.payrollCarryOverAmount) {
          return Promise.resolve([tx.aprilRelease]);
        }
        return Promise.resolve([]);
      },
    );
    tx.salaryLine.findUnique.mockImplementation(
      (args: { where: { payrollRunId_employeeId?: { payrollRunId: string } } }) => {
        const runId = args.where.payrollRunId_employeeId?.payrollRunId;
        return Promise.resolve(runId === 'run-may' ? tx.mayLine : tx.aprilLine);
      },
    );

    await detachBonusReleasesFromPayrollRun(tx as never, {
      payrollRunId: 'run-may',
      releaseIds: ['rel-may'],
    });

    expect(tx.aprilRelease.payrollIncludedAmount?.toString()).toBe('300000');
    expect(tx.aprilRelease.payrollCarryOverAmount).toBeNull();
    expect(tx.mayLine.payrollCarryAppliedAmount).toBeNull();
    expect(tx.aprilLine.bonusesTotal.plus(tx.mayLine.bonusesTotal).toString()).toBe('300000');
  });
});
