import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { materializePayrollBonusAllocationDrafts } from './payroll-bonus-allocation-materialize';

vi.mock('./payroll-bonus-release-attach', () => ({
  attachBonusReleasesToPayrollRun: vi.fn().mockResolvedValue([]),
}));

type DraftRow = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  orderId: string;
  projectId: string;
  bonusEntryId: string | null;
  amount: Decimal;
  kind: string;
  title: string | null;
  reason: string | null;
};

function extraDraft(reason: string | null): DraftRow {
  return {
    id: 'd1',
    payrollRunId: 'pr1',
    employeeId: 'e1',
    orderId: 'o1',
    projectId: 'p1',
    bonusEntryId: 'be1',
    amount: new Decimal(80),
    kind: 'EXTRA_BONUS',
    title: null,
    reason,
  };
}

function createTx(drafts: DraftRow[]) {
  return {
    payrollBonusAllocationDraft: {
      findMany: vi.fn().mockResolvedValue(drafts),
      deleteMany: vi.fn().mockResolvedValue({ count: drafts.length }),
    },
    bonusEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'extra-1' }),
      update: vi.fn(),
    },
    bonusRelease: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'rel1' }),
    },
    order: {
      findUnique: vi.fn().mockResolvedValue({ productId: 'prod1', extensionId: null }),
    },
  };
}

describe('materializePayrollBonusAllocationDrafts exception reason', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not create a release for a reasonless extra draft', async () => {
    const tx = createTx([extraDraft(null)]);
    await expect(
      materializePayrollBonusAllocationDrafts(tx as never, {
        payrollRunId: 'pr1',
        payrollMonth: '2026-05',
        actorUserId: 'emp1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.bonusRelease.create).not.toHaveBeenCalled();
    expect(tx.payrollBonusAllocationDraft.deleteMany).not.toHaveBeenCalled();
  });

  it('does not create a release for a reasonless non-sales PROGRESS draft', async () => {
    const tx = createTx([{ ...extraDraft(null), amount: new Decimal(30), kind: 'PROGRESS' }]);
    tx.bonusEntry.findUnique.mockResolvedValue({
      type: 'DELIVERY',
      amount: new Decimal(50),
      payableAmount: new Decimal(50),
      earnedPeriod: '2026-04',
    });
    await expect(
      materializePayrollBonusAllocationDrafts(tx as never, {
        payrollRunId: 'pr1',
        payrollMonth: '2026-05',
        actorUserId: 'emp1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.bonusRelease.create).not.toHaveBeenCalled();
  });

  it('creates one EARLY APPROVED release for a reasoned non-sales PROGRESS draft', async () => {
    const tx = createTx([
      {
        ...extraDraft('pay before done'),
        amount: new Decimal(30),
        kind: 'PROGRESS',
      },
    ]);
    tx.bonusEntry.findUnique.mockResolvedValue({
      type: 'DELIVERY',
      amount: new Decimal(50),
      payableAmount: new Decimal(50),
      earnedPeriod: '2026-04',
    });

    const result = await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(result.releaseIds).toEqual(['rel1']);
    expect(tx.bonusRelease.create).toHaveBeenCalledTimes(1);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
          releaseType: 'EARLY',
          reason: 'pay before done',
        }),
      }),
    );
  });

  it('materializes SALES PROGRESS without an exception reason and not as EARLY', async () => {
    const tx = createTx([{ ...extraDraft(null), amount: new Decimal(30), kind: 'PROGRESS' }]);
    tx.bonusEntry.findUnique.mockResolvedValue({
      type: 'SALES',
      amount: new Decimal(50),
      payableAmount: new Decimal(50),
      earnedPeriod: '2026-04',
    });

    const result = await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(result.releaseIds).toEqual(['rel1']);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
          releaseType: 'MANUAL',
          reason: null,
        }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ releaseType: 'EARLY' }),
      }),
    );
  });

  it('creates one APPROVED release when the extra draft has a reason', async () => {
    const tx = createTx([extraDraft('CEO approved extra')]);
    const result = await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(result.releaseIds).toEqual(['rel1']);
    expect(tx.bonusRelease.create).toHaveBeenCalledTimes(1);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
          releaseType: 'EXTRA',
          reason: 'CEO approved extra',
        }),
      }),
    );
    expect(tx.payrollBonusAllocationDraft.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('still materializes an in-remainder draft without an exception reason', async () => {
    const tx = createTx([
      {
        ...extraDraft(null),
        amount: new Decimal(30),
        kind: 'READY',
      },
    ]);
    tx.bonusEntry.findUnique.mockResolvedValue({
      type: 'DELIVERY',
      amount: new Decimal(50),
      payableAmount: new Decimal(50),
      earnedPeriod: '2026-04',
    });

    const result = await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(result.releaseIds).toEqual(['rel1']);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
          releaseType: 'MANUAL',
          reason: null,
        }),
      }),
    );
  });
});
