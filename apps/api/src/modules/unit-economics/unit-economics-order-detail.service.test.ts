import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UnitEconomicsOrderDetailService } from './unit-economics-order-detail.service';

describe('UnitEconomicsOrderDetailService', () => {
  it('throws when order is not a delivery unit', async () => {
    const prisma = {
      order: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const service = new UnitEconomicsOrderDetailService(prisma as never);
    await expect(service.getByOrderId('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns invoice and payment lines with summary totals', async () => {
    const prisma = {
      order: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'o1',
          code: 'ORD-1',
          type: 'PRODUCT',
          product: { name: 'App' },
          extension: null,
          projectId: 'p1',
          project: { code: 'PRJ' },
          productBonusPool: {
            totalPlannedAmount: '500',
            totalReleasedAmount: '200',
            totalPaidAmount: '100',
            totalRemainingAmount: '300',
          },
        }),
      },
      operationalJournalEntry: { findMany: vi.fn().mockResolvedValue([]) },
      bonusEntry: { findMany: vi.fn().mockResolvedValue([]) },
      expensePayment: { findMany: vi.fn().mockResolvedValue([]) },
      expense: { findMany: vi.fn().mockResolvedValue([]) },
      invoice: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'inv1',
            code: 'INV-1',
            amount: '1000',
            moneyStatus: 'PAID',
            type: 'STANDARD',
            dueDate: null,
            paidDate: new Date('2026-05-01'),
            payments: [
              {
                id: 'pay1',
                amount: '600',
                paymentDate: new Date('2026-05-02'),
                paymentMethod: 'BANK',
              },
              {
                id: 'pay2',
                amount: '400',
                paymentDate: new Date('2026-05-03'),
                paymentMethod: null,
              },
            ],
          },
        ]),
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: '1000' } }),
      },
      payment: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: '1000' } }) },
    };

    const service = new UnitEconomicsOrderDetailService(prisma as never);
    const detail = await service.getByOrderId('o1');

    expect(detail.label).toBe('App');
    expect(detail.summary.invoicedAmount).toBe('1000.00');
    expect(detail.summary.receivedAmount).toBe('1000.00');
    expect(detail.invoices).toHaveLength(1);
    expect(detail.invoices[0]?.receivedOnInvoice).toBe('1000.00');
    expect(detail.payments).toHaveLength(2);
    expect(detail.payments[0]?.id).toBe('pay2');
    expect(detail.projectId).toBe('p1');
    expect(detail.expenses).toEqual([]);
    expect(detail.bonuses).toEqual([]);
    expect(detail.summary.plannedBonuses).toBe('500.00');
    expect(detail.summary.expensesPaidAmount).toBe('0.00');
  });
});
