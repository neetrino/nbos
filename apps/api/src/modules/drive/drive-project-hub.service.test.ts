import { describe, expect, it, beforeEach, vi } from 'vitest';
import { DriveProjectHubService } from './drive-project-hub.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('DriveProjectHubService', () => {
  let prisma: MockPrisma;
  let service: DriveProjectHubService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    service = new DriveProjectHubService(prisma as never);

    prisma.project.findFirst.mockResolvedValue({
      id: 'proj-1',
      code: 'P1',
      name: 'Site',
      contactId: 'ct-1',
      companyId: 'co-1',
      contact: { firstName: 'Jane', lastName: 'Doe' },
      company: { name: 'Acme' },
    });
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Website',
        extensions: [{ id: 'ext-1', name: 'Phase 2' }],
      },
    ]);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.fileLink.groupBy.mockResolvedValue([]);
  });

  it('returns client rows for company and contact', async () => {
    const out = await service.getSummary('proj-1');
    expect(out.client).toHaveLength(2);
    expect(out.client[0]).toMatchObject({ entityType: 'COMPANY', id: 'co-1', label: 'Acme' });
    expect(out.client[1]).toMatchObject({ entityType: 'CONTACT', id: 'ct-1' });
  });

  it('nests extensions under products', async () => {
    const out = await service.getSummary('proj-1');
    expect(out.products[0]?.extensions).toEqual([{ id: 'ext-1', label: 'Phase 2', fileCount: 0 }]);
  });
});
