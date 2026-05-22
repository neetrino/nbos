import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { syncDealAdditionalContacts } from './deal-additional-contacts.ops';

describe('syncDealAdditionalContacts', () => {
  const dealId = 'deal-1';

  it('clears links when list is empty', async () => {
    const prisma = {
      contact: { count: vi.fn() },
      dealAdditionalContact: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn(),
      },
    };

    await syncDealAdditionalContacts(prisma as never, dealId, [], null);

    expect(prisma.dealAdditionalContact.deleteMany).toHaveBeenCalledWith({ where: { dealId } });
    expect(prisma.dealAdditionalContact.createMany).not.toHaveBeenCalled();
  });

  it('excludes primary contact and dedupes ids', async () => {
    const prisma = {
      contact: { count: vi.fn().mockResolvedValue(1) },
      dealAdditionalContact: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await syncDealAdditionalContacts(
      prisma as never,
      dealId,
      ['c-primary', 'c-extra', 'c-extra'],
      'c-primary',
    );

    expect(prisma.contact.count).toHaveBeenCalledWith({
      where: { id: { in: ['c-extra'] } },
    });
    expect(prisma.dealAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ dealId, contactId: 'c-extra' }],
      skipDuplicates: true,
    });
  });

  it('throws when a contact id is missing', async () => {
    const prisma = {
      contact: { count: vi.fn().mockResolvedValue(0) },
      dealAdditionalContact: { deleteMany: vi.fn() },
    };

    await expect(
      syncDealAdditionalContacts(prisma as never, dealId, ['missing'], null),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
