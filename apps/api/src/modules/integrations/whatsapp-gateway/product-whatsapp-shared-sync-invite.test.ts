import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ProductWhatsAppGroupService } from './product-whatsapp-group.service';
import { overlayProductWorkWhatsAppList } from '../../projects/product-whatsapp-list-overlay';
import { loadProductWhatsAppState } from './product-whatsapp-communication-view.ops';
import { resolveClientDestination } from '../../messenger/core/product-communication-resolver';
import {
  createSlice9RuntimeStore,
  SLICE9_ACCOUNTANT,
  SLICE9_GROUP_1,
  SLICE9_GROUP_2,
} from './product-whatsapp-runtime.store';

function createService(prisma: object) {
  const enqueueOperation = vi.fn().mockResolvedValue(true);
  const service = new ProductWhatsAppGroupService(
    prisma as never,
    { enqueueOperation } as never,
    {
      requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'http://gw', apiToken: 't' }),
    } as never,
    {
      getGroup: vi.fn().mockResolvedValue({ id: SLICE9_GROUP_1, name: 'Work' }),
      createGroup: vi.fn(),
    } as never,
    { resolveTechnicalSpecialist: vi.fn() } as never,
    { log: vi.fn().mockResolvedValue({ id: 'audit' }) } as never,
  );
  return { service, enqueueOperation };
}

