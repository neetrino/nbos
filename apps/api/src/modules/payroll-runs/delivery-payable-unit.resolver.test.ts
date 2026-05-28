import { describe, expect, it, vi } from 'vitest';
import { resolveDeliveryPayableUnits } from './delivery-payable-unit.resolver';

describe('resolveDeliveryPayableUnits', () => {
  it('includes open delivery units and excludes closed units with no unpaid bonus', async () => {
    const prisma = {
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'o-open',
            code: 'ORD-1',
            type: 'PRODUCT',
            projectId: 'p1',
            productId: 'prod1',
            extensionId: null,
            project: { code: 'PRJ' },
            product: { name: 'Website', status: 'DEVELOPMENT' },
            extension: null,
            productBonusPool: {
              totalPlannedAmount: '100000',
              totalReleasedAmount: '0',
              totalPaidAmount: '0',
              totalRemainingAmount: '100000',
              availableFunding: '50000',
              overFundingAmount: '0',
            },
            bonusEntries: [],
          },
          {
            id: 'o-closed-paid',
            code: 'ORD-2',
            type: 'EXTENSION',
            projectId: 'p1',
            productId: null,
            extensionId: 'ext1',
            project: { code: 'PRJ' },
            product: null,
            extension: { name: 'CRM tweak', status: 'DONE' },
            productBonusPool: {
              totalPlannedAmount: '50000',
              totalReleasedAmount: '50000',
              totalPaidAmount: '50000',
              totalRemainingAmount: '0',
              availableFunding: '0',
              overFundingAmount: '0',
            },
            bonusEntries: [],
          },
        ]),
      },
    } as unknown as Parameters<typeof resolveDeliveryPayableUnits>[0];

    const units = await resolveDeliveryPayableUnits(prisma, 'run-1', []);

    expect(units.map((u) => u.orderId)).toEqual(['o-open']);
    expect(units[0]?.inclusionReason).toBe('DELIVERY_OPEN');
  });

  it('includes pinned closed units even when fully paid', async () => {
    const prisma = {
      bonusRelease: { findMany: vi.fn().mockResolvedValue([]) },
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'o-pinned',
            code: 'ORD-3',
            type: 'PRODUCT',
            projectId: 'p1',
            productId: 'prod2',
            extensionId: null,
            project: { code: 'PRJ' },
            product: { name: 'App', status: 'DONE' },
            extension: null,
            productBonusPool: {
              totalPlannedAmount: '20000',
              totalReleasedAmount: '20000',
              totalPaidAmount: '20000',
              totalRemainingAmount: '0',
              availableFunding: '0',
              overFundingAmount: '0',
            },
            bonusEntries: [],
          },
        ]),
      },
    } as unknown as Parameters<typeof resolveDeliveryPayableUnits>[0];

    const units = await resolveDeliveryPayableUnits(prisma, 'run-1', ['o-pinned']);

    expect(units).toHaveLength(1);
    expect(units[0]?.inclusionReason).toBe('PINNED');
  });
});
