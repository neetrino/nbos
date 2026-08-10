import { describe, expect, it } from 'vitest';
import { resolveChannelConversationTarget } from './messenger-legacy-backfill-resolve';

describe('resolveChannelConversationTarget', () => {
  it('reuses existing canonical conversation id', async () => {
    const prisma = {
      messengerConversation: {
        findUnique: async ({ where }: { where: { canonicalKey?: string; id?: string } }) => {
          if (where.canonicalKey === 'project_general:p1') {
            return { id: 'ensure-uuid' };
          }
          if (where.id === 'legacy-channel') {
            return null;
          }
          return null;
        },
      },
    };
    const result = await resolveChannelConversationTarget(prisma as never, {
      conversationId: 'legacy-channel',
      canonicalKey: 'project_general:p1',
    });
    expect(result).toEqual({
      ok: true,
      conversationId: 'ensure-uuid',
      createWithLegacyId: false,
      reconciled: true,
    });
  });

  it('blocks when both canonical and legacy-id rows exist with different ids', async () => {
    const prisma = {
      messengerConversation: {
        findUnique: async ({ where }: { where: { canonicalKey?: string; id?: string } }) => {
          if (where.canonicalKey) return { id: 'ensure-uuid' };
          if (where.id) return { id: 'legacy-channel', canonicalKey: 'other' };
          return null;
        },
      },
    };
    const result = await resolveChannelConversationTarget(prisma as never, {
      conversationId: 'legacy-channel',
      canonicalKey: 'project_general:p1',
    });
    expect(result.ok).toBe(false);
  });
});
