import { describe, it, expect } from 'vitest';
import { resolveStorageHomeContextPath } from './drive-storage-home-resolver';

function mockPrisma(overrides: Record<string, unknown>) {
  return overrides as never;
}

describe('resolveStorageHomeContextPath', () => {
  it('maps DEAL to crm/deals path', async () => {
    const prisma = mockPrisma({
      deal: {
        findUnique: async () => ({ code: 'D2024-001', name: 'Acme Site' }),
      },
    });
    const path = await resolveStorageHomeContextPath(prisma, 'DEAL', 'deal-id');
    expect(path).toBe('crm/deals/deal-D2024-001-acme-site');
  });

  it('maps PROJECT to projects path with _project segment', async () => {
    const prisma = mockPrisma({
      project: {
        findUnique: async () => ({ code: 'P2024-001', name: 'Main Site' }),
      },
    });
    const path = await resolveStorageHomeContextPath(prisma, 'PROJECT', 'proj-id');
    expect(path).toBe('projects/project-P2024-001-main-site/_project');
  });

  it('maps LEAD to crm/leads path', async () => {
    const prisma = mockPrisma({
      lead: {
        findUnique: async () => ({
          code: 'L-2026-0001',
          name: 'Website project',
          contactName: 'Incoming call +374',
        }),
      },
    });
    const path = await resolveStorageHomeContextPath(prisma, 'LEAD', 'lead-id');
    expect(path).toBe('crm/leads/lead-L-2026-0001-website-project');
  });

  it('falls back for unknown entity', async () => {
    const prisma = mockPrisma({});
    const path = await resolveStorageHomeContextPath(prisma, 'CUSTOM', 'abcdef12-3456');
    expect(path).toBe('misc/custom/abcdef12');
  });
});
