import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCoreConversation,
  ensureDirectConversation,
} from './messenger-core-conversation.ops';
import { addCoreConversationLink } from './messenger-core-link.ops';

const LOW = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const HIGH = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('core conversation uniqueness', () => {
  const prisma = {
    messengerConversation: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    messengerConversationLink: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses an existing DIRECT canonical key instead of inserting a second row', async () => {
    const existing = {
      id: 'conv-direct',
      zone: 'INTERNAL',
      type: 'DIRECT',
      title: null,
      status: 'ACTIVE',
      canonicalKey: `direct:${LOW}:${HIGH}`,
      createdAt: new Date(),
      lastMessageAt: null,
    };
    prisma.messengerConversation.findUnique.mockResolvedValue(existing);
    const created = await ensureDirectConversation(prisma as never, {
      zone: 'INTERNAL',
      type: 'DIRECT',
      createdById: LOW,
      peerEmployeeId: HIGH,
    });
    expect(created.id).toBe('conv-direct');
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
  });

  it('recovers from a unique-constraint race by loading the winner', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'winner',
      zone: 'INTERNAL',
      type: 'DIRECT',
      title: null,
      status: 'ACTIVE',
      canonicalKey: `direct:${LOW}:${HIGH}`,
      createdAt: new Date(),
      lastMessageAt: null,
    });
    prisma.messengerConversation.create.mockRejectedValue({ code: 'P2002' });
    const created = await ensureDirectConversation(prisma as never, {
      zone: 'INTERNAL',
      type: 'DIRECT',
      createdById: HIGH,
      peerEmployeeId: LOW,
    });
    expect(created.id).toBe('winner');
  });

  it('allows Product and Work Space links on the same conversation', async () => {
    prisma.messengerConversation.findUnique = vi.fn().mockResolvedValue({ zone: 'INTERNAL' });
    prisma.messengerConversationLink.create
      .mockResolvedValueOnce({ id: 'link-product' })
      .mockResolvedValueOnce({ id: 'link-workspace' });
    const product = await addCoreConversationLink(prisma as never, 'conv-1', {
      entityType: 'PRODUCT',
      entityId: 'p1',
      relationType: 'PRIMARY',
    });
    const workspace = await addCoreConversationLink(prisma as never, 'conv-1', {
      entityType: 'WORKSPACE',
      entityId: 'w1',
      relationType: 'RELATED',
    });
    expect(product.id).toBe('link-product');
    expect(workspace.id).toBe('link-workspace');
  });

  it('rejects creating a CLIENT conversation with an Internal type', async () => {
    await expect(
      createCoreConversation(prisma as never, {
        zone: 'CLIENT',
        type: 'INTERNAL_GROUP',
        createdById: LOW,
      }),
    ).rejects.toThrow(/cannot use an Internal type/);
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
  });

  it('ignores a stolen product: canonicalKey on CLIENT EXTERNAL and stores null', async () => {
    const stolen = `product:${LOW}`;
    prisma.messengerConversation.create.mockResolvedValue({
      id: 'conv-client',
      zone: 'CLIENT',
      type: 'EXTERNAL',
      title: null,
      status: 'ACTIVE',
      canonicalKey: null,
      createdAt: new Date(),
      lastMessageAt: null,
    });
    const created = await createCoreConversation(
      prisma as never,
      {
        zone: 'CLIENT',
        type: 'EXTERNAL',
        createdById: LOW,
        canonicalKey: stolen,
      } as never,
    );
    expect(created.canonicalKey).toBeNull();
    const data = prisma.messengerConversation.create.mock.calls[0]?.[0]?.data as {
      canonicalKey?: string | null;
    };
    expect(data.canonicalKey).toBeUndefined();
  });

  it('does not store caller-supplied product: or direct: keys on INTERNAL_GROUP', async () => {
    prisma.messengerConversation.create.mockResolvedValue({
      id: 'conv-group',
      zone: 'INTERNAL',
      type: 'INTERNAL_GROUP',
      title: 'Dev',
      status: 'ACTIVE',
      canonicalKey: null,
      createdAt: new Date(),
      lastMessageAt: null,
    });
    await createCoreConversation(
      prisma as never,
      {
        zone: 'INTERNAL',
        type: 'INTERNAL_GROUP',
        createdById: LOW,
        canonicalKey: `direct:${LOW}:${HIGH}`,
      } as never,
    );
    await createCoreConversation(
      prisma as never,
      {
        zone: 'INTERNAL',
        type: 'PRODUCT',
        createdById: LOW,
        canonicalKey: `product:${LOW}`,
      } as never,
    );
    for (const call of prisma.messengerConversation.create.mock.calls) {
      const data = call[0]?.data as { canonicalKey?: string | null; type: string };
      expect(data.canonicalKey).toBeUndefined();
      expect(data.canonicalKey).not.toBe(`product:${LOW}`);
      expect(data.canonicalKey).not.toBe(`direct:${LOW}:${HIGH}`);
    }
  });

  it('DIRECT still computes direct:{low}:{high} and ignores a caller-supplied key', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue({
      id: 'conv-direct-new',
      zone: 'INTERNAL',
      type: 'DIRECT',
      title: null,
      status: 'ACTIVE',
      canonicalKey: `direct:${LOW}:${HIGH}`,
      createdAt: new Date(),
      lastMessageAt: null,
    });
    const created = await createCoreConversation(
      prisma as never,
      {
        zone: 'INTERNAL',
        type: 'DIRECT',
        createdById: LOW,
        peerEmployeeId: HIGH,
        canonicalKey: `product:${LOW}`,
      } as never,
    );
    expect(created.canonicalKey).toBe(`direct:${LOW}:${HIGH}`);
    expect(prisma.messengerConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ canonicalKey: `direct:${LOW}:${HIGH}` }),
      }),
    );
  });
});
