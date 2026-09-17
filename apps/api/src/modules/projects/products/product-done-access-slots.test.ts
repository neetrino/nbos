import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { loadMissingRequiredAccessSlotKeys } from '../../projects/products/product-done-access-slots';

describe('loadMissingRequiredAccessSlotKeys domain gate', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.productAccessSlotBinding.findMany.mockResolvedValue([]);
    prisma.task.findMany.mockResolvedValue([]);
  });

  it('keeps DOMAIN missing when any active domain is still unsatisfied', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      purchaseReadyRow('ready.am'),
      {
        id: 'svc-pending',
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

  it('keeps CLIENT_DNS unsatisfied until the DNS prep task is done', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([dnsRow('ready.am')]);

    const missing = await loadMissingRequiredAccessSlotKeys(prisma as never, {
      id: 'prod-1',
      productCategory: 'WORDPRESS',
      productType: 'COMPANY_WEBSITE',
    });

    expect(missing).toContain('DOMAIN');
    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it('clears DOMAIN when every CLIENT_DNS service has a completed prep task', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([dnsRow('ready.am')]);
    prisma.task.findMany.mockResolvedValue([{ links: [{ entityId: 'svc-dns' }] }]);

    const missing = await loadMissingRequiredAccessSlotKeys(prisma as never, {
      id: 'prod-1',
      productCategory: 'WORDPRESS',
      productType: 'COMPANY_WEBSITE',
    });

    expect(missing).not.toContain('DOMAIN');
  });
});

function purchaseReadyRow(name: string) {
  return {
    id: 'svc-purchase',
    name,
    status: 'ACTIVE',
    connectionMode: 'PURCHASE',
    providerAccountId: 'cred-1',
    registrationConfirmedAt: new Date('2026-01-01'),
    connectionVerifiedAt: new Date('2026-01-02'),
    dnsInstructions: null,
  };
}

function dnsRow(name: string) {
  return {
    id: 'svc-dns',
    name,
    status: 'ACTIVE',
    connectionMode: 'CLIENT_DNS',
    providerAccountId: null,
    registrationConfirmedAt: null,
    connectionVerifiedAt: null,
    dnsInstructions: 'Point A records to our host.',
  };
}
