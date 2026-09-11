import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreCollectionService } from './messenger-core-collection.service';

const loadMessengerLegacyAccess = vi.fn();
const loadMessengerCoreAccessFacts = vi.fn();
const addCoreCollectionMember = vi.fn();
const addCoreCollectionItem = vi.fn();
const isCoreCollectionMember = vi.fn();
const listCollectionItemIds = vi.fn();
const listAccessibleInternalConversationsByIds = vi.fn();

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: (...args: unknown[]) => loadMessengerLegacyAccess(...args),
}));

vi.mock('./messenger-core-access-load', () => ({
  loadMessengerCoreAccessFacts: (...args: unknown[]) => loadMessengerCoreAccessFacts(...args),
}));

vi.mock('./messenger-core-collection.ops', () => ({
  addCoreCollectionMember: (...args: unknown[]) => addCoreCollectionMember(...args),
  addCoreCollectionItem: (...args: unknown[]) => addCoreCollectionItem(...args),
  isCoreCollectionMember: (...args: unknown[]) => isCoreCollectionMember(...args),
  createCoreCollection: vi.fn(),
}));

vi.mock('./messenger-core-collection-list.ops', () => ({
  listCollectionItemIds: (...args: unknown[]) => listCollectionItemIds(...args),
  listInternalCollections: vi.fn(),
  listClientCollections: vi.fn(),
  removeCoreCollectionItem: vi.fn(),
}));

vi.mock('./messenger-core-internal-list.ops', () => ({
  listAccessibleInternalConversationsByIds: (...args: unknown[]) =>
    listAccessibleInternalConversationsByIds(...args),
}));

vi.mock('./messenger-core-client-list.ops', () => ({
  listAccessibleClientConversationsByIds: vi.fn(),
}));

const ACCESS = {
  employeeId: 'e1',
  departmentIds: [],
  viewScope: 'ALL',
  editScope: 'ALL',
  clientReadScope: 'NONE',
  clientSendScope: 'NONE',
};

function createService(zone: 'INTERNAL' | 'CLIENT') {
  const prisma = {
    messengerConversationCollection: {
      findUnique: vi.fn().mockResolvedValue({ zone }),
    },
  };
  return { service: new MessengerCoreCollectionService(prisma as never), prisma };
}

