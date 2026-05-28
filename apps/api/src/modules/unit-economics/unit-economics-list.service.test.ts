import { describe, expect, it, vi } from 'vitest';
import { UnitEconomicsListService } from './unit-economics-list.service';

describe('UnitEconomicsListService', () => {
  it('returns empty list when no orders have activity', async () => {
    const prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'o1',
            code: 'ORD-1',
            type: 'PRODUCT',
            projectId: 'p1',
            project: { code: 'PRJ' },
            product: { name: 'App', status: 'DONE' },
            extension: null,
            productBonusPool: null,
          },
        ]),
      },
      invoice: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
      payment: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
      operationalJournalEntry: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { functionalAmount: null } }),
      },
    };

    const service = new UnitEconomicsListService(prisma as never);
    const result = await service.list();

    expect(result.items).toEqual([]);
    expect(result.totals.receivedAmount).toBe('0.00');
  });

  it('includes row when pool exists even without payments', async () => {
    const prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'o2',
            code: 'ORD-2',
            type: 'EXTENSION',
            projectId: 'p1',
            project: { code: 'PRJ' },
            product: null,
            extension: { name: 'Phase 2', status: 'IN_PROGRESS' },
            productBonusPool: {
              totalPlannedAmount: '1000',
              totalReleasedAmount: '200',
              totalPaidAmount: '100',
              totalRemainingAmount: '800',
              availableFunding: '500',
              overFundingAmount: '0',
            },
          },
        ]),
      },
      invoice: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
      payment: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
      operationalJournalEntry: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { functionalAmount: '50' } }),
      },
    };

    const service = new UnitEconomicsListService(prisma as never);
    const result = await service.list();

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.orderId).toBe('o2');
    expect(result.items[0]?.plannedBonuses).toBe('1000.00');
    expect(result.items[0]?.expensesPaidAmount).toBe('50.00');
    expect(result.items[0]?.deliveryOpen).toBe(true);
  });
});
