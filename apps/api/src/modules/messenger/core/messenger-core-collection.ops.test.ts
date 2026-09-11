import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  addCoreCollectionItem,
  addCoreCollectionMember,
  createCoreCollection,
} from './messenger-core-collection.ops';
import { MESSENGER_CORE_COLLECTION_ZONE_MISMATCH } from './messenger-core.constants';

describe('messenger core collections', () => {
  it('creates a zone-scoped collection and seeds SHARED owner membership', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'col-1',
      name: 'Watch',
      visibility: 'SHARED',
      zone: 'INTERNAL',
      ownerEmployeeId: 'e1',
    });
    const prisma = { messengerConversationCollection: { create } };
    const created = await createCoreCollection(prisma as never, {
      name: 'Watch',
      visibility: 'SHARED',
      zone: 'INTERNAL',
      ownerEmployeeId: 'e1',
    });
    expect(created.zone).toBe('INTERNAL');
    expect(create.mock.calls[0]?.[0]?.data?.members).toEqual({
      create: { employeeId: 'e1' },
    });
  });

  it('rejects inserting a Client conversation into an Internal collection', async () => {
    const prisma = {
      messengerConversationCollection: {
        findUnique: vi.fn().mockResolvedValue({ zone: 'INTERNAL' }),
      },
      messengerConversation: {
        findUnique: vi.fn().mockResolvedValue({ zone: 'CLIENT' }),
      },
      messengerConversationCollectionItem: { create: vi.fn() },
    };
    await expect(addCoreCollectionItem(prisma as never, 'col-1', 'conv-c')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(addCoreCollectionItem(prisma as never, 'col-1', 'conv-c')).rejects.toThrow(
      MESSENGER_CORE_COLLECTION_ZONE_MISMATCH,
    );
    expect(prisma.messengerConversationCollectionItem.create).not.toHaveBeenCalled();
  });

  it('rejects inserting an Internal conversation into a Client collection', async () => {
    const prisma = {
      messengerConversationCollection: {
        findUnique: vi.fn().mockResolvedValue({ zone: 'CLIENT' }),
      },
      messengerConversation: {
        findUnique: vi.fn().mockResolvedValue({ zone: 'INTERNAL' }),
      },
      messengerConversationCollectionItem: { create: vi.fn() },
    };
    await expect(addCoreCollectionItem(prisma as never, 'col-c', 'conv-i')).rejects.toThrow(
      MESSENGER_CORE_COLLECTION_ZONE_MISMATCH,
    );
  });

  it('does not treat SHARED membership as conversation create', async () => {
    const prisma = {
      messengerConversationCollection: {
        findUnique: vi.fn().mockResolvedValue({ visibility: 'SHARED' }),
      },
      messengerConversationCollectionMember: {
        upsert: vi.fn().mockResolvedValue({ id: 'mem-1' }),
      },
    };
    const row = await addCoreCollectionMember(prisma as never, 'col-1', 'e2');
    expect(row.id).toBe('mem-1');
    expect(prisma.messengerConversationCollectionMember.upsert).toHaveBeenCalledTimes(1);
  });
});
