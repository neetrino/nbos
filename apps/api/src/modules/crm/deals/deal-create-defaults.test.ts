import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { resolveDealCreateDefaults } from './deal-create-defaults.op';

describe('resolveDealCreateDefaults', () => {
  it('uses actor as seller without auto business fields on manual create', async () => {
    const prisma = { lead: { findUnique: vi.fn() } };

    const resolved = await resolveDealCreateDefaults(
      prisma as never,
      { name: 'Website redesign' },
      { actorId: 'emp-1' },
    );

    expect(resolved.sellerId).toBe('emp-1');
    expect(resolved.name).toBe('Website redesign');
    expect(resolved.contactId).toBeUndefined();
    expect(resolved.type).toBeUndefined();
    expect(resolved.paymentType).toBeUndefined();
    expect(resolved.taxStatus).toBeUndefined();
  });

  it('merges lead facts but not deal type or payment', async () => {
    const prisma = {
      lead: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'lead-1',
          name: 'From lead',
          contactId: 'c-lead',
          assignedTo: 'seller-lead',
          source: 'MARKETING',
          sourceDetail: 'LIST_AM',
          sourcePartnerId: null,
          sourceContactId: null,
          marketingAccountId: 'ma-1',
          marketingActivityId: null,
        }),
      },
    };

    const resolved = await resolveDealCreateDefaults(
      prisma as never,
      { leadId: 'lead-1', sellerId: 'emp-1' },
      { actorId: 'emp-2' },
    );

    expect(resolved.contactId).toBe('c-lead');
    expect(resolved.name).toBe('From lead');
    expect(resolved.source).toBe('MARKETING');
    expect(resolved.marketingAccountId).toBe('ma-1');
    expect(resolved.sellerId).toBe('emp-1');
    expect(resolved.type).toBeUndefined();
    expect(resolved.paymentType).toBeUndefined();
  });

  it('throws when title is missing on direct deal', async () => {
    const prisma = { lead: { findUnique: vi.fn() } };
    await expect(
      resolveDealCreateDefaults(prisma as never, { name: '  ' }, { actorId: 'emp-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when lead is not found', async () => {
    const prisma = { lead: { findUnique: vi.fn().mockResolvedValue(null) } };
    await expect(
      resolveDealCreateDefaults(prisma as never, { leadId: 'missing' }, { actorId: 'emp-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
