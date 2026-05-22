import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { resolveDealCreateDefaults } from './deal-create-defaults.op';

describe('resolveDealCreateDefaults', () => {
  it('creates placeholder contact and uses actor as seller', async () => {
    const prisma = {
      contact: {
        create: vi.fn().mockResolvedValue({ id: 'contact-new' }),
      },
    };

    const resolved = await resolveDealCreateDefaults(
      prisma as never,
      { name: 'Website redesign' },
      { actorId: 'emp-1' },
    );

    expect(resolved.contactId).toBe('contact-new');
    expect(resolved.sellerId).toBe('emp-1');
    expect(resolved.type).toBe('PRODUCT');
    expect(resolved.name).toBe('Website redesign');
    expect(prisma.contact.create).toHaveBeenCalled();
  });

  it('throws when title is missing on direct deal', async () => {
    const prisma = { contact: { create: vi.fn() } };
    await expect(
      resolveDealCreateDefaults(prisma as never, { name: '  ' }, { actorId: 'emp-1' }),
    ).rejects.toThrow(BadRequestException);
  });
});
