import { describe, expect, it } from 'vitest';
import { persistBoundDestination } from '../../integrations/whatsapp-gateway/product-whatsapp-bind.ops';
import { resolveClientDestination } from './product-communication-resolver';
import { dualWriteLegacyWorkBinding } from './product-communication-legacy-write.ops';
import {
  createSlice9RuntimeStore,
  SLICE9_GROUP_1,
} from '../../integrations/whatsapp-gateway/product-whatsapp-runtime.store';

describe('FINDING-S9-06 dual-write unique groupChatId', () => {
  it('create unique-constraint returns null without throwing', async () => {
    const prisma = {
      productWhatsAppGroupBinding: {
        findFirst: async () => null,
        findUnique: async () => null,
        create: async () => {
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        },
        update: async () => {
          throw new Error('detach should be a no-op when no row exists');
        },
      },
    };
    const result = await dualWriteLegacyWorkBinding(prisma as never, {
      productId: 'p-b',
      groupChatId: SLICE9_GROUP_1,
      groupName: 'Work',
    });
    expect(result).toBeNull();
  });

  it('persistBoundDestination still succeeds when dual-write create throws P2002', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-b');
    store.prisma.productWhatsAppGroupBinding.create = async () => {
      throw Object.assign(new Error('unique'), { code: 'P2002' });
    };
    const persisted = await persistBoundDestination(store.prisma as never, {
      productId: 'p-b',
      purpose: 'WORK',
      groupChatId: SLICE9_GROUP_1,
      groupName: 'Work',
      replace: true,
    });
    const work = await resolveClientDestination(store.prisma as never, 'p-b', 'WORK');
    expect(work?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(persisted.conversationId).toBeTruthy();
    expect(persisted.legacyBindingId).toBeNull();
    expect(store.getLegacy('p-b')).toBeNull();
  });

  it('does not swallow a non-unique dual-write failure', async () => {
    const prisma = {
      productWhatsAppGroupBinding: {
        findFirst: async () => null,
        findUnique: async () => null,
        create: async () => {
          throw new Error('db down');
        },
      },
    };
    await expect(
      dualWriteLegacyWorkBinding(prisma as never, {
        productId: 'p-b',
        groupChatId: SLICE9_GROUP_1,
        groupName: 'Work',
      }),
    ).rejects.toThrow('db down');
  });
});
