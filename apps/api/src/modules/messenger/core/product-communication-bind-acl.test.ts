import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProductWhatsAppGroupService } from '../../integrations/whatsapp-gateway/product-whatsapp-group.service';
import { persistBoundDestination } from '../../integrations/whatsapp-gateway/product-whatsapp-bind.ops';
import {
  createSlice9RuntimeStore,
  SLICE9_ACCOUNTANT,
  SLICE9_GROUP_1,
  SLICE9_GROUP_2,
} from '../../integrations/whatsapp-gateway/product-whatsapp-runtime.store';
import { loadMessengerCoreAccessFacts } from './messenger-core-access-load';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import { resolveClientDestination } from './product-communication-resolver';
import { PRODUCT_COMMUNICATION_ACCOUNTANT_FORBIDDEN } from './product-communication.constants';

function createService(prisma: object) {
  const enqueueOperation = vi.fn().mockResolvedValue(true);
  const service = new ProductWhatsAppGroupService(
    prisma as never,
    { enqueueOperation } as never,
    {
      requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'http://gw', apiToken: 't' }),
    } as never,
    {
      getGroup: vi.fn().mockImplementation(async (_config: unknown, groupChatId: string) => ({
        id: groupChatId,
        name: 'Group',
      })),
      createGroup: vi.fn(),
    } as never,
    { resolveTechnicalSpecialist: vi.fn() } as never,
    { log: vi.fn().mockResolvedValue({ id: 'audit' }) } as never,
  );
  return { service, enqueueOperation };
}

describe('FINDING-S9-03 production-path binding negatives', () => {
  it('bind B to A’s group does not write conversation participants', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    store.seedProduct('p-b');
    await persistBoundDestination(store.prisma as never, {
      productId: 'p-a',
      purpose: 'WORK',
      groupChatId: SLICE9_GROUP_1,
      groupName: 'Work',
      replace: true,
    });
    await persistBoundDestination(store.prisma as never, {
      productId: 'p-b',
      purpose: 'WORK',
      groupChatId: SLICE9_GROUP_1,
      groupName: 'Work',
      replace: true,
    });
    expect(store.participantCreates).toHaveLength(0);
    const a = await resolveClientDestination(store.prisma as never, 'p-a', 'WORK');
    const b = await resolveClientDestination(store.prisma as never, 'p-b', 'WORK');
    expect(a?.conversationId).toBe(b?.conversationId);
  });

  it('access loader denies B’s developer (Client GET 404 path)', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    store.seedProduct('p-b');
    await persistBoundDestination(store.prisma as never, {
      productId: 'p-a',
      purpose: 'WORK',
      groupChatId: SLICE9_GROUP_1,
      groupName: 'Work',
      replace: true,
    });
    await persistBoundDestination(store.prisma as never, {
      productId: 'p-b',
      purpose: 'WORK',
      groupChatId: SLICE9_GROUP_1,
      groupName: 'Work',
      replace: true,
    });
    const dest = await resolveClientDestination(store.prisma as never, 'p-b', 'WORK');
    const loaded = await loadMessengerCoreAccessFacts(
      store.prisma as never,
      'dev-b',
      dest!.conversationId,
    );
    expect(loaded.facts).toBeTruthy();
    expect(loaded.facts?.isActiveParticipant).toBe(false);
    expect(evaluateMessengerCoreAccess(loaded.facts!).canRead).toBe(false);
  });

  it('bind existing does not enqueue SEND_CLIENT_INVITE', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    const { service } = createService(store.prisma);
    await service.bindExistingGroup('p-a', SLICE9_GROUP_1, 'actor-1');
    expect(store.operations.some((row) => row.type === 'SEND_CLIENT_INVITE')).toBe(false);
  });

  it('accountant JID → 409', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    const { service } = createService(store.prisma);
    await expect(
      service.bindExistingGroup('p-a', SLICE9_ACCOUNTANT, 'actor-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.bindExistingGroup('p-a', SLICE9_ACCOUNTANT, 'actor-1'),
    ).rejects.toMatchObject({ message: PRODUCT_COMMUNICATION_ACCOUNTANT_FORBIDDEN });
  });

  it('second WORK different chat without replace → 409', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    const { service } = createService(store.prisma);
    await service.bindExistingGroup('p-a', SLICE9_GROUP_1, 'actor-1');
    await expect(
      service.bindExistingGroup('p-a', SLICE9_GROUP_2, 'actor-1', { replace: false }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
