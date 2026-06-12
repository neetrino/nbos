import { beforeEach, describe, expect, it } from 'vitest';
import { DriveDealWonLinksService } from './drive-deal-won-links.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('DriveDealWonLinksService', () => {
  let prisma: MockPrisma;
  let service: DriveDealWonLinksService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DriveDealWonLinksService(prisma as never);
  });

  it('creates PROJECT and CONTACT links for OFFER deal files', async () => {
    prisma.fileLink.findMany.mockResolvedValueOnce([{ fileAssetId: 'file-1' }]);
    prisma.fileAsset.findFirst.mockResolvedValueOnce({ purpose: 'OFFER' });
    prisma.fileLink.findFirst.mockResolvedValue(null);
    prisma.fileLink.create.mockResolvedValue({ id: 'link-1' });

    const created = await service.linkApprovedDealMaterials({
      dealId: 'deal-1',
      projectId: 'proj-1',
      contactId: 'contact-1',
      companyId: 'company-1',
      productId: 'product-1',
    });

    expect(created).toBe(4);
    expect(prisma.fileLink.create).toHaveBeenCalledTimes(4);
    expect(prisma.fileLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileAssetId: 'file-1',
          entityType: 'PROJECT',
          entityId: 'proj-1',
          linkType: 'HANDOFF',
        }),
      }),
    );
  });

  it('skips when no handoff files on deal', async () => {
    prisma.fileLink.findMany.mockResolvedValueOnce([]);

    const created = await service.linkApprovedDealMaterials({
      dealId: 'deal-1',
      projectId: 'proj-1',
      contactId: 'contact-1',
    });

    expect(created).toBe(0);
    expect(prisma.fileLink.create).not.toHaveBeenCalled();
  });

  it('does not duplicate existing links', async () => {
    prisma.fileLink.findMany.mockResolvedValueOnce([{ fileAssetId: 'file-1' }]);
    prisma.fileAsset.findFirst.mockResolvedValueOnce({ purpose: 'CONTRACT' });
    prisma.fileLink.findFirst.mockResolvedValue({ id: 'existing' });

    const created = await service.linkApprovedDealMaterials({
      dealId: 'deal-1',
      projectId: 'proj-1',
      contactId: 'contact-1',
    });

    expect(created).toBe(0);
    expect(prisma.fileLink.create).not.toHaveBeenCalled();
  });
});
