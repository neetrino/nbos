import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { assertSupportTechnicalLinksValid } from './support-technical-link.validation';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('assertSupportTechnicalLinksValid', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('allows empty links', async () => {
    await expect(
      assertSupportTechnicalLinksValid(prisma as never, {
        projectId: 'p1',
        productId: null,
        technicalAssetId: undefined,
        technicalEnvironmentId: undefined,
      }),
    ).resolves.toBeUndefined();
  });

  it('rejects asset without product on ticket', async () => {
    await expect(
      assertSupportTechnicalLinksValid(prisma as never, {
        projectId: 'p1',
        productId: null,
        technicalAssetId: 'a1',
        technicalEnvironmentId: undefined,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects missing asset', async () => {
    prisma.technicalAsset.findFirst.mockResolvedValue(null);
    await expect(
      assertSupportTechnicalLinksValid(prisma as never, {
        projectId: 'p1',
        productId: 'prod1',
        technicalAssetId: 'a1',
        technicalEnvironmentId: undefined,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects asset from different product', async () => {
    prisma.technicalAsset.findFirst.mockResolvedValue({
      id: 'a1',
      productId: 'other',
    });
    await expect(
      assertSupportTechnicalLinksValid(prisma as never, {
        projectId: 'p1',
        productId: 'prod1',
        technicalAssetId: 'a1',
        technicalEnvironmentId: undefined,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts aligned asset', async () => {
    prisma.technicalAsset.findFirst.mockResolvedValue({
      id: 'a1',
      productId: 'prod1',
    });
    await expect(
      assertSupportTechnicalLinksValid(prisma as never, {
        projectId: 'p1',
        productId: 'prod1',
        technicalAssetId: 'a1',
        technicalEnvironmentId: undefined,
      }),
    ).resolves.toBeUndefined();
  });
});
