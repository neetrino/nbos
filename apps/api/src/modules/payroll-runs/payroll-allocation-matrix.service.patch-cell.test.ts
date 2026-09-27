import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PayrollAllocationMatrixService } from './payroll-allocation-matrix.service';
import type { PayrollAllocationMatrixDto } from './payroll-allocation-matrix.types';

const ACTOR = {
  id: 'emp1',
  permissions: { FINANCE_SALARY_EDIT: 'ALL' },
  departmentIds: [] as string[],
};

const PAYROLL_MONTH = '2026-05';
const BODY = { employeeId: 'e1', orderId: 'o1' };

function visibleEntry(type = 'DELIVERY') {
  return {
    id: 'be1',
    employeeId: 'e1',
    type,
    amount: new Decimal(50),
    payableAmount: new Decimal(50),
    earnedPeriod: '2026-04',
    dealId: 'deal1',
    salesAccrualInvoiceId: 'inv1',
    calculationSnapshot: { source: 'test' },
  };
}

function createPatchCellPrisma(
  opts: {
    availableFunding?: string;
    productStatus?: string;
    entryType?: string;
  } = {},
) {
  return {
    payrollRun: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'pr1',
        status: 'DRAFT',
        payrollMonth: PAYROLL_MONTH,
      }),
    },
    order: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'o1',
        projectId: 'p1',
        product: { status: opts.productStatus ?? 'DONE' },
        extension: null,
        productBonusPool: { availableFunding: new Decimal(opts.availableFunding ?? '1000') },
        bonusEntries: [visibleEntry(opts.entryType ?? 'DELIVERY')],
      }),
    },
    bonusRelease: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    payrollBonusAllocationDraft: {
      upsert: vi.fn().mockResolvedValue({ id: 'draft-1' }),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

function serviceWithPrisma(prisma: ReturnType<typeof createPatchCellPrisma>) {
  const service = new PayrollAllocationMatrixService(prisma as never);
  vi.spyOn(service, 'getMatrix').mockResolvedValue({
    payrollRunId: 'pr1',
  } as PayrollAllocationMatrixDto);
  return service;
}

describe('PayrollAllocationMatrixService.patchCell exception reason', () => {
  let prisma: ReturnType<typeof createPatchCellPrisma>;
  let service: PayrollAllocationMatrixService;

  beforeEach(() => {
    prisma = createPatchCellPrisma();
    service = serviceWithPrisma(prisma);
  });

  it.each([
    { label: 'extra', releaseThisMonth: '80', funding: '1000' },
    { label: 'over-funding', releaseThisMonth: '40', funding: '20' },
  ])('does not upsert a $label save without a reason', async ({ releaseThisMonth, funding }) => {
    prisma = createPatchCellPrisma({ availableFunding: funding });
    service = serviceWithPrisma(prisma);

    await expect(
      service.patchCell('pr1', ACTOR, { ...BODY, releaseThisMonth }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.payrollBonusAllocationDraft.upsert).not.toHaveBeenCalled();
  });

  it('does not upsert a non-sales PROGRESS cell with a blank reason', async () => {
    prisma = createPatchCellPrisma({ productStatus: 'IN_PROGRESS', entryType: 'DELIVERY' });
    service = serviceWithPrisma(prisma);

    await expect(
      service.patchCell('pr1', ACTOR, { ...BODY, releaseThisMonth: '30', reason: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.payrollBonusAllocationDraft.upsert).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'extra', releaseThisMonth: '80', funding: '1000', kind: 'EXTRA_BONUS' },
    { label: 'over-funding', releaseThisMonth: '40', funding: '20', kind: 'OVER_FUNDING' },
  ])(
    'upserts one $label draft when a reason is written',
    async ({ releaseThisMonth, funding, kind }) => {
      prisma = createPatchCellPrisma({ availableFunding: funding });
      service = serviceWithPrisma(prisma);

      await service.patchCell('pr1', ACTOR, {
        ...BODY,
        releaseThisMonth,
        reason: '  CEO approved extra  ',
      });
      await service.patchCell('pr1', ACTOR, {
        ...BODY,
        releaseThisMonth,
        reason: 'CEO approved extra',
      });

      expect(prisma.payrollBonusAllocationDraft.create).not.toHaveBeenCalled();
      expect(prisma.payrollBonusAllocationDraft.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.payrollBonusAllocationDraft.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            payrollRunId_employeeId_orderId: {
              payrollRunId: 'pr1',
              employeeId: 'e1',
              orderId: 'o1',
            },
          },
          create: expect.objectContaining({
            kind,
            reason: 'CEO approved extra',
          }),
          update: expect.objectContaining({
            kind,
            reason: 'CEO approved extra',
          }),
        }),
      );
    },
  );

  it('upserts one PROGRESS draft when a non-sales early reason is written', async () => {
    prisma = createPatchCellPrisma({ productStatus: 'IN_PROGRESS', entryType: 'DELIVERY' });
    service = serviceWithPrisma(prisma);

    await service.patchCell('pr1', ACTOR, {
      ...BODY,
      releaseThisMonth: '30',
      reason: '  pay before done  ',
    });
    await service.patchCell('pr1', ACTOR, {
      ...BODY,
      releaseThisMonth: '30',
      reason: 'pay before done',
    });

    expect(prisma.payrollBonusAllocationDraft.create).not.toHaveBeenCalled();
    expect(prisma.payrollBonusAllocationDraft.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.payrollBonusAllocationDraft.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          kind: 'PROGRESS',
          reason: 'pay before done',
        }),
      }),
    );
  });

  it('saves a closed-product in-remainder allocation without an exception reason', async () => {
    await service.patchCell('pr1', ACTOR, { ...BODY, releaseThisMonth: '30' });

    expect(prisma.payrollBonusAllocationDraft.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.payrollBonusAllocationDraft.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          kind: 'READY',
          reason: null,
        }),
      }),
    );
  });

  it('saves a SALES PROGRESS amount without an exception reason', async () => {
    prisma = createPatchCellPrisma({ productStatus: 'IN_PROGRESS', entryType: 'SALES' });
    service = serviceWithPrisma(prisma);

    await service.patchCell('pr1', ACTOR, { ...BODY, releaseThisMonth: '30' });

    expect(prisma.payrollBonusAllocationDraft.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.payrollBonusAllocationDraft.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          kind: 'PROGRESS',
          reason: null,
        }),
      }),
    );
  });
});
