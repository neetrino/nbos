import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreService } from './messenger-core.service';
import {
  MESSENGER_CORE_CLIENT_SEND_DISABLED,
  MESSENGER_CORE_CLIENT_SEND_FORBIDDEN,
  MESSENGER_CORE_CLIENT_WRITE_FORBIDDEN,
} from './messenger-core.constants';

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
  viewScope: 'ALL' as const,
  editScope: 'ALL' as const,
  clientReadScope: 'ALL' as const,
  clientSendScope: 'ALL' as const,
  driveViewScope: 'ALL',
};

const CLIENT_READ_ALL_EDIT_OWN = {
  employeeId: 'e1',
  departmentIds: [],
  viewScope: 'OWN' as const,
  editScope: 'OWN' as const,
  clientReadScope: 'ALL' as const,
  clientSendScope: 'NONE' as const,
  driveViewScope: 'OWN',
};

function clientConversation() {
  return {
    id: 'conv-c',
    zone: 'CLIENT' as const,
    type: 'EXTERNAL' as const,
    title: 'Client',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: new Date(),
    lastMessageAt: null,
  };
}

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
    messengerConversationParticipant: {
      findFirst: vi.fn().mockResolvedValue(null),
      upsert: vi.fn(),
    },
    resourceAccessGrant: { findFirst: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
    messengerConversationReadState: { upsert: vi.fn() },
    messengerConversationLink: { create: vi.fn() },
    messengerMessageReference: { create: vi.fn() },
  };
  const gateway = {
    emitCoreConversationMessage: vi.fn().mockImplementation(() => {
      order.push('emit');
    }),
    emitReadListsUpdated: vi.fn(),
  };
  const audit = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
  const service = new MessengerCoreService(prisma as never, gateway as never, audit as never);
  return { service, prisma, gateway, audit, order };
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

