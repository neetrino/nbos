import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreService } from './messenger-core.service';
import { MESSENGER_CORE_CLIENT_SEND_DISABLED } from './messenger-core.constants';

const loadMessengerLegacyAccess = vi.fn();

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: (...args: unknown[]) => loadMessengerLegacyAccess(...args),
}));

vi.mock('../messenger-attachment-access.op', () => ({
  assertMessengerFileAssetsAttachable: vi.fn(
    async (_prisma: unknown, _access: unknown, ids: string[]) => ids,
  ),
}));

const ACCESS = {
  employeeId: 'e1',
  departmentIds: [],
  viewScope: 'ALL',
  editScope: 'ALL',
  driveViewScope: 'ALL',
};

function createService() {
  const order: string[] = [];
  const prisma = {
    employee: {
      findUnique: vi.fn().mockResolvedValue({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@nbos.test',
      }),
    },
    fileAsset: { findMany: vi.fn().mockResolvedValue([]) },
    messengerConversation: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'conv-1',
        zone: 'INTERNAL',
        type: 'INTERNAL_GROUP',
        title: 'Dev',
        status: 'ACTIVE',
        canonicalKey: null,
        createdAt: new Date(),
        lastMessageAt: null,
      }),
      update: vi.fn().mockImplementation(async () => {
        return {};
      }),
    },
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }: { data: { content: string } }) => {
        order.push('persist');
        return {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'e1',
          senderNameSnapshot: 'Ada Lovelace',
          content: data.content,
          direction: 'INTERNAL',
          status: 'SENT',
          provenance: 'EMPLOYEE',
          replyToMessageId: null,
          threadRootMessageId: null,
          createdAt: new Date(),
          editedAt: null,
          attachments: [],
        };
      }),
    },
    messengerConversationParticipant: { upsert: vi.fn() },
    messengerConversationReadState: { upsert: vi.fn() },
  };
  const gateway = {
    emitCoreConversationMessage: vi.fn().mockImplementation(() => {
      order.push('emit');
    }),
    emitReadListsUpdated: vi.fn(),
  };
  const service = new MessengerCoreService(prisma as never, gateway as never);
  return { service, prisma, gateway, order };
}

describe('MessengerCoreService persist-before-emit', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset();
    loadMessengerLegacyAccess.mockResolvedValue(ACCESS);
  });

  it('requires an authenticated employee with MESSENGER VIEW', async () => {
    loadMessengerLegacyAccess.mockResolvedValue(null);
    const { service } = createService();
    await expect(service.getConversation('conv-1', 'e1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('persists the durable message before realtime emit', async () => {
    const { service, gateway, order } = createService();
    const message = await service.persistAndBroadcast({
      conversationId: 'conv-1',
      senderId: 'e1',
      content: 'hello',
    });
    expect(message.id).toBe('msg-1');
    expect(order).toEqual(['persist', 'emit']);
    expect(gateway.emitCoreConversationMessage).toHaveBeenCalledTimes(1);
  });

  it('does not emit when persist throws', async () => {
    const { service, prisma, gateway, order } = createService();
    prisma.messengerMessage.create.mockRejectedValue(new Error('db down'));
    await expect(
      service.persistAndBroadcast({
        conversationId: 'conv-1',
        senderId: 'e1',
        content: 'hello',
      }),
    ).rejects.toThrow('db down');
    expect(order).toEqual([]);
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });

  it('blocks Client send on the HTTP/service default path', async () => {
    const { service, prisma, gateway } = createService();
    prisma.messengerConversation.findUnique.mockResolvedValue({
      id: 'conv-c',
      zone: 'CLIENT',
      type: 'EXTERNAL',
      title: 'Client',
      status: 'ACTIVE',
      canonicalKey: null,
      createdAt: new Date(),
      lastMessageAt: null,
    });
    await expect(
      service.persistAndBroadcast({
        conversationId: 'conv-c',
        senderId: 'e1',
        content: 'visible to client',
      }),
    ).rejects.toThrow(MESSENGER_CORE_CLIENT_SEND_DISABLED);
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });

  it('has no allowClientPersist parameter and ignores a leftover second argument', async () => {
    const { service, prisma, gateway } = createService();
    expect(service.persistAndBroadcast.length).toBe(1);
    prisma.messengerConversation.findUnique.mockResolvedValue({
      id: 'conv-c',
      zone: 'CLIENT',
      type: 'EXTERNAL',
      title: 'Client',
      status: 'ACTIVE',
      canonicalKey: null,
      createdAt: new Date(),
      lastMessageAt: null,
    });
    const persist = service.persistAndBroadcast.bind(service) as unknown as (
      input: { conversationId: string; senderId: string; content: string },
      extra?: { allowClientPersist: boolean },
    ) => Promise<unknown>;
    await expect(
      persist(
        { conversationId: 'conv-c', senderId: 'e1', content: 'bypass' },
        { allowClientPersist: true },
      ),
    ).rejects.toThrow(MESSENGER_CORE_CLIENT_SEND_DISABLED);
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });
});
