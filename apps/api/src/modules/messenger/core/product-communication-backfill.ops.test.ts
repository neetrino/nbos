import { describe, expect, it, vi } from 'vitest';
import { backfillProductWorkBindings } from './product-communication-backfill.ops';

vi.mock('./messenger-core-revision-tx', () => ({
  runMessengerWriteTx: async <T>(prisma: T, fn: (tx: T) => Promise<unknown>) => fn(prisma),
}));

vi.mock('./messenger-core-revision-write.ops', () => ({
  bumpGlobalConversationRevision: async () => 1n,
}));

describe('backfillProductWorkBindings', () => {
  it('skips accountant group and does not create FINANCE rows', async () => {
    const created: Array<{ purpose: string; productId: string }> = [];
    const prisma = {
      whatsAppGatewayConnection: {
        findFirst: async () => ({
          gatewayAccountId: 'acc',
          accountingGroupChatId: 'acct@g.us',
        }),
      },
      productWhatsAppGroupBinding: {
        findMany: async () => [
          {
            id: 'legacy-1',
            productId: 'p1',
            groupChatId: '120363111111111111@g.us',
            groupName: 'Work',
            createdFromDealId: null,
          },
          {
            id: 'legacy-acct',
            productId: 'p-acct',
            groupChatId: 'acct@g.us',
            groupName: 'Accountant',
            createdFromDealId: null,
          },
        ],
      },
      productCommunicationBinding: {
        findUnique: async () => null,
        create: async ({ data }: { data: { purpose: string; productId: string } }) => {
          created.push({ purpose: data.purpose, productId: data.productId });
          return { id: `b-${created.length}`, conversationId: 'conv-1' };
        },
        update: async () => ({ id: 'b-1', conversationId: 'conv-1' }),
      },
      messengerExternalConversationMapping: {
        findUnique: async () => ({
          conversationId: 'conv-1',
          conversation: { zone: 'CLIENT' },
        }),
        upsert: async () => ({ id: 'map-1' }),
      },
      messengerConversation: {
        findUnique: async () => ({ id: 'conv-1' }),
        findUniqueOrThrow: async () => ({ id: 'conv-1', zone: 'CLIENT' }),
        create: async () => ({ id: 'conv-1' }),
      },
    };

    const counts = await backfillProductWorkBindings(prisma as never);
    expect(counts.skippedAccountant).toBe(1);
    expect(counts.workBindings).toBe(1);
    expect(created.every((row) => row.purpose === 'WORK')).toBe(true);
    expect(created.some((row) => row.purpose === 'FINANCE')).toBe(false);
  });
});
