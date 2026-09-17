import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { resolveExistingDomainService } from './domain-operation-resolve';

describe('resolveExistingDomainService', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('reuses an open service on the same product', async () => {
    prisma.domain.findUnique.mockResolvedValue(null);
    prisma.clientServiceRecord.findFirst.mockResolvedValue({
      id: 'svc-1',
      productId: 'prod-1',
      status: 'PENDING',
      registrationConfirmedAt: null,
      renewalDate: null,
      invoices: [],
    });
    const result = await resolveExistingDomainService(prisma as never, 'prod-1', 'example.am');
    expect(result).toMatchObject({ serviceId: 'svc-1', kind: 'continue_initial' });
  });

  it('does not leak another product’s domain', async () => {
    prisma.domain.findUnique.mockResolvedValue({
      id: 'dom-1',
      clientServiceRecordId: 'svc-other',
      projectId: 'p-2',
    });
    prisma.clientServiceRecord.findFirst.mockResolvedValue(null);
    prisma.clientServiceRecord.findUnique.mockResolvedValue({
      id: 'svc-other',
      productId: 'prod-other',
      status: 'ACTIVE',
    });
    await expect(
      resolveExistingDomainService(prisma as never, 'prod-1', 'example.am'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
