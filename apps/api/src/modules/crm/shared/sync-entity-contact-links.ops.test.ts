import { describe, expect, it, vi } from 'vitest';
import { syncEntityContactLinks } from './sync-entity-contact-links.ops';

describe('syncEntityContactLinks', () => {
  const dealId = 'deal-1';

  it('clears junction when list is empty', async () => {
    const prisma = {
      contact: { count: vi.fn().mockResolvedValue(0) },
      dealAdditionalContact: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn(),
      },
    };
    const result = await syncEntityContactLinks(prisma as never, 'deal', dealId, []);
    expect(result.primaryContactId).toBeNull();
    expect(prisma.dealAdditionalContact.deleteMany).toHaveBeenCalledWith({
      where: { dealId },
    });
    expect(prisma.dealAdditionalContact.createMany).not.toHaveBeenCalled();
  });

  it('sets primary and junction rows', async () => {
    const prisma = {
      contact: {
        count: vi.fn(async (args: { where: { id: string | { in: string[] } } }) => {
          const id = args.where.id;
          if (typeof id === 'string') return id === 'primary' ? 1 : 0;
          return id.in.length;
        }),
      },
      dealAdditionalContact: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const result = await syncEntityContactLinks(prisma as never, 'deal', dealId, [
      'primary',
      'extra',
    ]);
    expect(result.primaryContactId).toBe('primary');
    expect(prisma.dealAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ dealId, contactId: 'extra' }],
      skipDuplicates: true,
    });
  });

  it('rejects unknown contact ids', async () => {
    const prisma = {
      contact: { count: vi.fn().mockResolvedValue(0) },
      dealAdditionalContact: { deleteMany: vi.fn(), createMany: vi.fn() },
    };
    await expect(
      syncEntityContactLinks(prisma as never, 'deal', dealId, ['missing']),
    ).rejects.toThrow('Primary contact was not found');
  });
});
