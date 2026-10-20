import { beforeEach, describe, expect, it } from 'vitest';
import { attachDealHandoffReferences } from './deal-handoff';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

const PRODUCT = { id: 'prod-1', name: 'Cargozone', productType: 'COMPANY_WEBSITE' };
const LIVE_SUBSCRIPTION = {
  id: 'sub-1',
  code: 'SUB-2026-0133',
  name: 'cargozone',
  status: 'ACTIVE',
  amount: '35000.00',
};

describe('attachDealHandoffReferences', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.project.findUnique.mockResolvedValue(null);
  });

  it('returns the live maintenance subscription of the product for a MAINTENANCE deal', async () => {
    prisma.subscription.findFirst.mockResolvedValue(LIVE_SUBSCRIPTION);

    const result = await attachDealHandoffReferences(prisma as never, {
      id: 'deal-1',
      type: 'MAINTENANCE',
      projectId: 'proj-1',
      existingProduct: PRODUCT,
    });

    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          productId: 'prod-1',
          type: 'MAINTENANCE_ONLY',
          status: { in: ['PENDING', 'ACTIVE'] },
        },
      }),
    );
    expect(result.handoff.maintenanceSubscription).toEqual(LIVE_SUBSCRIPTION);
  });

  it('does not look up a maintenance subscription for non-MAINTENANCE deals', async () => {
    const result = await attachDealHandoffReferences(prisma as never, {
      id: 'deal-2',
      type: 'EXTENSION',
      projectId: 'proj-1',
      existingProduct: PRODUCT,
    });

    expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
    expect(result.handoff.maintenanceSubscription).toBeNull();
  });
});