describe('MessengerCoreService Slice 2 ACL', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset();
    loadMessengerLegacyAccess.mockResolvedValue(ACCESS);
  });

  it('hides Client history from Internal-only VIEW without Client READ', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      ...ACCESS,
      viewScope: 'OWN',
      editScope: 'OWN',
      clientReadScope: 'NONE',
      clientSendScope: 'NONE',
    });
    const { service, prisma } = createService();
    prisma.messengerConversation.findUnique.mockResolvedValue({
      id: 'forged-client',
      zone: 'CLIENT',
      type: 'EXTERNAL',
      title: 'Secret',
      status: 'ACTIVE',
      canonicalKey: null,
      createdAt: new Date(),
      lastMessageAt: null,
    });
    await expect(service.getConversation('forged-client', 'e1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects READ without SEND on persist with a distinct error from disabled send', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      ...ACCESS,
      clientReadScope: 'ALL',
      clientSendScope: 'NONE',
    });
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
        content: 'should not send',
      }),
    ).rejects.toThrow(MESSENGER_CORE_CLIENT_SEND_FORBIDDEN);
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });

  it('does not treat ConversationLink or Product membership queries as ACL', async () => {
    const { service, prisma } = createService();
    await service.getConversation('conv-1', 'e1');
    expect(prisma.messengerConversationParticipant.findFirst).toHaveBeenCalled();
    expect(prisma.resourceAccessGrant.findFirst).toHaveBeenCalled();
    expect(prisma.messengerConversationLink.create).not.toHaveBeenCalled();
    expect(prisma).not.toHaveProperty('productTeamMember');
  });

  it('audits Client participant grant without message bodies', async () => {
    const { service, prisma, audit } = createService();
    prisma.messengerConversation.findUnique.mockResolvedValue(clientConversation());
    prisma.messengerConversationParticipant.findFirst.mockResolvedValue({ role: 'MEMBER' });
    prisma.messengerConversationParticipant.upsert.mockResolvedValue({
      employeeId: 'e2',
      role: 'READ_ONLY',
      leftAt: null,
    });
    await service.inviteParticipant('conv-c', 'e1', 'e2', 'READ_ONLY');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'messenger_conversation',
        entityId: 'conv-c',
        action: 'messenger.conversation.participant.granted',
        userId: 'e1',
        changes: { employeeId: 'e2', role: 'READ_ONLY' },
      }),
    );
  });

  it('forbids Client write when CLIENT_READ ALL is the only conversation fact', async () => {
    loadMessengerLegacyAccess.mockResolvedValue(CLIENT_READ_ALL_EDIT_OWN);
    const { service, prisma, audit } = createService();
    prisma.messengerConversation.findUnique.mockResolvedValue(clientConversation());
    const writeLink = {
      entityType: 'PRODUCT' as const,
      entityId: 'prod-1',
      relationType: 'PRIMARY' as const,
    };
    await expect(service.inviteParticipant('conv-c', 'e1', 'e2', 'READ_ONLY')).rejects.toThrow(
      MESSENGER_CORE_CLIENT_WRITE_FORBIDDEN,
    );
    await expect(service.addLink('conv-c', 'e1', writeLink)).rejects.toThrow(
      MESSENGER_CORE_CLIENT_WRITE_FORBIDDEN,
    );
    await expect(service.grantAccessOverride('conv-c', 'e1', 'e2', 'VIEW')).rejects.toThrow(
      MESSENGER_CORE_CLIENT_WRITE_FORBIDDEN,
    );
    expect(prisma.messengerConversationParticipant.upsert).not.toHaveBeenCalled();
    expect(prisma.messengerConversationLink.create).not.toHaveBeenCalled();
    expect(prisma.resourceAccessGrant.upsert).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('cannot persist Client with grant EDIT and no SEND', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      ...ACCESS,
      clientReadScope: 'ALL',
      clientSendScope: 'NONE',
    });
    const { service, prisma, gateway } = createService();
    prisma.messengerConversation.findUnique.mockResolvedValue(clientConversation());
    prisma.resourceAccessGrant.findFirst.mockResolvedValue({ level: 'EDIT' });
    await expect(
      service.persistAndBroadcast({
        conversationId: 'conv-c',
        senderId: 'e1',
        content: 'should not send',
      }),
    ).rejects.toThrow(MESSENGER_CORE_CLIENT_SEND_FORBIDDEN);
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });

  it('still disables Client persist after canSend is true', async () => {
    const { service, prisma, gateway } = createService();
    prisma.messengerConversation.findUnique.mockResolvedValue(clientConversation());
    prisma.messengerConversationParticipant.findFirst.mockResolvedValue({ role: 'MEMBER' });
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

  it('returns 404 and does not create a reference from a Client source without Client READ', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      ...ACCESS,
      viewScope: 'OWN',
      editScope: 'OWN',
      clientReadScope: 'NONE',
      clientSendScope: 'NONE',
    });
    const { service, prisma } = createService();
    prisma.messengerMessage.findUnique.mockResolvedValue({
      id: 'src-c',
      conversationId: 'conv-c',
    });
    prisma.messengerConversation.findUnique.mockResolvedValue(clientConversation());
    await expect(
      service.addReference('e1', {
        sourceMessageId: 'src-c',
        targetEntityType: 'TASK',
        targetEntityId: 'task-1',
        purpose: 'TASK_SOURCE',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.messengerMessageReference.create).not.toHaveBeenCalled();
  });

  it('allows an Internal source member to create a reference', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      ...ACCESS,
      viewScope: 'OWN',
      editScope: 'OWN',
      clientReadScope: 'NONE',
      clientSendScope: 'NONE',
    });
    const { service, prisma } = createService();
    prisma.messengerConversationParticipant.findFirst.mockResolvedValue({ role: 'MEMBER' });
    prisma.messengerMessage.findUnique.mockResolvedValue({
      id: 'src-1',
      conversationId: 'conv-1',
    });
    prisma.messengerMessageReference.create.mockResolvedValue({
      id: 'ref-1',
      sourceMessageId: 'src-1',
    });
    const created = await service.addReference('e1', {
      sourceMessageId: 'src-1',
      targetEntityType: 'TASK',
      targetEntityId: 'task-1',
      purpose: 'TASK_SOURCE',
    });
    expect(created.sourceMessageId).toBe('src-1');
    expect(prisma.messengerMessageReference.create).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when a holder message is in a Client conversation the actor cannot read', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      ...ACCESS,
      viewScope: 'OWN',
      editScope: 'OWN',
      clientReadScope: 'NONE',
      clientSendScope: 'NONE',
    });
    const { service, prisma } = createService();
    prisma.messengerConversationParticipant.findFirst.mockImplementation(
      async (args: { where: { conversationId: string } }) => {
        if (args.where.conversationId === 'conv-1') return { role: 'MEMBER' };
        return null;
      },
    );
    prisma.messengerMessage.findUnique.mockImplementation(
      async (args: { where: { id: string } }) => {
        if (args.where.id === 'src-1') return { id: 'src-1', conversationId: 'conv-1' };
        if (args.where.id === 'hold-c') return { id: 'hold-c', conversationId: 'conv-c' };
        return null;
      },
    );
    prisma.messengerConversation.findUnique.mockImplementation(
      async (args: { where: { id: string } }) => {
        if (args.where.id === 'conv-c') return clientConversation();
        return {
          id: 'conv-1',
          zone: 'INTERNAL',
          type: 'INTERNAL_GROUP',
          title: 'Dev',
          status: 'ACTIVE',
          canonicalKey: null,
          createdAt: new Date(),
          lastMessageAt: null,
        };
      },
    );
    await expect(
      service.addReference('e1', {
        sourceMessageId: 'src-1',
        targetMessageId: 'hold-c',
        purpose: 'FORWARD',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.messengerMessageReference.create).not.toHaveBeenCalled();
  });
});
