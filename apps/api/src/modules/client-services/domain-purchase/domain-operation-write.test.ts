import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { persistDomainService } from './domain-operation-write';

describe('persistDomainService', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.clientServiceRecord.create.mockResolvedValue({ id: 'svc-1' });
    prisma.domain.create.mockResolvedValue({ id: 'dom-1' });
  });

  it('writes the service and domain row in one transaction', async () => {
    const id = await persistDomainService(prisma as never, {
      projectId: 'proj-1',
      productId: 'prod-1',
      domainName: 'example.am',
      connectionMode: 'PURCHASE',
      domain: { domainName: 'example.am' },
      encryptedRegistrantData: null,
      dnsInstructions: null,
      existingDomainId: null,
    });

    expect(id).toBe('svc-1');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.clientServiceRecord.create).toHaveBeenCalled();
    expect(prisma.domain.create).toHaveBeenCalled();
  });
});
