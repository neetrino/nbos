import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreCollectionService } from './messenger-core-collection.service';

const loadMessengerLegacyAccess = vi.fn();
const loadMessengerCoreAccessFacts = vi.fn();
const addCoreCollectionMember = vi.fn();
const addCoreCollectionItem = vi.fn();
const isCoreCollectionMember = vi.fn();

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
});
