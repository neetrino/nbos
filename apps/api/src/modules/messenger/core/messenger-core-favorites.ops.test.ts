import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { toggleInternalFavorite } from './messenger-core-favorites.ops';

vi.mock('./messenger-core-collection-list.ops', () => ({
  canReadConversation: vi.fn(async () => true),
  ensureInternalFavoritesCollection: vi.fn(async () => ({
    id: 'fav-1',
    name: 'Favorites',
    visibility: 'PERSONAL',
    zone: 'INTERNAL',
    ownerEmployeeId: 'e1',
  })),
  removeCoreCollectionItem: vi.fn(async () => undefined),
}));

vi.mock('./messenger-core-collection.ops', () => ({
  addCoreCollectionItem: vi.fn(async () => ({ id: 'item-1' })),
}));

describe('Internal Favorites toggle', () => {
  it('rejects Client conversations', async () => {
    const prisma = {
      messengerConversation: { findUnique: vi.fn().mockResolvedValue({ zone: 'CLIENT' }) },
    };
    await expect(toggleInternalFavorite(prisma as never, 'e1', 'client-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('adds then removes a PERSONAL Favorites item and mirrors the setting flag', async () => {
    const itemFind = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'item-1' });
    const settingUpsert = vi.fn();
    const prisma = {
      messengerConversation: { findUnique: vi.fn().mockResolvedValue({ zone: 'INTERNAL' }) },
      messengerConversationCollectionItem: { findUnique: itemFind },
      messengerUserConversationSetting: { upsert: settingUpsert },
    };
    const added = await toggleInternalFavorite(prisma as never, 'e1', 'conv-1');
    expect(added.favorite).toBe(true);
    const removed = await toggleInternalFavorite(prisma as never, 'e1', 'conv-1');
    expect(removed.favorite).toBe(false);
    expect(settingUpsert).toHaveBeenCalledTimes(2);
  });

  it('404s when the conversation is missing', async () => {
    const prisma = {
      messengerConversation: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    await expect(toggleInternalFavorite(prisma as never, 'e1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
