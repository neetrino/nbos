import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { loadMissingRequiredAccessSlotKeys } from '../../projects/products/product-done-access-slots';

describe('loadMissingRequiredAccessSlotKeys domain gate', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.productAccessSlotBinding.findMany.mockResolvedValue([]);
  });

  it('keeps DOMAIN missing when any active domain is still unsatisfied', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      satisfiedDnsRow('ready.am'),
      {
        name: 'pending.am',
        status: 'PENDING',
        connectionMode: 'PURCHASE',
        providerAccountId: null,
        registrationConfirmedAt: null,
        connectionVerifiedAt: null,
        dnsInstructions: null,
      },
    ]);

    const missing = await loadMissingRequiredAccessSlotKeys(prisma as never, {
      id: 'prod-1',
      productCategory: 'WORDPRESS',
      productType: 'COMPANY_WEBSITE',
    });

    expect(missing).toContain('DOMAIN');
  });

  it('clears DOMAIN when every active domain is satisfied', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([satisfiedDnsRow('ready.am')]);

    const missing = await loadMissingRequiredAccessSlotKeys(prisma as never, {
      id: 'prod-1',
      productCategory: 'WORDPRESS',
      productType: 'COMPANY_WEBSITE',
    });

    expect(missing).not.toContain('DOMAIN');
  });
});

function satisfiedDnsRow(name: string) {
  return {
    name,
    status: 'ACTIVE',
    connectionMode: 'CLIENT_DNS',
    providerAccountId: null,
    registrationConfirmedAt: null,
    connectionVerifiedAt: null,
    dnsInstructions: 'Point A records to our host.',
  };
}