describe('Internal collection zone mutate', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset().mockResolvedValue(ACCESS);
    isCoreCollectionMember.mockReset().mockResolvedValue(true);
    addCoreCollectionMember.mockReset().mockResolvedValue({ id: 'mem-1' });
    addCoreCollectionItem.mockReset().mockResolvedValue({ id: 'item-1' });
    loadMessengerCoreAccessFacts.mockReset();
  });

  it('404s Internal member and item POST against a Client collection', async () => {
    const { service } = createService('CLIENT');
    await expect(service.addInternalMember('col-c', 'e1', 'e2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.addInternalItem('col-c', 'e1', 'conv-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(addCoreCollectionMember).not.toHaveBeenCalled();
    expect(addCoreCollectionItem).not.toHaveBeenCalled();
  });

  it('allows Internal member and item POST on an Internal collection', async () => {
    const { service } = createService('INTERNAL');
    loadMessengerCoreAccessFacts.mockResolvedValue({
      access: ACCESS,
      facts: {
        conversationId: 'conv-1',
        zone: 'INTERNAL',
        viewScope: 'ALL',
        editScope: 'ALL',
        clientReadScope: 'NONE',
        clientSendScope: 'NONE',
        isActiveParticipant: true,
        participantRole: 'MEMBER',
        grantLevel: null,
      },
    });
    await expect(service.addInternalMember('col-i', 'e1', 'e2')).resolves.toEqual({ id: 'mem-1' });
    await expect(service.addInternalItem('col-i', 'e1', 'conv-1')).resolves.toEqual({
      id: 'item-1',
    });
  });

  it('404s Client member and item POST against an Internal collection', async () => {
    const { service } = createService('INTERNAL');
    await expect(service.addClientMember('col-i', 'e1', 'e2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.addClientItem('col-i', 'e1', 'conv-c')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(addCoreCollectionMember).not.toHaveBeenCalled();
    expect(addCoreCollectionItem).not.toHaveBeenCalled();
  });

  it('404s adding a Client conversation to an Internal collection', async () => {
    const { service } = createService('INTERNAL');
    loadMessengerCoreAccessFacts.mockResolvedValue({
      access: ACCESS,
      facts: {
        conversationId: 'conv-c',
        zone: 'CLIENT',
        viewScope: 'ALL',
        editScope: 'ALL',
        clientReadScope: 'ALL',
        clientSendScope: 'ALL',
        isActiveParticipant: true,
        participantRole: 'MEMBER',
        grantLevel: null,
      },
    });
    await expect(service.addInternalItem('col-i', 'e1', 'conv-c')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(addCoreCollectionItem).not.toHaveBeenCalled();
  });

  it('404s adding an Internal conversation to a Client collection', async () => {
    const { service } = createService('CLIENT');
    loadMessengerCoreAccessFacts.mockResolvedValue({
      access: ACCESS,
      facts: {
        conversationId: 'conv-i',
        zone: 'INTERNAL',
        viewScope: 'ALL',
        editScope: 'ALL',
        clientReadScope: 'NONE',
        clientSendScope: 'NONE',
        isActiveParticipant: true,
        participantRole: 'MEMBER',
        grantLevel: null,
      },
    });
    await expect(service.addClientItem('col-c', 'e1', 'conv-i')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(addCoreCollectionItem).not.toHaveBeenCalled();
  });
});

describe('Internal collection detail ACL and query shape', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset().mockResolvedValue(ACCESS);
    isCoreCollectionMember.mockReset().mockResolvedValue(true);
    loadMessengerCoreAccessFacts.mockReset();
    listCollectionItemIds.mockReset();
    listAccessibleInternalConversationsByIds.mockReset();
  });

  it('excludes unauthorized and Task-inaccessible items while preserving stored order', async () => {
    const itemIds = Array.from({ length: 40 }, (_, index) => `c${index}`);
    listCollectionItemIds.mockResolvedValue(itemIds);
    listAccessibleInternalConversationsByIds.mockImplementation(
      async (_prisma: unknown, _employeeId: string, _scope: string, ids: string[]) =>
        ids.filter((id) => id !== 'c3' && id !== 'c10').map((id) => ({ id })),
    );
    const prisma = {
      messengerConversationCollection: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'col-1',
          name: 'Watch',
          visibility: 'SHARED',
          zone: 'INTERNAL',
          ownerEmployeeId: 'e1',
        }),
        create: vi.fn(),
        update: vi.fn(),
      },
      messengerConversationCollectionItem: { createMany: vi.fn(), upsert: vi.fn() },
    };
    const service = new MessengerCoreCollectionService(prisma as never);
    const result = await service.getInternal('col-1', 'e1', {
      employeeId: 'e1',
      departmentIds: [],
      viewScope: 'OWN',
    });
    expect(listCollectionItemIds).toHaveBeenCalledTimes(1);
    expect(listAccessibleInternalConversationsByIds).toHaveBeenCalledTimes(1);
    expect(listAccessibleInternalConversationsByIds.mock.calls[0]?.[3]).toEqual(itemIds);
    expect(loadMessengerCoreAccessFacts).not.toHaveBeenCalled();
    expect(prisma.messengerConversationCollectionItem.createMany).not.toHaveBeenCalled();
    expect(prisma.messengerConversationCollectionItem.upsert).not.toHaveBeenCalled();
    expect(result.items.map((item: { conversationId: string }) => item.conversationId)).toEqual(
      result.conversations.map((row: { id: string }) => row.id),
    );
    expect(
      result.items.map((item: { conversationId: string }) => item.conversationId),
    ).not.toContain('c3');
    expect(result.conversations[0]?.id).toBe('c0');
    expect(result.conversations[2]?.id).toBe('c2');
    expect(result.conversations[3]?.id).toBe('c4');
  });
});
