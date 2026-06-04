import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ProductTeamSyncService } from './product-team-sync.service';

describe('ProductTeamSyncService.reconcileProjectTeamFromProducts', () => {
  const upsert = vi.fn().mockResolvedValue({});
  const prisma = {
    product: {
      findMany: vi.fn().mockResolvedValue([
        {
          pmId: 'pm-1',
          developerId: 'dev-1',
          designerId: null,
          technicalSpecialistId: null,
          qaLeadId: null,
          teamMembers: [{ employeeId: 'contrib-1' }],
          order: { deal: { sellerId: 'seller-1' } },
        },
      ]),
    },
    extension: {
      findMany: vi.fn().mockResolvedValue([{ assignedTo: 'ext-1' }]),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({ projectTeamMember: { upsert } });
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds all product-linked employees as project members', async () => {
    const service = new ProductTeamSyncService(prisma as never);
    await service.reconcileProjectTeamFromProducts('project-1', 'actor-1');

    expect(upsert).toHaveBeenCalledTimes(5);
    const employeeIds = upsert.mock.calls.map(
      (call) => (call[0] as { create: { employeeId: string } }).create.employeeId,
    );
    expect(employeeIds).toEqual(
      expect.arrayContaining(['pm-1', 'dev-1', 'contrib-1', 'seller-1', 'ext-1']),
    );
    expect(upsert.mock.calls[0]?.[0]).toMatchObject({
      create: { projectId: 'project-1', role: 'MEMBER', source: 'PRODUCT_SLOT' },
      update: {},
    });
  });
});
