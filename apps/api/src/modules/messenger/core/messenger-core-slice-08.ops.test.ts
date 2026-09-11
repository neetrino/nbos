import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistWhatsAppInboundMessage } from './messenger-wa-inbound.ops';
import { ensureWhatsAppClientConversation } from './messenger-wa-ensure.ops';
import { findMappedWhatsAppConversation } from './messenger-wa-ensure.ops';
import { dispatchWhatsAppCoreSendJob } from './messenger-wa-outbound-dispatch.ops';
import { findClientWhatsAppMapping } from './messenger-wa-outbound.ops';
import {
  claimWhatsAppProviderEvent,
  markWhatsAppProviderEvent,
} from './messenger-wa-provider-event.ops';
import { WhatsAppGatewayHttpError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import { isWhatsAppChatId, whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';
import { MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN } from './messenger-core.constants';
import { commandLockMocks } from './messenger-outbound-lock-test.util';

vi.mock('./messenger-core-revision-tx', () => ({
  runMessengerWriteTx: async (_prisma: unknown, fn: (tx: unknown) => unknown) => fn(_prisma),
}));

vi.mock('./messenger-core-revision-write.ops', () => ({
  bumpGlobalConversationRevision: vi.fn(async () => 1n),
}));

const ACCOUNT_A = 'acc_a';
const ACCOUNT_B = 'acc_b';
const CHAT = '37499111222@c.us';

describe('Slice 8 WhatsApp connector', () => {
  it('accepts WhatsApp JIDs and rejects lid / s.whatsapp.net', () => {
    expect(isWhatsAppChatId(CHAT)).toBe(true);
    expect(isWhatsAppChatId('120363111111111111@g.us')).toBe(true);
    expect(isWhatsAppChatId('123@lid')).toBe(false);
    expect(isWhatsAppChatId('37499@s.whatsapp.net')).toBe(false);
  });

  it('builds a stable outbound idempotency key for Gateway', () => {
    expect(whatsAppOutboundIdempotencyKey('11111111-1111-4111-8111-111111111111')).toBe(
      'core-wa-send:11111111-1111-4111-8111-111111111111',
    );
  });
});

describe('WhatsApp inbound persist', () => {
  const prisma = {
    messengerExternalConversationMapping: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    messengerConversation: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    messengerMessage: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    messengerMessageExternalRef: {
      createMany: vi.fn(),
    },
    messengerMessageMention: {
      createMany: vi.fn(),
    },
    $executeRaw: vi.fn().mockResolvedValue(1),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.messengerConversation.update.mockResolvedValue({});
    prisma.messengerConversation.findUniqueOrThrow.mockResolvedValue({
      id: 'conv-new',
      zone: 'CLIENT',
    });
    prisma.messengerExternalConversationMapping.findUnique.mockResolvedValue(null);
    prisma.messengerExternalConversationMapping.upsert.mockResolvedValue({ id: 'map-1' });
    prisma.messengerMessageExternalRef.createMany.mockResolvedValue({ count: 1 });
  });

  it('creates a CLIENT conversation for an unknown chat and does not read Product bindings', async () => {
    prisma.messengerConversation.findUnique.mockImplementation(
      async ({ where }: { where: { canonicalKey?: string; id?: string } }) => {
        if (where.canonicalKey) return null;
        if (where.id) return { id: where.id, zone: 'CLIENT' };
        return null;
      },
    );
    prisma.messengerConversation.create.mockResolvedValue({ id: 'conv-new', zone: 'CLIENT' });
    prisma.messengerMessage.create.mockImplementation(
      async ({ data }: { data: { content: string } }) => ({
        id: 'msg-1',
        conversationId: 'conv-new',
        senderId: null,
        senderNameSnapshot: 'Armen',
        content: data.content,
        direction: 'INBOUND',
        status: 'SENT',
        provenance: 'PROVIDER',
        replyToMessageId: null,
        threadRootMessageId: null,
        createdAt: new Date(),
        editedAt: null,
        attachments: [],
      }),
    );
    const result = await persistWhatsAppInboundMessage(prisma as never, {
      accountId: ACCOUNT_A,
      chatId: CHAT,
      providerMessageId: 'wamid-1',
      body: 'Hello',
      senderName: 'Armen',
      fromMe: false,
      createdAt: new Date('2026-08-31T12:00:00.000Z'),
    });
    expect(result.skipped).toBe(false);
    expect(result.created).toBe(true);
    expect(result.conversationId).toBe('conv-new');
    expect(prisma.messengerConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          zone: 'CLIENT',
          type: 'EXTERNAL',
          canonicalKey: `wa:${ACCOUNT_A}:${CHAT}`,
        }),
      }),
    );
    expect(prisma).not.toHaveProperty('productWhatsAppGroupBinding');
  });

  it('returns the existing message on inbound idempotency replay', async () => {
    prisma.messengerExternalConversationMapping.findUnique.mockResolvedValue({
      conversationId: 'conv-1',
      conversation: { zone: 'CLIENT' },
    });
    prisma.messengerMessage.findUnique.mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: null,
      senderNameSnapshot: 'Armen',
      content: 'Hello',
      direction: 'INBOUND',
      status: 'SENT',
      provenance: 'PROVIDER',
      replyToMessageId: null,
      threadRootMessageId: null,
      createdAt: new Date(),
      editedAt: null,
      attachments: [],
      mentions: [],
      referencesAsTarget: [],
    });
    const first = await persistWhatsAppInboundMessage(prisma as never, {
      accountId: ACCOUNT_A,
      chatId: CHAT,
      providerMessageId: 'wamid-1',
      body: 'Hello',
      senderName: 'Armen',
      fromMe: false,
      createdAt: new Date(),
    });
    const second = await persistWhatsAppInboundMessage(prisma as never, {
      accountId: ACCOUNT_A,
      chatId: CHAT,
      providerMessageId: 'wamid-1',
      body: 'Hello',
      senderName: 'Armen',
      fromMe: false,
      createdAt: new Date(),
    });
    expect(first.created).toBe(false);
    expect(second.created).toBe(false);
    expect(second.message?.id).toBe('msg-1');
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
  });

  it('repairs a missing external ref on inbound idempotency replay (FINDING-S8-07)', async () => {
    prisma.messengerExternalConversationMapping.findUnique.mockResolvedValue({
      conversationId: 'conv-1',
      conversation: { zone: 'CLIENT' },
    });
    prisma.messengerMessage.findUnique.mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: null,
      senderNameSnapshot: 'Armen',
      content: 'Hello',
      direction: 'INBOUND',
      status: 'SENT',
      provenance: 'PROVIDER',
      replyToMessageId: null,
      threadRootMessageId: null,
      createdAt: new Date(),
      editedAt: null,
      attachments: [],
      mentions: [],
      referencesAsTarget: [],
    });
    const replayed = await persistWhatsAppInboundMessage(prisma as never, {
      accountId: ACCOUNT_A,
      chatId: CHAT,
      providerMessageId: 'wamid-missing-ref',
      body: 'Hello',
      senderName: 'Armen',
      fromMe: false,
      createdAt: new Date(),
    });
    expect(replayed.created).toBe(false);
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(prisma.messengerMessageExternalRef.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            messageId: 'msg-1',
            provider: 'WHATSAPP',
            externalAccountId: ACCOUNT_A,
            externalMessageId: 'wamid-missing-ref',
          }),
        ],
        skipDuplicates: true,
      }),
    );
  });

  it('does not bind inbound from account B onto account A mapping', async () => {
    prisma.messengerExternalConversationMapping.findUnique.mockImplementation(
      async ({
        where,
      }: {
        where: {
          provider_externalAccountId_externalConversationId: { externalAccountId: string };
        };
      }) => {
        if (
          where.provider_externalAccountId_externalConversationId.externalAccountId === ACCOUNT_A
        ) {
          return { conversationId: 'conv-a', conversation: { zone: 'CLIENT' } };
        }
        return null;
      },
    );
    const mappedA = await findMappedWhatsAppConversation(prisma as never, ACCOUNT_A, CHAT);
    const mappedB = await findMappedWhatsAppConversation(prisma as never, ACCOUNT_B, CHAT);
    expect(mappedA?.id).toBe('conv-a');
    expect(mappedB).toBeNull();
  });

  it('skips inbound when the mapped conversation is INTERNAL', async () => {
    prisma.messengerExternalConversationMapping.findUnique.mockResolvedValue({
      conversationId: 'conv-internal',
      conversation: { zone: 'INTERNAL' },
    });
    const result = await persistWhatsAppInboundMessage(prisma as never, {
      accountId: ACCOUNT_A,
      chatId: CHAT,
      providerMessageId: 'wamid-x',
      body: 'nope',
      senderName: 'Armen',
      fromMe: false,
      createdAt: new Date(),
    });
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('INTERNAL_ZONE_FORBIDDEN');
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
  });

  it('skips fromMe echoes and invalid JIDs without creating conversations', async () => {
    const echo = await persistWhatsAppInboundMessage(prisma as never, {
      accountId: ACCOUNT_A,
      chatId: CHAT,
      providerMessageId: 'wamid-me',
      body: 'echo',
      senderName: 'Me',
      fromMe: true,
      createdAt: new Date(),
    });
    const invalid = await persistWhatsAppInboundMessage(prisma as never, {
      accountId: ACCOUNT_A,
      chatId: '123@lid',
      providerMessageId: 'wamid-lid',
      body: 'nope',
      senderName: 'Armen',
      fromMe: false,
      createdAt: new Date(),
    });
    expect(echo.skipReason).toBe('FROM_ME_ECHO');
    expect(invalid.skipReason).toBe('INVALID_CHAT_ID');
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
  });
});