describe('FINDING-S9-02 shared Product without unique-legacy', () => {
  it('does not forge a legacy binding id and shows resolver WORK chat', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    store.seedProduct('p-b');
    const { service } = createService(store.prisma);
    await service.bindExistingGroup('p-a', SLICE9_GROUP_1, 'actor-1');
    await service.bindExistingGroup('p-b', SLICE9_GROUP_1, 'actor-1');
    const stateB = await loadProductWhatsAppState(store.prisma as never, 'p-b');
    expect(stateB.work?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(stateB.work?.conversationId).toBeTruthy();
    expect(stateB.binding?.id).toBeNull();
    expect(stateB.binding?.id).not.toBe(stateB.work?.conversationId);
    expect(stateB.binding?.groupChatId).toBe(SLICE9_GROUP_1);
  });

  it('POST sync / POST client-invite do not FK-fail or send a second invite', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    store.seedProduct('p-b');
    const { service, enqueueOperation } = createService(store.prisma);
    await service.bindExistingGroup('p-a', SLICE9_GROUP_1, 'actor-1');
    enqueueOperation.mockClear();
    store.operations.length = 0;
    await service.bindExistingGroup('p-b', SLICE9_GROUP_1, 'actor-1');
    const syncState = await service.syncParticipants('p-b', 'actor-1');
    const inviteState = await service.queueClientInvitation('p-b', 'actor-1');
    expect(syncState.work?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(inviteState.work?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(store.operations.some((row) => row.type === 'SYNC_PRODUCT_PARTICIPANTS')).toBe(false);
    expect(store.operations.some((row) => row.type === 'SEND_CLIENT_INVITE')).toBe(false);
    expect(store.operations.every((row) => row.bindingId !== syncState.work?.conversationId)).toBe(
      true,
    );
  });

  it('Project list overlay uses resolver WORK groupChatId, not unique-legacy alone', () => {
    const overlay = overlayProductWorkWhatsAppList(
      {
        whatsappGroupBinding: null,
        communicationBindings: [
          {
            conversation: {
              externalMappings: [{ externalConversationId: SLICE9_GROUP_1 }],
            },
          },
        ],
      },
      SLICE9_ACCOUNTANT,
    );
    expect(overlay.whatsappGroupBinding?.status).toBe('ACTIVE');
    expect(overlay.whatsappGroupBinding?.groupChatId).toBe(SLICE9_GROUP_1);
    expect('communicationBindings' in overlay).toBe(false);
  });
});

describe('FINDING-S9-04 list overlay does not show accountant unique-legacy', () => {
  it('unique-legacy accountant JID with no WORK is not the Product group', () => {
    const overlay = overlayProductWorkWhatsAppList(
      {
        whatsappGroupBinding: { status: 'ACTIVE', groupChatId: SLICE9_ACCOUNTANT },
        communicationBindings: [],
      },
      SLICE9_ACCOUNTANT,
    );
    expect(overlay.whatsappGroupBinding?.groupChatId).toBeNull();
    expect(overlay.whatsappGroupBinding?.groupChatId).not.toBe(SLICE9_ACCOUNTANT);
  });

  it('invite/sync do not target accountant unique-legacy', async () => {
    const store = createSlice9RuntimeStore();
    store.seedLegacyActive('p-a', SLICE9_ACCOUNTANT, 'Accountant');
    const { service } = createService(store.prisma);
    await service.syncParticipants('p-a', 'actor-1');
    expect(store.operations.some((row) => row.type === 'SYNC_PRODUCT_PARTICIPANTS')).toBe(false);
    expect(store.operations.some((row) => row.type === 'SEND_CLIENT_INVITE')).toBe(false);
    await expect(service.queueClientInvitation('p-a', 'actor-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(store.operations.some((row) => row.type === 'SEND_CLIENT_INVITE')).toBe(false);
  });
});

describe('FINDING-S9-05 replace-to-shared detaches stale unique-legacy', () => {
  it('Product B unique-legacy GroupB then bind to A Group1 does not invite/sync GroupB', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    store.seedLegacyActive('p-b', SLICE9_GROUP_2);
    const { service, enqueueOperation } = createService(store.prisma);
    await service.bindExistingGroup('p-a', SLICE9_GROUP_1, 'actor-1');
    await service.bindExistingGroup('p-b', SLICE9_GROUP_1, 'actor-1');
    const workB = await resolveClientDestination(store.prisma as never, 'p-b', 'WORK');
    const legacyB = store.getLegacy('p-b');
    expect(workB?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(legacyB?.groupChatId).not.toBe(SLICE9_GROUP_2);
    expect(legacyB?.status === 'ACTIVE' && legacyB?.groupChatId === SLICE9_GROUP_2).toBe(false);
    enqueueOperation.mockClear();
    store.operations.length = 0;
    await service.syncParticipants('p-b', 'actor-1');
    await service.queueClientInvitation('p-b', 'actor-1');
    expect(store.operations.some((row) => row.type === 'SYNC_PRODUCT_PARTICIPANTS')).toBe(false);
    expect(store.operations.some((row) => row.type === 'SEND_CLIENT_INVITE')).toBe(false);
    expect(store.operations.every((row) => row.bindingId !== workB?.conversationId)).toBe(true);
  });
});

describe('FINDING-S9-09 getState after S9-05 detach is not FAILED leftover', () => {
  it('settings getState is ACTIVE Group1, not FAILED + old unique-legacy name', async () => {
    const store = createSlice9RuntimeStore();
    store.seedProduct('p-a');
    store.seedLegacyActive('p-b', SLICE9_GROUP_2, 'GroupB');
    const { service } = createService(store.prisma);
    await service.bindExistingGroup('p-a', SLICE9_GROUP_1, 'actor-1');
    await service.bindExistingGroup('p-b', SLICE9_GROUP_1, 'actor-1');
    const stateB = await loadProductWhatsAppState(store.prisma as never, 'p-b');
    expect(stateB.work?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(stateB.binding?.status).toBe('ACTIVE');
    expect(stateB.binding?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(stateB.binding?.groupName).not.toBe('GroupB');
    expect(stateB.binding?.status).not.toBe('FAILED');
  });
});

describe('FINDING-S9-10 overlay does not present accountant mapping as WORK', () => {
  it('communicationBindings mapping = accountant JID → groupChatId null', () => {
    const overlay = overlayProductWorkWhatsAppList(
      {
        whatsappGroupBinding: { status: 'ACTIVE', groupChatId: SLICE9_GROUP_1 },
        communicationBindings: [
          {
            conversation: {
              externalMappings: [{ externalConversationId: SLICE9_ACCOUNTANT }],
            },
          },
        ],
      },
      SLICE9_ACCOUNTANT,
    );
    expect(overlay.whatsappGroupBinding?.groupChatId).toBeNull();
    expect(overlay.whatsappGroupBinding?.groupChatId).not.toBe(SLICE9_ACCOUNTANT);
  });
});
