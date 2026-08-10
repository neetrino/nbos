import { describe, expect, it, vi } from 'vitest';
import { ensureProjectGeneralConversation } from './messenger-conversation-ensure.ops';

describe('ensureProjectGeneralConversation', () => {
  it('is idempotent when conversation already exists', async () => {
    const existing = {
      id: 'conv-1',
      type: 'PROJECT_GENERAL',
      title: 'Demo',
      status: 'ACTIVE',
      canonicalKey: 'project_general:proj-1',
      lastMessageAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const prisma = {
      messengerConversation: {
        findUnique: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
        update: vi.fn(),
      },
      messengerConversationLink: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      messengerConversationParticipant: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    };

    const first = await ensureProjectGeneralConversation(prisma as never, {
      projectId: 'proj-1',
      title: 'Demo',
    });
    const second = await ensureProjectGeneralConversation(prisma as never, {
      projectId: 'proj-1',
      title: 'Demo',
    });

    expect(first.id).toBe('conv-1');
    expect(second.id).toBe('conv-1');
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
  });

  it('resolves concurrent unique violation to existing row', async () => {
    const existing = {
      id: 'conv-2',
      type: 'PROJECT_GENERAL',
      title: 'Demo',
      status: 'ACTIVE',
      canonicalKey: 'project_general:proj-2',
      lastMessageAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const prisma = {
      messengerConversation: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(existing),
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
        update: vi.fn(),
      },
      messengerConversationLink: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      messengerConversationParticipant: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    };

    const row = await ensureProjectGeneralConversation(prisma as never, {
      projectId: 'proj-2',
      title: 'Demo',
    });
    expect(row.id).toBe('conv-2');
    expect(prisma.messengerConversationLink.upsert).toHaveBeenCalled();
  });
});