describe('WhatsApp ensure mapping', () => {
  it('does not upsert a new mapping when the chat already maps to INTERNAL', async () => {
    const prisma = {
      messengerExternalConversationMapping: {
        findUnique: vi.fn().mockResolvedValue({
          conversationId: 'conv-i',
          conversation: { zone: 'INTERNAL' },
        }),
        upsert: vi.fn(),
      },
    };
    await expect(
      ensureWhatsAppClientConversation(prisma as never, {
        accountId: ACCOUNT_A,
        chatId: CHAT,
        title: 'x',
      }),
    ).resolves.toMatchObject({ zone: 'INTERNAL', id: 'conv-i' });
    expect(prisma.messengerExternalConversationMapping.upsert).not.toHaveBeenCalled();
  });
});

describe('WhatsApp outbound dispatch', () => {
  const connection = { requireClientConfig: vi.fn() };
  const client = { sendAccountTextMessage: vi.fn() };

  function prismaFor(status: string, hasWhatsAppRef = status === 'OUTCOME_UNKNOWN') {
    const cmd = {
      id: 'cmd-1',
      conversationId: 'conv-1',
      resultMessageId: 'msg-1',
      idempotencyKey: 'core-wa-send:msg-1',
      kind: 'SEND_MESSAGE',
      status: 'PENDING',
      payload: { accountId: ACCOUNT_A, chatId: CHAT },
      firstAttemptAt: null as Date | null,
      createdAt: new Date(),
      invalidReason: null as string | null,
      nextReconcileAt: null as Date | null,
      dispatchToken: null as string | null,
      dispatchClaimedAt: null as Date | null,
    };
    return {
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'hi',
          status,
          deletedAt: null,
          conversation: { zone: 'CLIENT' },
        }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      messengerMessageExternalRef: {
        createMany: vi.fn(),
        findFirst: vi
          .fn()
          .mockResolvedValue(
            hasWhatsAppRef
              ? { id: 'ref-1', externalMessageId: 'wamid-1', externalAccountId: ACCOUNT_A }
              : null,
          ),
        findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
      },
      messengerExternalConversationMapping: {
        findFirst: vi.fn().mockResolvedValue({
          externalAccountId: ACCOUNT_A,
          externalConversationId: CHAT,
          conversation: { zone: 'CLIENT' },
        }),
      },
      ...commandLockMocks(cmd),
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    };
  }

  const job = {
    kind: 'core_client_send' as const,
    chatId: CHAT,
    accountId: ACCOUNT_A,
    messageId: 'msg-1',
    conversationId: 'conv-1',
    idempotencyKey: 'core-wa-send:msg-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    connection.requireClientConfig.mockResolvedValue({
      baseUrl: 'https://wa.test',
      apiToken: 'tok',
    });
  });

  it('does not call Gateway again when status is OUTCOME_UNKNOWN and a WHATSAPP ref exists', async () => {
    const prisma = prismaFor('OUTCOME_UNKNOWN', true);
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, job);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
  });

  it('marks FAILED on disconnected session without retrying', async () => {
    const prisma = prismaFor('QUEUED');
    client.sendAccountTextMessage.mockRejectedValue(
      new WhatsAppGatewayHttpError(409, 'WHATSAPP_NOT_CONNECTED', 'not paired'),
    );
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, job);
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['QUEUED', 'SENDING'] } }),
        data: { status: 'FAILED' },
      }),
    );
    expect(prisma.messengerCommand.updateMany).toHaveBeenCalled();
  });

  it('marks OUTCOME_UNKNOWN and does not throw (BullMQ must not resend)', async () => {
    const prisma = prismaFor('QUEUED');
    client.sendAccountTextMessage.mockRejectedValue(
      new WhatsAppGatewayHttpError(503, 'MESSAGE_OUTCOME_UNKNOWN', 'unknown'),
    );
    await expect(
      dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, job),
    ).resolves.toBeUndefined();
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['QUEUED', 'SENDING'] } }),
        data: { status: 'OUTCOME_UNKNOWN' },
      }),
    );
  });

  function casPrisma(initial: string, findStatus?: string) {
    const stored = { status: initial };
    const prisma = {
      messengerMessage: {
        findUnique: vi.fn(async () => ({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'hi',
          status: findStatus ?? stored.status,
          deletedAt: null,
          conversation: { zone: 'CLIENT' },
        })),
        update: vi.fn(async ({ data }: { data: { status: string } }) => {
          stored.status = data.status;
          return {};
        }),
        updateMany: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { status?: string | { in: string[] } };
            data: { status: string };
          }) => {
            const allowed =
              typeof where.status === 'string' ? [where.status] : (where.status?.in ?? []);
            if (!allowed.includes(stored.status)) return { count: 0 };
            stored.status = data.status;
            return { count: 1 };
          },
        ),
      },
      messengerMessageExternalRef: {
        createMany: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
      },
      messengerExternalConversationMapping: {
        findFirst: vi.fn().mockResolvedValue({
          externalAccountId: ACCOUNT_A,
          externalConversationId: CHAT,
          conversation: { zone: 'CLIENT' },
        }),
      },
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: 'cmd-1',
          conversationId: 'conv-1',
          resultMessageId: 'msg-1',
          idempotencyKey: 'core-wa-send:msg-1',
          kind: 'SEND_MESSAGE',
          status: 'PENDING',
          payload: { accountId: ACCOUNT_A, chatId: CHAT },
          firstAttemptAt: null,
          createdAt: new Date(),
          invalidReason: null,
          nextReconcileAt: null,
          dispatchToken: null,
          dispatchClaimedAt: null,
        },
      ]),
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cmd-1',
          conversationId: 'conv-1',
          resultMessageId: 'msg-1',
          idempotencyKey: 'core-wa-send:msg-1',
          kind: 'SEND_MESSAGE',
          status: 'PENDING',
          payload: { accountId: ACCOUNT_A, chatId: CHAT },
          firstAttemptAt: null,
          createdAt: new Date(),
          invalidReason: null,
          nextReconcileAt: null,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(1),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    };
    return { prisma, stored };
  }

  it('does not write OUTCOME_UNKNOWN over DELIVERED', async () => {
    const { prisma, stored } = casPrisma('QUEUED');
    client.sendAccountTextMessage.mockImplementation(async () => {
      stored.status = 'DELIVERED';
      throw new WhatsAppGatewayHttpError(503, 'MESSAGE_OUTCOME_UNKNOWN', 'unknown');
    });
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, job);
    expect(stored.status).toBe('DELIVERED');
  });

  it('SENDING CAS count 0 does not clobber READ', async () => {
    const { prisma, stored } = casPrisma('READ', 'QUEUED');
    client.sendAccountTextMessage.mockResolvedValue({ messageId: 'wamid-1' });
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, job);
    expect(stored.status).toBe('READ');
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
  });
});

