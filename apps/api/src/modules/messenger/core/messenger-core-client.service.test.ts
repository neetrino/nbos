import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreClientService } from './messenger-core-client.service';
import {
  MESSENGER_CORE_CLIENT_ATTENTION_FORBIDDEN,
  MESSENGER_CORE_CLIENT_INTERNAL_ZONE_FORBIDDEN,
} from './messenger-core.constants';

const loadMessengerLegacyAccess = vi.fn();
const mapAllMetaSalesToCore = vi.fn();
const listAccessibleClientConversations = vi.fn();
const listCoreConversationMessages = vi.fn();
const toggleClientFavorite = vi.fn();
const loadMessengerCoreAccessFacts = vi.fn();
const assignConversationAttention = vi.fn();

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: (...args: unknown[]) => loadMessengerLegacyAccess(...args),
}));

vi.mock('./messenger-meta-mapper.ops', () => ({
  mapAllMetaSalesToCore: (...args: unknown[]) => mapAllMetaSalesToCore(...args),
}));

vi.mock('./messenger-core-client-list.ops', () => ({
  listAccessibleClientConversations: (...args: unknown[]) =>
    listAccessibleClientConversations(...args),
}));

vi.mock('./messenger-core-internal-messages.ops', () => ({
  listCoreConversationMessages: (...args: unknown[]) => listCoreConversationMessages(...args),
}));

vi.mock('./messenger-core-favorites.ops', () => ({
  toggleClientFavorite: (...args: unknown[]) => toggleClientFavorite(...args),
}));

vi.mock('./messenger-core-access-load', () => ({
  loadMessengerCoreAccessFacts: (...args: unknown[]) => loadMessengerCoreAccessFacts(...args),
}));

vi.mock('./messenger-core-link.ops', () => ({
  listCoreConversationLinks: vi.fn(async () => []),
}));

vi.mock('./messenger-core-attention.ops', () => ({
  listConversationAttentions: vi.fn(async () => []),
}));

vi.mock('./messenger-core-attention-assign.ops', () => ({
  assignConversationAttention: (...args: unknown[]) => assignConversationAttention(...args),
}));

const ACCESS = {
  employeeId: 'e1',
  departmentIds: [],
  viewScope: 'ALL',
  editScope: 'NONE',
  clientReadScope: 'ALL',
  clientSendScope: 'ALL',
  driveViewScope: 'ALL',
};

function createService() {
  const prisma = {
    messengerExternalConversationMapping: { findFirst: vi.fn().mockResolvedValue(null) },
    messengerConversationLink: { findMany: vi.fn().mockResolvedValue([]) },
    messengerChannelMessage: { create: vi.fn() },
    metaMessage: { create: vi.fn() },
  };
  const core = {
    getConversation: vi.fn(),
    persistAndBroadcast: vi.fn(),
    markRead: vi.fn(),
    inviteParticipant: vi.fn(),
  };
  const service = new MessengerCoreClientService(prisma as never, core as never);
  return { service, prisma, core };
}

describe('MessengerCoreClientService', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset().mockResolvedValue(ACCESS);
    mapAllMetaSalesToCore.mockReset().mockResolvedValue({
      conversationsSeen: 0,
      conversationsMapped: 0,
      conversationsReused: 0,
      messagesSeen: 0,
      messagesMapped: 0,
      messagesSkippedExisting: 0,
    });
    listAccessibleClientConversations.mockReset().mockResolvedValue({ items: [] });
    listCoreConversationMessages.mockReset();
    toggleClientFavorite.mockReset();
    loadMessengerCoreAccessFacts.mockReset().mockResolvedValue({
      access: ACCESS,
      facts: {
        conversationId: 'c1',
        zone: 'CLIENT',
        viewScope: 'ALL',
        editScope: 'NONE',
        clientReadScope: 'ALL',
        clientSendScope: 'ALL',
        isActiveParticipant: true,
        participantRole: 'MEMBER',
        grantLevel: null,
      },
    });
    assignConversationAttention.mockReset().mockResolvedValue([]);
  });

  it('rejects opening an Internal conversation on Client routes', async () => {
    const { service, core } = createService();
    core.getConversation.mockResolvedValue({ id: 'i1', zone: 'INTERNAL' });
    await expect(service.getConversation('i1', 'e1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getConversation('i1', 'e1')).rejects.toThrow(
      MESSENGER_CORE_CLIENT_INTERNAL_ZONE_FORBIDDEN,
    );
  });

  it('does not map Meta when listing Client conversations', async () => {
    const { service } = createService();
    await service.listConversations('e1', { section: 'inbox' });
    expect(mapAllMetaSalesToCore).not.toHaveBeenCalled();
    expect(listAccessibleClientConversations).toHaveBeenCalled();
  });

  it('persists through persistAndBroadcast arity 1 with senderId', async () => {
    const { service, core, prisma } = createService();
    core.getConversation.mockResolvedValue({ id: 'c1', zone: 'CLIENT' });
    core.persistAndBroadcast.mockResolvedValue({ id: 'm1', conversationId: 'c1' });
    const message = await service.persistMessage({
      conversationId: 'c1',
      senderId: 'e1',
      content: 'hello client',
    });
    expect(message.id).toBe('m1');
    expect(core.persistAndBroadcast).toHaveBeenCalledTimes(1);
    expect(core.persistAndBroadcast.mock.calls[0]?.length).toBe(1);
    expect(prisma.messengerChannelMessage.create).not.toHaveBeenCalled();
    expect(prisma.metaMessage.create).not.toHaveBeenCalled();
  });

  it('invites specialists as READ_ONLY only', async () => {
    const { service, core } = createService();
    core.getConversation.mockResolvedValue({ id: 'c1', zone: 'CLIENT' });
    core.inviteParticipant.mockResolvedValue({ employeeId: 'e2', role: 'READ_ONLY' });
    await service.inviteReadOnly('c1', 'e1', 'e2');
    expect(core.inviteParticipant).toHaveBeenCalledWith('c1', 'e1', 'e2', 'READ_ONLY');
  });

  it('forbids READ_ONLY clients from reassigning attention', async () => {
    const { service, core } = createService();
    core.getConversation.mockResolvedValue({ id: 'c1', zone: 'CLIENT' });
    loadMessengerCoreAccessFacts.mockResolvedValue({
      access: ACCESS,
      facts: {
        conversationId: 'c1',
        zone: 'CLIENT',
        viewScope: 'ALL',
        editScope: 'NONE',
        clientReadScope: 'ALL',
        clientSendScope: 'ALL',
        isActiveParticipant: true,
        participantRole: 'READ_ONLY',
        grantLevel: null,
      },
    });
    await expect(
      service.assignAttention('c1', 'e1', {
        productId: 'p1',
        purpose: 'WORK',
        ownerKind: 'ROLE',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.assignAttention('c1', 'e1', {
        productId: 'p1',
        purpose: 'WORK',
        ownerKind: 'ROLE',
      }),
    ).rejects.toThrow(MESSENGER_CORE_CLIENT_ATTENTION_FORBIDDEN);
    expect(assignConversationAttention).not.toHaveBeenCalled();
  });

  it('allows Client send members to reassign attention', async () => {
    const { service, core } = createService();
    core.getConversation.mockResolvedValue({ id: 'c1', zone: 'CLIENT' });
    await service.assignAttention('c1', 'e1', {
      productId: 'p1',
      purpose: 'WORK',
      ownerKind: 'ROLE',
    });
    expect(assignConversationAttention).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ conversationId: 'c1', assignedById: 'e1', ownerKind: 'ROLE' }),
    );
  });
});
