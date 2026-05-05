import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  approvePartnerPayoutBatch,
  cancelPartnerPayoutBatch,
  createPartnerPayoutBatch,
  syncPartnerPayoutPaidFromExpense,
} from './partner-payout-batch.ops';

function mockBatchRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'batch-1',
    partnerId: 'partner-1',
    totalAmount: new Decimal('150.00'),
    status: 'DRAFT',
    payoutDate: null,
    expenseId: null,
    approvedBy: null,
    notes: null,
    createdAt: new Date('2026-05-05T00:00:00.000Z'),
    _count: { accruals: 2 },
    ...overrides,
  };
}

describe('partner payout batch ops', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('creates draft batch and moves eligible accruals to IN_BATCH', async () => {
    prisma.partnerAccrual.findMany.mockResolvedValue([
      { id: 'a1', amount: new Decimal('100') },
      { id: 'a2', amount: new Decimal('50') },
    ]);
    prisma.partnerPayoutBatch.create.mockResolvedValue({ id: 'batch-1' });
    prisma.partnerPayoutBatch.findFirst.mockResolvedValue(mockBatchRow());

    const result = await createPartnerPayoutBatch(prisma as never, 'partner-1', {
      accrualIds: ['a1', 'a2', 'a1'],
      notes: 'May payout',
    });

    expect(prisma.partnerPayoutBatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ partnerId: 'partner-1', totalAmount: new Decimal('150') }),
    });
    expect(prisma.partnerAccrual.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a1', 'a2'] }, status: 'ELIGIBLE', payoutBatchId: null },
      data: { status: 'IN_BATCH', payoutBatchId: 'batch-1' },
    });
    expect(result.totalAmount).toBe('150.00');
  });

  it('rejects accruals that are missing or not eligible', async () => {
    prisma.partnerAccrual.findMany.mockResolvedValue([{ id: 'a1', amount: new Decimal('100') }]);

    await expect(
      createPartnerPayoutBatch(prisma as never, 'partner-1', { accrualIds: ['a1', 'a2'] }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.partnerPayoutBatch.create).not.toHaveBeenCalled();
  });

  it('approves draft batch and creates partner payout expense', async () => {
    prisma.partnerPayoutBatch.findUnique.mockResolvedValue({
      id: 'batch-1',
      partnerId: 'partner-1',
      totalAmount: new Decimal('150'),
      status: 'DRAFT',
      payoutDate: null,
      notes: null,
      partner: { name: 'Referral Partner' },
      _count: { accruals: 2 },
    });
    prisma.expense.create.mockResolvedValue({ id: 'expense-1' });
    prisma.partnerPayoutBatch.findFirst.mockResolvedValue(
      mockBatchRow({ status: 'EXPENSE_CREATED', expenseId: 'expense-1' }),
    );

    const result = await approvePartnerPayoutBatch(prisma as never, 'partner-1', 'batch-1', {
      payoutDate: '2026-05-31T00:00:00.000Z',
      approvedBy: 'finance-1',
    });

    expect(prisma.expense.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        category: 'PARTNER_PAYOUT',
        amount: new Decimal('150'),
        status: 'UNPAID',
      }),
    });
    expect(prisma.partnerPayoutBatch.update).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
      data: expect.objectContaining({ status: 'EXPENSE_CREATED', expenseId: 'expense-1' }),
    });
    expect(result.expenseId).toBe('expense-1');
  });

  it('syncs paid expense to payout batch and accrual statuses', async () => {
    prisma.expense.findUnique.mockResolvedValue({
      status: 'PAID',
      partnerPayoutBatch: { id: 'batch-1', status: 'EXPENSE_CREATED' },
    });

    await syncPartnerPayoutPaidFromExpense(prisma as never, 'expense-1');

    expect(prisma.partnerPayoutBatch.update).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
      data: { status: 'PAID' },
    });
    expect(prisma.partnerAccrual.updateMany).toHaveBeenCalledWith({
      where: { payoutBatchId: 'batch-1', status: 'IN_BATCH' },
      data: { status: 'PAID' },
    });
  });

  it('cancels draft batch and releases in-batch accruals back to eligible', async () => {
    prisma.partnerPayoutBatch.findUnique.mockResolvedValue({
      id: 'batch-1',
      partnerId: 'partner-1',
      status: 'DRAFT',
      notes: null,
    });
    prisma.partnerPayoutBatch.findFirst.mockResolvedValue(mockBatchRow({ status: 'CANCELLED' }));

    const result = await cancelPartnerPayoutBatch(prisma as never, 'partner-1', 'batch-1', {
      notes: 'manual cancel',
    });

    expect(prisma.partnerPayoutBatch.update).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
      data: { status: 'CANCELLED', notes: 'manual cancel' },
    });
    expect(prisma.partnerAccrual.updateMany).toHaveBeenCalledWith({
      where: { payoutBatchId: 'batch-1', status: 'IN_BATCH' },
      data: { status: 'ELIGIBLE', payoutBatchId: null },
    });
    expect(result.status).toBe('CANCELLED');
  });
});
