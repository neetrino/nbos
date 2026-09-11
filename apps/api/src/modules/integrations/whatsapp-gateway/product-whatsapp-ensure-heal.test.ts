import { describe, expect, it, vi } from 'vitest';
import { ProductWhatsAppGroupService } from './product-whatsapp-group.service';
import { resolveClientDestination } from '../../messenger/core/product-communication-resolver';
import { loadProductWhatsAppState } from './product-whatsapp-communication-view.ops';
import {
  createSlice9RuntimeStore,
  SLICE9_ACCOUNTANT,
  SLICE9_GROUP_1,
} from './product-whatsapp-runtime.store';

function createService(prisma: object) {
  const createGroup = vi.fn();
  const enqueueOperation = vi.fn().mockResolvedValue(true);
  const service = new ProductWhatsAppGroupService(
    prisma as never,
    { enqueueOperation } as never,
    {
      requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'http://gw', apiToken: 't' }),
    } as never,
    {
      getGroup: vi.fn().mockResolvedValue({ id: SLICE9_GROUP_1, name: 'Work' }),
      createGroup,
    } as never,
    { resolveTechnicalSpecialist: vi.fn() } as never,
    { log: vi.fn().mockResolvedValue({ id: 'audit' }) } as never,
  );
  return { service, createGroup, enqueueOperation };
}

describe('FINDING-S9-01 ensure heals unique-legacy WORK', () => {
  it('unique-ACTIVE + normal JID + empty bindings → canonical WORK, no Gateway create', async () => {
    const store = createSlice9RuntimeStore();
    store.seedLegacyActive('p-a', SLICE9_GROUP_1);
    const { service, createGroup, enqueueOperation } = createService(store.prisma);
    const before = await loadProductWhatsAppState(store.prisma as never, 'p-a');
    expect(before.work).toBeNull();
    expect(before.binding?.groupChatId).toBeNull();
    const state = await service.ensureGroupForProduct('p-a', { source: 'MANUAL_RETRY' });
    const work = await resolveClientDestination(store.prisma as never, 'p-a', 'WORK');
    expect(work?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(state.work?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(state.binding?.groupChatId).toBe(SLICE9_GROUP_1);
    expect(createGroup).not.toHaveBeenCalled();
    expect(enqueueOperation).not.toHaveBeenCalled();
    expect(store.operations.some((row) => row.type === 'CREATE_PRODUCT_GROUP')).toBe(false);
  });

  it('unique-ACTIVE + accountant JID does not no-op as completed WORK', async () => {
    const store = createSlice9RuntimeStore();
    store.seedLegacyActive('p-a', SLICE9_ACCOUNTANT, 'Accountant');
    const { service, enqueueOperation } = createService(store.prisma);
    const state = await service.ensureGroupForProduct('p-a', { source: 'MANUAL_RETRY' });
    const work = await resolveClientDestination(store.prisma as never, 'p-a', 'WORK');
    expect(work).toBeNull();
    expect(state.work).toBeNull();
    expect(state.binding?.groupChatId).toBeNull();
    expect(state.binding?.groupChatId).not.toBe(SLICE9_ACCOUNTANT);
    expect(enqueueOperation).toHaveBeenCalled();
    expect(store.operations.some((row) => row.type === 'CREATE_PRODUCT_GROUP')).toBe(true);
  });
});

describe('FINDING-S9-04 ensureTechnicalSpecialist does not ADD to accountant JID', () => {
  it('unique-legacy ACTIVE accountant JID, no WORK → ensure, no ADD', async () => {
    const store = createSlice9RuntimeStore();
    store.seedLegacyActive('p-a', SLICE9_ACCOUNTANT, 'Accountant');
    const enqueueOperation = vi.fn().mockResolvedValue(true);
    const service = new ProductWhatsAppGroupService(
      store.prisma as never,
      { enqueueOperation } as never,
      {
        requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'http://gw', apiToken: 't' }),
      } as never,
      { getGroup: vi.fn(), createGroup: vi.fn() } as never,
      {
        resolveTechnicalSpecialist: vi.fn().mockResolvedValue({
          employeeId: 'emp-ts',
          roles: ['TECHNICAL_SPECIALIST'],
        }),
      } as never,
      { log: vi.fn().mockResolvedValue({ id: 'audit' }) } as never,
    );
    await service.ensureTechnicalSpecialist('p-a', 'actor-1');
    const work = await resolveClientDestination(store.prisma as never, 'p-a', 'WORK');
    expect(work).toBeNull();
    expect(store.operations.some((row) => row.type === 'ADD_PRODUCT_PARTICIPANT')).toBe(false);
    expect(store.operations.some((row) => row.type === 'CREATE_PRODUCT_GROUP')).toBe(true);
    expect(enqueueOperation).toHaveBeenCalled();
  });
});