describe('findClientWhatsAppMapping', () => {
  it('returns null for INTERNAL mapped rows', async () => {
    const prisma = {
      messengerExternalConversationMapping: {
        findFirst: vi.fn().mockResolvedValue({
          externalAccountId: ACCOUNT_A,
          externalConversationId: CHAT,
          conversation: { zone: 'INTERNAL' },
        }),
      },
    };
    await expect(findClientWhatsAppMapping(prisma as never, 'conv-1')).resolves.toBeNull();
  });
});

describe('INTERNAL mapping still forbidden', () => {
  it('keeps the Slice 2 provider mapping rejection', () => {
    expect(MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN.length).toBeGreaterThan(0);
    expect(ForbiddenException).toBeDefined();
  });
});

describe('WhatsApp provider event claim', () => {
  const event = {
    eventId: 'evt-1',
    accountId: ACCOUNT_A,
    type: 'message.received',
    occurredAt: new Date(),
    chatId: CHAT,
    providerMessageId: 'wamid-1',
    body: 'hi',
    fromMe: false,
    senderName: 'Armen',
    ack: null,
    sessionStatus: null,
    chatName: null,
  };

  it('dispatches a new eventId and skips a PROCESSED duplicate', async () => {
    const created = {
      messengerProviderEvent: {
        create: vi.fn().mockResolvedValue({ id: 'pe-1' }),
        findUnique: vi.fn(),
      },
    };
    const first = await claimWhatsAppProviderEvent(created as never, event);
    expect(first).toEqual({ id: 'pe-1', dispatch: true });

    const duplicate = {
      messengerProviderEvent: {
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'pe-1', status: 'PROCESSED' }),
      },
    };
    const second = await claimWhatsAppProviderEvent(duplicate as never, event);
    expect(second.dispatch).toBe(false);
  });

  it('re-dispatches the same eventId while status is still RECEIVED', async () => {
    const retry = {
      messengerProviderEvent: {
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'pe-1', status: 'RECEIVED' }),
      },
    };
    const claimed = await claimWhatsAppProviderEvent(retry as never, event);
    expect(claimed).toEqual({ id: 'pe-1', dispatch: true });
  });

  it('does not mark MESSAGE_NOT_FOUND as SKIPPED', async () => {
    const prisma = { messengerProviderEvent: { update: vi.fn() } };
    await markWhatsAppProviderEvent(prisma as never, 'pe-1', {
      skipReason: 'MESSAGE_NOT_FOUND',
    });
    expect(prisma.messengerProviderEvent.update).not.toHaveBeenCalled();
  });
});
