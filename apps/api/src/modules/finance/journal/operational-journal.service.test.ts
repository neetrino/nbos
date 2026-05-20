import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { OperationalJournalService } from './operational-journal.service';

describe('OperationalJournalService', () => {
  let prisma: MockPrisma;
  let service: OperationalJournalService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OperationalJournalService(prisma as never);
  });

  it('creates an open posting period and idempotent cash payment line', async () => {
    prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
    prisma.financePostingPeriod.create.mockResolvedValue({ id: 'period-1', monthKey: '2026-05' });

    await service.appendCashPaymentLine({
      paymentId: 'payment-1',
      invoiceCode: 'INV-1',
      amount: 125000,
      bookedAt: new Date('2026-05-05T10:00:00.000Z'),
      companyId: 'company-1',
      projectId: 'project-1',
      productId: 'product-1',
      orderId: 'order-1',
    });

    expect(prisma.financePostingPeriod.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        monthKey: '2026-05',
        startsAt: new Date('2026-05-01T00:00:00.000Z'),
        endsAt: new Date('2026-06-01T00:00:00.000Z'),
      }),
    });
    expect(prisma.operationalJournalEntry.upsert).toHaveBeenCalledWith({
      where: { idempotencyKey: 'payment:payment-1' },
      update: {},
      create: expect.objectContaining({
        amount: 125000,
        functionalAmount: 125000,
        recognitionBasis: 'CASH',
        postingPeriodId: 'period-1',
        sourceType: 'PAYMENT',
        sourceId: 'payment-1',
        companyId: 'company-1',
        projectId: 'project-1',
        productId: 'product-1',
        orderId: 'order-1',
      }),
    });
  });

  it('rejects posting into a closed period', async () => {
    prisma.financePostingPeriod.findUnique.mockResolvedValue({
      id: 'period-1',
      monthKey: '2026-05',
      status: 'CLOSED',
    });

    await expect(
      service.appendCashPaymentLine({
        paymentId: 'payment-1',
        amount: 1000,
        bookedAt: new Date('2026-05-05T10:00:00.000Z'),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('closes an existing posting period', async () => {
    prisma.financePostingPeriod.findUnique.mockResolvedValue({
      id: 'period-1',
      monthKey: '2026-05',
      status: 'OPEN',
    });
    prisma.financePostingPeriod.update.mockResolvedValue({
      id: 'period-1',
      monthKey: '2026-05',
      status: 'CLOSED',
    });

    const result = await service.closePostingPeriod('2026-05');

    expect(result.status).toBe('CLOSED');
    expect(prisma.financePostingPeriod.update).toHaveBeenCalledWith({
      where: { monthKey: '2026-05' },
      data: { status: 'CLOSED', closedAt: expect.any(Date) },
    });
  });

  it('records expense payment as cash outflow', async () => {
    prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
    prisma.financePostingPeriod.create.mockResolvedValue({ id: 'period-1', monthKey: '2026-05' });

    await service.appendExpensePaymentLine({
      expensePaymentId: 'ep-1',
      expenseName: 'Hosting',
      amount: 5000,
      bookedAt: new Date('2026-05-12T00:00:00.000Z'),
      projectId: 'project-1',
    });

    expect(prisma.operationalJournalEntry.upsert).toHaveBeenCalledWith({
      where: { idempotencyKey: 'expense-payment:ep-1' },
      update: {},
      create: expect.objectContaining({
        sourceType: 'EXPENSE_PAYMENT',
        functionalAmount: -5000,
        recognitionBasis: 'CASH',
      }),
    });
  });

  it('creates manual adjustment in open period', async () => {
    prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
    prisma.financePostingPeriod.create.mockResolvedValue({ id: 'period-1', monthKey: '2026-05' });
    prisma.operationalJournalEntry.create.mockResolvedValue({ id: 'adj-1' });

    await service.appendManualAdjustment({
      amount: -1200,
      bookedAt: '2026-05-15T00:00:00.000Z',
      description: 'Correct prior month accrual',
      recognitionBasis: 'ACCRUAL',
    });

    expect(prisma.operationalJournalEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceType: 'MANUAL_ADJUSTMENT',
        functionalAmount: -1200,
        description: 'Correct prior month accrual',
      }),
    });
  });

  it('summarizes cash movement from active journal entries', async () => {
    prisma.operationalJournalEntry.aggregate.mockResolvedValue({
      _sum: { functionalAmount: 250000 },
    });
    prisma.operationalJournalEntry.count.mockResolvedValue(2);

    const result = await service.getCashMovementSummary({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });

    expect(result).toEqual({
      basis: 'CASH',
      source: 'OperationalJournal',
      entryCount: 2,
      netCashMovement: 250000,
    });
    expect(prisma.operationalJournalEntry.aggregate).toHaveBeenCalledWith({
      where: expect.objectContaining({
        recognitionBasis: 'CASH',
        status: 'ACTIVE',
        bookedAt: expect.objectContaining({
          gte: new Date('2026-05-01'),
          lte: new Date('2026-05-31'),
        }),
      }),
      _sum: { functionalAmount: true },
    });
  });
});
