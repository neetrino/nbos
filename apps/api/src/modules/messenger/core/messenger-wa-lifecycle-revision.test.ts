import { describe, expect, it, vi } from 'vitest';
import { applyWhatsAppEdit, applyWhatsAppRevoke } from './messenger-wa-lifecycle.ops';

const REVOKED_AT = new Date('2026-10-01T12:00:00.000Z');

describe('WhatsApp lifecycle revision', () => {
  it('revokes inside the write transaction and returns the tombstone after commit', async () => {
    const order: string[] = [];
    const prisma = lifecyclePrisma(order);
    const result = await applyWhatsAppRevoke(prisma as never, {
      accountId: 'acc',
      providerMessageId: 'wamid-1',
      revokedAt: REVOKED_AT,
    });
    expect(order).toEqual(['update', 'revision', 'commit']);
    expect(result.skipped).toBe(false);
    expect(result.message?.deletedAt).toEqual(REVOKED_AT);
    expect(result.message?.id).toBe('m1');
  });

  it('edits inside the write transaction and returns after commit', async () => {
    const order: string[] = [];
    const prisma = lifecyclePrisma(order);
    const result = await applyWhatsAppEdit(prisma as never, {
      accountId: 'acc',
      providerMessageId: 'wamid-1',
      body: 'edited',
      editedAt: REVOKED_AT,
    });
    expect(order).toEqual(['update', 'revision', 'commit']);
    expect(result.message?.content).toBe('edited');
    expect(result.message?.deletedAt).toBeNull();
  });
});

function lifecyclePrisma(order: string[]) {
  const row = messageRow();
  const prisma = {
    messengerMessageExternalRef: {
      findUnique: vi.fn().mockResolvedValue({ messageId: 'm1' }),
    },
    messengerMessage: {
      findUnique: vi.fn(async () => row),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        order.push('update');
        return { ...row, ...data };
      }),
    },
    messengerConversation: {
      findUnique: vi.fn().mockResolvedValue({ zone: 'CLIENT' }),
    },
    messengerConversationRevision: {
      upsert: vi.fn(async () => {
        order.push('revision');
      }),
    },
    $queryRaw: vi.fn(async (query: { strings?: readonly string[] }) => {
      const text = query?.strings?.join(' ') ?? '';
      if (text.includes('messenger_zone_revision_counters')) return [{ revision: 8n }];
      return [];
    }),
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const result = await fn(prisma);
      order.push('commit');
      return result;
    }),
  };
  return prisma;
}

function messageRow() {
  return {
    id: 'm1',
    conversationId: 'conv-1',
    senderId: 'e1',
    senderNameSnapshot: 'Ada',
    content: 'hi',
    direction: 'OUTBOUND' as const,
    status: 'DELIVERED' as const,
    provenance: 'EMPLOYEE' as const,
    replyToMessageId: null,
    threadRootMessageId: null,
    idempotencyKey: null,
    createdAt: new Date('2026-10-01T11:00:00.000Z'),
    editedAt: null,
    deletedAt: null,
    attachments: [],
    mentions: [],
    referencesAsTarget: [],
  };
}
