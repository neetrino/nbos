import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { resolveClientDestination } from './product-communication-resolver';
import { upsertProductCommunicationBinding } from './product-communication-binding.ops';
import { PRODUCT_COMMUNICATION_PURPOSE_ALREADY_ACTIVE } from './product-communication.constants';

vi.mock('./messenger-core-revision-tx', () => ({
  runMessengerWriteTx: async (_prisma: unknown, fn: (tx: unknown) => unknown) => fn(_prisma),
}));

vi.mock('./messenger-core-revision-write.ops', () => ({
  bumpGlobalConversationRevision: vi.fn(async () => 1n),
}));

const ACCOUNT = 'acc-1';
const GROUP_1 = '120363111111111111@g.us';
const GROUP_F = '120363999999999999@g.us';

describe('Slice 9 Product communication scenarios', () => {
  it('Product A WORK → Group 1; SEO shares Group 1 without cloning', async () => {
    const db = createBindingStore();
    await upsertProductCommunicationBinding(db as never, {
      productId: 'product-a',
      purpose: 'WORK',
      groupChatId: GROUP_1,
    });
    await upsertProductCommunicationBinding(db as never, {
      productId: 'product-seo',
      purpose: 'WORK',
      groupChatId: GROUP_1,
    });
    const website = await resolveClientDestination(db as never, 'product-a', 'WORK');
    const seo = await resolveClientDestination(db as never, 'product-seo', 'WORK');
    expect(website?.groupChatId).toBe(GROUP_1);
    expect(seo?.groupChatId).toBe(GROUP_1);
    expect(website?.conversationId).toBe(seo?.conversationId);
    expect(db.products.has('product-a')).toBe(true);
    expect(db.products.has('product-seo')).toBe(true);
    expect(db.products.size).toBe(2);
    expect(db.conversations.size).toBe(1);
  });

  it('five Products FINANCE → one Finance Group F', async () => {
    const db = createBindingStore();
    for (const id of ['p1', 'p2', 'p3', 'p4', 'p5']) {
      await upsertProductCommunicationBinding(db as never, {
        productId: id,
        purpose: 'WORK',
        groupChatId: `${id}-work@g.us`,
      });
      await upsertProductCommunicationBinding(db as never, {
        productId: id,
        purpose: 'FINANCE',
        groupChatId: GROUP_F,
      });
    }
    const chats = new Set<string>();
    const conversations = new Set<string>();
    for (const id of ['p1', 'p2', 'p3', 'p4', 'p5']) {
      const dest = await resolveClientDestination(db as never, id, 'FINANCE');
      expect(dest?.groupChatId).toBe(GROUP_F);
      expect(dest?.fallbackFromWork).toBe(false);
      chats.add(dest!.groupChatId);
      conversations.add(dest!.conversationId);
    }
    expect(chats.size).toBe(1);
    expect(conversations.size).toBe(1);
  });

  it('Product without FINANCE falls back to WORK', async () => {
    const db = createBindingStore();
    await upsertProductCommunicationBinding(db as never, {
      productId: 'p-work-only',
      purpose: 'WORK',
      groupChatId: GROUP_1,
    });
    const dest = await resolveClientDestination(db as never, 'p-work-only', 'FINANCE');
    expect(dest?.groupChatId).toBe(GROUP_1);
    expect(dest?.resolvedPurpose).toBe('WORK');
    expect(dest?.fallbackFromWork).toBe(true);
  });

  it('linking a second Product reuses the same conversation id', async () => {
    const db = createBindingStore();
    await upsertProductCommunicationBinding(db as never, {
      productId: 'product-a',
      purpose: 'WORK',
      groupChatId: GROUP_1,
    });
    await upsertProductCommunicationBinding(db as never, {
      productId: 'product-seo',
      purpose: 'WORK',
      groupChatId: GROUP_1,
    });
    const website = await resolveClientDestination(db as never, 'product-a', 'WORK');
    const seo = await resolveClientDestination(db as never, 'product-seo', 'WORK');
    expect(website?.conversationId).toBe(seo?.conversationId);
    expect(db.conversations.size).toBe(1);
  });

  it('cannot create two active WORK destinations for one Product', async () => {
    const db = createBindingStore();
    await upsertProductCommunicationBinding(db as never, {
      productId: 'p-one',
      purpose: 'WORK',
      groupChatId: GROUP_1,
    });
    await expect(
      upsertProductCommunicationBinding(db as never, {
        productId: 'p-one',
        purpose: 'WORK',
        groupChatId: GROUP_F,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      upsertProductCommunicationBinding(db as never, {
        productId: 'p-one',
        purpose: 'WORK',
        groupChatId: GROUP_F,
      }),
    ).rejects.toMatchObject({ message: PRODUCT_COMMUNICATION_PURPOSE_ALREADY_ACTIVE });
    const dest = await resolveClientDestination(db as never, 'p-one', 'WORK');
    expect(dest?.groupChatId).toBe(GROUP_1);
  });
});

type ConversationRow = { id: string; zone: 'CLIENT'; canonicalKey: string };

function createBindingStore() {
  const conversations = new Map<string, ConversationRow>();
  const mappings = new Map<string, { conversationId: string; chatId: string; accountId: string }>();
  const bindings = new Map<
    string,
    { id: string; productId: string; purpose: string; conversationId: string }
  >();
  const products = new Set<string>();

  function mappingKey(accountId: string, chatId: string): string {
    return `WHATSAPP:${accountId}:${chatId}`;
  }

  const prisma = {
    products,
    conversations,
    whatsAppGatewayConnection: {
      findFirst: async () => ({ gatewayAccountId: ACCOUNT, accountingGroupChatId: 'acct@g.us' }),
    },
    messengerExternalConversationMapping: {
      findUnique: async ({
        where,
      }: {
        where: {
          provider_externalAccountId_externalConversationId: {
            externalAccountId: string;
            externalConversationId: string;
          };
        };
      }) => {
        const key = mappingKey(
          where.provider_externalAccountId_externalConversationId.externalAccountId,
          where.provider_externalAccountId_externalConversationId.externalConversationId,
        );
        const row = mappings.get(key);
        if (!row) return null;
        return { conversationId: row.conversationId, conversation: { zone: 'CLIENT' } };
      },
      upsert: async ({
        where,
        create,
      }: {
        where: {
          provider_externalAccountId_externalConversationId: {
            externalAccountId: string;
            externalConversationId: string;
          };
        };
        create: {
          conversationId: string;
          externalAccountId: string;
          externalConversationId: string;
        };
      }) => {
        const key = mappingKey(
          where.provider_externalAccountId_externalConversationId.externalAccountId,
          where.provider_externalAccountId_externalConversationId.externalConversationId,
        );
        mappings.set(key, {
          conversationId: create.conversationId,
          accountId: create.externalAccountId,
          chatId: create.externalConversationId,
        });
        return { id: key };
      },
    },
    messengerConversation: {
      findUnique: async ({ where }: { where: { canonicalKey?: string; id?: string } }) => {
        if (where.id) {
          const row = [...conversations.values()].find((item) => item.id === where.id);
          return row ? { id: row.id, zone: row.zone } : null;
        }
        if (where.canonicalKey) {
          const row = conversations.get(where.canonicalKey);
          return row ? { id: row.id } : null;
        }
        return null;
      },
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        const row = [...conversations.values()].find((item) => item.id === where.id);
        if (!row) throw new Error('missing conversation');
        return { id: row.id, zone: row.zone };
      },
      create: async ({ data }: { data: { canonicalKey: string; title: string | null } }) => {
        const id = `conv-${conversations.size + 1}`;
        conversations.set(data.canonicalKey, {
          id,
          zone: 'CLIENT',
          canonicalKey: data.canonicalKey,
        });
        return { id };
      },
    },
    productCommunicationBinding: {
      findUnique: async ({
        where,
      }: {
        where: { productId_purpose: { productId: string; purpose: string }; id?: string };
      }) => {
        if (where.productId_purpose) {
          const row = bindings.get(
            `${where.productId_purpose.productId}:${where.productId_purpose.purpose}`,
          );
          if (!row) return null;
          return bindingWithMapping(row);
        }
        return null;
      },
      create: async ({
        data,
      }: {
        data: { productId: string; purpose: string; conversationId: string };
      }) => {
        const key = `${data.productId}:${data.purpose}`;
        if (bindings.has(key)) {
          const error = Object.assign(new Error('unique'), { code: 'P2002' });
          throw error;
        }
        products.add(data.productId);
        const row = { id: `bind-${bindings.size + 1}`, ...data };
        bindings.set(key, row);
        return { id: row.id, conversationId: row.conversationId };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { conversationId?: string };
      }) => {
        const current = [...bindings.values()].find((row) => row.id === where.id);
        if (!current) throw new Error('missing binding');
        if (data.conversationId) current.conversationId = data.conversationId;
        return { id: current.id, conversationId: current.conversationId };
      },
    },
  };

  function bindingWithMapping(row: {
    id: string;
    productId: string;
    purpose: string;
    conversationId: string;
  }) {
    const mapping = [...mappings.values()].find(
      (item) => item.conversationId === row.conversationId,
    );
    return {
      id: row.id,
      conversationId: row.conversationId,
      conversation: {
        externalMappings: mapping
          ? [
              {
                externalAccountId: mapping.accountId,
                externalConversationId: mapping.chatId,
              },
            ]
          : [],
      },
    };
  }

  return prisma;
}
