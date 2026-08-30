import { describe, expect, it, vi } from 'vitest';
import {
  ensureInternalFavoritesCollection,
  listAclFilteredCollectionItems,
} from './messenger-core-collection-list.ops';

const canReadConversation = vi.fn();

vi.mock('./messenger-core-access-load', () => ({
  loadMessengerCoreAccessFacts: vi.fn(
    async (_prisma: unknown, employeeId: string, conversationId: string) => ({
      access: { viewScope: 'OWN' },
      facts: { conversationId, zone: 'INTERNAL', employeeId },
    }),
  ),
}));

vi.mock('./messenger-core-access', () => ({
  evaluateMessengerCoreAccess: vi.fn((facts: { conversationId: string }) => ({
    canRead: canReadConversation(facts.conversationId) === true,
    canWrite: false,
    canSend: false,
    sendDeniedBecause: 'NO_SEND',
  })),
}));

describe('Internal collection list semantics', () => {
  it('ensures a built-in PERSONAL Favorites collection and seeds from settings', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'fav-1',
      name: 'Favorites',
      visibility: 'PERSONAL',
      zone: 'INTERNAL',
      ownerEmployeeId: 'e1',
    });
    const prisma = {
      messengerConversationCollection: { findFirst: vi.fn().mockResolvedValue(null), create },
      messengerUserConversationSetting: {
        findMany: vi.fn().mockResolvedValue([{ conversationId: 'conv-1' }]),
      },
      messengerConversationCollectionItem: { upsert: vi.fn() },
    };
    canReadConversation.mockImplementation((id: string) => id === 'conv-1');
    const created = await ensureInternalFavoritesCollection(prisma as never, 'e1');
    expect(created.name).toBe('Favorites');
    expect(created.visibility).toBe('PERSONAL');
    expect(prisma.messengerConversationCollectionItem.upsert).toHaveBeenCalled();
  });

  it('ACL-filters SHARED collection items so unauthorized conversations are omitted', async () => {
    const prisma = {
      messengerConversationCollectionItem: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ conversationId: 'visible' }, { conversationId: 'hidden' }]),
      },
    };
    canReadConversation.mockImplementation((id: string) => id === 'visible');
    const items = await listAclFilteredCollectionItems(prisma as never, 'col-shared', 'e2');
    expect(items).toEqual([{ conversationId: 'visible' }]);
  });
});
