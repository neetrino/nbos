import {
  createSlice9AccessAndOpsPrisma,
  type Slice9OperationRow,
} from './product-whatsapp-runtime-ops.store';

export const SLICE9_ACCOUNT = 'acc-1';
export const SLICE9_ACCOUNTANT = '120363000000000000@g.us';
export const SLICE9_GROUP_1 = '120363111111111111@g.us';
export const SLICE9_GROUP_2 = '120363222222222222@g.us';

type MappingRow = { conversationId: string; accountId: string; chatId: string };
type ConversationRow = { id: string; zone: 'CLIENT'; type: 'EXTERNAL'; canonicalKey: string };
type CommBinding = {
  id: string;
  productId: string;
  purpose: string;
  conversationId: string;
  legacyBindingId: string | null;
};
type LegacyRow = {
  id: string;
  productId: string;
  groupChatId: string | null;
  groupName: string | null;
  status: string;
  createdFromDealId: string | null;
  lastSuccessfulSyncAt: Date | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export function createSlice9RuntimeStore() {
  const conversations = new Map<string, ConversationRow>();
  const mappings = new Map<string, MappingRow>();
  const commBindings = new Map<string, CommBinding>();
  const legacyByProduct = new Map<string, LegacyRow>();
  const operations: Slice9OperationRow[] = [];
  const invitations = new Map<string, { id: string; status: string; productId: string }>();
  const products = new Map<string, { id: string; projectId: string; contactId: string | null }>();
  const participantCreates: unknown[] = [];
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${++seq}`;

  function mappingKey(accountId: string, chatId: string): string {
    return `WHATSAPP:${accountId}:${chatId}`;
  }

  const prisma = {
    participantCreates,
    operations,
    products,
    whatsAppGatewayConnection: {
      findFirst: async () => ({
        gatewayAccountId: SLICE9_ACCOUNT,
        accountingGroupChatId: SLICE9_ACCOUNTANT,
      }),
    },
    product: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = products.get(where.id);
        if (!row) return null;
        return {
          ...row,
          project: { contactId: 'contact-1', name: 'Project' },
          order: { deal: { contactId: 'contact-1' } },
        };
      },
    },
    productWhatsAppGroupBinding: {
      findUnique: async ({ where }: { where: { productId: string } }) =>
        legacyByProduct.get(where.productId) ?? null,
      findFirst: async ({
        where,
      }: {
        where: { groupChatId: string; productId: { not: string } };
      }) =>
        [...legacyByProduct.values()].find(
          (row) => row.groupChatId === where.groupChatId && row.productId !== where.productId.not,
        ) ?? null,
      create: async ({ data }: { data: Partial<LegacyRow> & { productId: string } }) => {
        const row: LegacyRow = {
          id: data.id ?? nextId('legacy'),
          productId: data.productId,
          groupChatId: data.groupChatId ?? null,
          groupName: data.groupName ?? null,
          status: data.status ?? 'PENDING',
          createdFromDealId: data.createdFromDealId ?? null,
          lastSuccessfulSyncAt: data.lastSuccessfulSyncAt ?? null,
          lastErrorCode: data.lastErrorCode ?? null,
          lastErrorMessage: data.lastErrorMessage ?? null,
        };
        legacyByProduct.set(row.productId, row);
        return { id: row.id };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<LegacyRow> }) => {
        const current = [...legacyByProduct.values()].find((row) => row.id === where.id);
        if (!current) throw new Error('missing legacy');
        Object.assign(current, data);
        return { id: current.id };
      },
      updateMany: async () => ({ count: 0 }),
    },
    productCommunicationBinding: {
      findUnique: async ({
        where,
      }: {
        where: { productId_purpose: { productId: string; purpose: string } };
      }) => {
        const row = commBindings.get(
          `${where.productId_purpose.productId}:${where.productId_purpose.purpose}`,
        );
        if (!row) return null;
        return bindingWithMapping(row);
      },
      create: async ({
        data,
      }: {
        data: {
          productId: string;
          purpose: string;
          conversationId: string;
          legacyBindingId?: string | null;
        };
      }) => {
        const key = `${data.productId}:${data.purpose}`;
        if (commBindings.has(key)) {
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        const row: CommBinding = {
          id: nextId('cbind'),
          productId: data.productId,
          purpose: data.purpose,
          conversationId: data.conversationId,
          legacyBindingId: data.legacyBindingId ?? null,
        };
        commBindings.set(key, row);
        return { id: row.id, conversationId: row.conversationId };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { conversationId?: string; legacyBindingId?: string | null };
      }) => {
        const current = [...commBindings.values()].find((row) => row.id === where.id);
        if (!current) throw new Error('missing comm');
        if (data.conversationId) current.conversationId = data.conversationId;
        if (data.legacyBindingId !== undefined) current.legacyBindingId = data.legacyBindingId;
        return { id: current.id, conversationId: current.conversationId };
      },
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
        create,
      }: {
        create: {
          conversationId: string;
          externalAccountId: string;
          externalConversationId: string;
        };
      }) => {
        const key = mappingKey(create.externalAccountId, create.externalConversationId);
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
          return row ? { id: row.id, zone: row.zone, type: row.type } : null;
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
        const id = nextId('conv');
        conversations.set(data.canonicalKey, {
          id,
          zone: 'CLIENT',
          type: 'EXTERNAL',
          canonicalKey: data.canonicalKey,
        });
        return { id };
      },
    },
    $queryRaw: async () => [{ revision: 1n }],
    messengerConversationRevision: {
      upsert: async () => ({ revision: 1n }),
    },
    ...createSlice9AccessAndOpsPrisma(nextId, operations, invitations, participantCreates),
  };

  function bindingWithMapping(row: CommBinding) {
    const mapping = [...mappings.values()].find(
      (item) => item.conversationId === row.conversationId,
    );
    return {
      id: row.id,
      conversationId: row.conversationId,
      conversation: {
        externalMappings: mapping
          ? [{ externalAccountId: mapping.accountId, externalConversationId: mapping.chatId }]
          : [],
      },
    };
  }

  function seedProduct(productId: string): void {
    products.set(productId, { id: productId, projectId: 'proj-1', contactId: 'contact-1' });
  }

  function seedLegacyActive(productId: string, groupChatId: string, groupName = 'Work'): void {
    seedProduct(productId);
    legacyByProduct.set(productId, {
      id: nextId('legacy'),
      productId,
      groupChatId,
      groupName,
      status: 'ACTIVE',
      createdFromDealId: null,
      lastSuccessfulSyncAt: new Date(),
      lastErrorCode: null,
      lastErrorMessage: null,
    });
  }

  return {
    prisma,
    participantCreates,
    operations,
    seedProduct,
    seedLegacyActive,
    getLegacy: (productId: string) => legacyByProduct.get(productId) ?? null,
  };
}
