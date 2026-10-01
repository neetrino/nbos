import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { resolvePortfolioClientScope } from './messenger-portfolio-client-scope.ops';

describe('portfolio client scope', () => {
  it('opens the one readable Client conversation for a contact', async () => {
    const prisma = scopePrisma({
      bindings: ['conv-work'],
      links: [],
      readable: ['conv-work'],
    });
    const result = await resolvePortfolioClientScope(prisma as never, 'emp-1', 'ALL', {
      scope: 'contact',
      entityId: 'contact-1',
    });
    expect(result.label).toBe('Ada Lovelace');
    expect(result.uniqueConversationId).toBe('conv-work');
    expect(result.conversationIds).toEqual(['conv-work']);
    expect(prisma.productCommunicationBinding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          conversation: { zone: 'CLIENT', status: 'ACTIVE' },
        }),
      }),
    );
  });

  it('does not pick one conversation when work and finance differ', async () => {
    const prisma = scopePrisma({
      bindings: ['conv-work', 'conv-finance'],
      links: [],
      readable: ['conv-work', 'conv-finance'],
    });
    const result = await resolvePortfolioClientScope(prisma as never, 'emp-1', 'ALL', {
      scope: 'contact',
      entityId: 'contact-1',
    });
    expect(result.uniqueConversationId).toBeNull();
    expect(result.conversationIds).toEqual(['conv-work', 'conv-finance']);
  });

  it('drops a bound conversation the employee cannot read', async () => {
    const prisma = scopePrisma({
      bindings: ['conv-hidden'],
      links: [],
      readable: [],
    });
    const result = await resolvePortfolioClientScope(prisma as never, 'emp-1', 'OWN', {
      scope: 'contact',
      entityId: 'contact-1',
    });
    expect(result.conversationIds).toEqual([]);
    expect(result.uniqueConversationId).toBeNull();
    expect(prisma.messengerConversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              participants: { some: { employeeId: 'emp-1', leftAt: null } },
            }),
          ]),
        }),
      }),
    );
  });

  it('includes a contact lead conversation and keeps one shared id unique', async () => {
    const prisma = scopePrisma({
      bindings: ['conv-shared'],
      links: [{ entityType: 'LEAD', conversationId: 'conv-shared' }],
      readable: ['conv-shared'],
    });
    const result = await resolvePortfolioClientScope(prisma as never, 'emp-1', 'ALL', {
      scope: 'contact',
      entityId: 'contact-1',
    });
    expect(result.uniqueConversationId).toBe('conv-shared');
  });

  it('scopes a company to its products and does not load contact leads', async () => {
    const prisma = scopePrisma({
      bindings: ['conv-co'],
      links: [],
      readable: ['conv-co'],
    });
    const result = await resolvePortfolioClientScope(prisma as never, 'emp-1', 'ALL', {
      scope: 'company',
      entityId: 'company-1',
    });
    expect(result.label).toBe('Acme');
    expect(result.uniqueConversationId).toBe('conv-co');
    expect(prisma.contact.findFirst).not.toHaveBeenCalled();
    const linkTypes = prisma.messengerConversationLink.findMany.mock.calls.map(
      (call) => (call[0] as { where: { entityType: string } }).where.entityType,
    );
    expect(linkTypes).not.toContain('LEAD');
  });

  it('rejects a missing contact', async () => {
    const prisma = scopePrisma({ bindings: [], links: [], readable: [] });
    prisma.contact.findFirst.mockResolvedValue(null);
    await expect(
      resolvePortfolioClientScope(prisma as never, 'emp-1', 'ALL', {
        scope: 'contact',
        entityId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function scopePrisma(input: {
  bindings: string[];
  links: Array<{ entityType: 'LEAD' | 'PRODUCT'; conversationId: string }>;
  readable: string[];
}) {
  return {
    contact: {
      findFirst: vi.fn().mockResolvedValue({
        firstName: 'Ada',
        lastName: 'Lovelace',
        leads: [{ id: 'lead-1' }],
      }),
    },
    company: { findFirst: vi.fn().mockResolvedValue({ name: 'Acme' }) },
    product: { findMany: vi.fn().mockResolvedValue([{ id: 'prod-1' }]) },
    productCommunicationBinding: {
      findMany: vi
        .fn()
        .mockResolvedValue(input.bindings.map((conversationId) => ({ conversationId }))),
    },
    messengerConversationLink: {
      findMany: vi.fn(async ({ where }: { where: { entityType: 'LEAD' | 'PRODUCT' } }) =>
        input.links
          .filter((link) => link.entityType === where.entityType)
          .map((link) => ({ conversationId: link.conversationId })),
      ),
    },
    resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    messengerConversation: {
      findMany: vi.fn().mockResolvedValue(input.readable.map((id) => ({ id }))),
    },
  };
}
