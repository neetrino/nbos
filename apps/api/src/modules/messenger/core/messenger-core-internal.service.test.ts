import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreInternalService } from './messenger-core-internal.service';
import { MESSENGER_CORE_INTERNAL_CLIENT_ZONE_FORBIDDEN } from './messenger-core.constants';

const loadMessengerLegacyAccess = vi.fn();
const mapAllLegacyInternalToCore = vi.fn();
const listAccessibleInternalConversations = vi.fn();
const listCoreConversationMessages = vi.fn();
const toggleInternalFavorite = vi.fn();
const loadMessengerCoreAccessFacts = vi.fn();
const ensureProductWorkConversation = vi.fn();
const ensureWorkSpaceConversation = vi.fn();
const ensureDealConversation = vi.fn();
const ensureProjectGeneralConversation = vi.fn();

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: (...args: unknown[]) => loadMessengerLegacyAccess(...args),
}));

vi.mock('./messenger-legacy-mapper.ops', () => ({
  mapAllLegacyInternalToCore: (...args: unknown[]) => mapAllLegacyInternalToCore(...args),
}));

vi.mock('./messenger-core-internal-list.ops', () => ({
  listAccessibleInternalConversations: (...args: unknown[]) =>
    listAccessibleInternalConversations(...args),
}));

vi.mock('./messenger-core-internal-messages.ops', () => ({
  listCoreConversationMessages: (...args: unknown[]) => listCoreConversationMessages(...args),
}));

vi.mock('./messenger-core-favorites.ops', () => ({
  toggleInternalFavorite: (...args: unknown[]) => toggleInternalFavorite(...args),
}));

vi.mock('./messenger-core-access-load', () => ({
  loadMessengerCoreAccessFacts: (...args: unknown[]) => loadMessengerCoreAccessFacts(...args),
}));

vi.mock('./messenger-core-entity-ensure.ops', () => ({
  ensureProductWorkConversation: (...args: unknown[]) => ensureProductWorkConversation(...args),
  ensureWorkSpaceConversation: (...args: unknown[]) => ensureWorkSpaceConversation(...args),
  ensureDealConversation: (...args: unknown[]) => ensureDealConversation(...args),
  ensureProjectGeneralConversation: (...args: unknown[]) =>
    ensureProjectGeneralConversation(...args),
}));

const ACCESS = {
  employeeId: 'e1',
  departmentIds: [],
  viewScope: 'ALL',
  editScope: 'ALL',
  clientReadScope: 'NONE',
  clientSendScope: 'NONE',
  driveViewScope: 'ALL',
};

function createService() {
  const prisma = {
    messengerChannelMessage: { create: vi.fn() },
    messengerDirectMessage: { create: vi.fn() },
  };
  const core = {
    getConversation: vi.fn(),
    persistAndBroadcast: vi.fn(),
    markRead: vi.fn(),
    createConversation: vi.fn(),
  };
  const service = new MessengerCoreInternalService(prisma as never, core as never);
  return { service, prisma, core };
}

describe('MessengerCoreInternalService', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset().mockResolvedValue(ACCESS);
    mapAllLegacyInternalToCore.mockReset().mockResolvedValue({ channels: 0, threads: 0 });
    listAccessibleInternalConversations
      .mockReset()
      .mockResolvedValue({ items: [], mentionsAvailable: false });
    listCoreConversationMessages.mockReset();
    toggleInternalFavorite.mockReset();
    loadMessengerCoreAccessFacts.mockReset().mockResolvedValue({
      access: ACCESS,
      facts: {
        conversationId: 'g1',
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
    ensureProductWorkConversation.mockReset();
    ensureWorkSpaceConversation.mockReset();
    ensureDealConversation.mockReset();
    ensureProjectGeneralConversation.mockReset();
  });

  it('rejects opening a CLIENT conversation on Internal routes', async () => {
    const { service, core } = createService();
    core.getConversation.mockResolvedValue({ id: 'c1', zone: 'CLIENT' });
    await expect(service.getConversation('c1', 'e1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getConversation('c1', 'e1')).rejects.toThrow(
      MESSENGER_CORE_INTERNAL_CLIENT_ZONE_FORBIDDEN,
    );
  });

  it('persists Groups/Direct on Core, not Channel/DM tables', async () => {
    const { service, prisma, core } = createService();
    core.getConversation.mockResolvedValue({ id: 'g1', zone: 'INTERNAL' });
    core.persistAndBroadcast.mockResolvedValue({ id: 'm1', conversationId: 'g1' });
    const message = await service.persistMessage({
      conversationId: 'g1',
      senderId: 'e1',
      content: 'hi',
    });
    expect(message.id).toBe('m1');
    expect(core.persistAndBroadcast).toHaveBeenCalledTimes(1);
    expect(prisma.messengerChannelMessage.create).not.toHaveBeenCalled();
    expect(prisma.messengerDirectMessage.create).not.toHaveBeenCalled();
  });

  it('creates Internal Group and Direct on Core with INTERNAL zone', async () => {
    const { service, core } = createService();
    core.createConversation.mockResolvedValue({ id: 'd1', zone: 'INTERNAL', type: 'DIRECT' });
    await service.createConversation('e1', { type: 'DIRECT', peerEmployeeId: 'e2' });
    expect(core.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({ zone: 'INTERNAL', type: 'DIRECT', createdById: 'e1' }),
    );
  });

  it('does not map Channel/DM when listing Internal conversations', async () => {
    const { service } = createService();
    await service.listConversations('e1', { section: 'all' });
    expect(mapAllLegacyInternalToCore).not.toHaveBeenCalled();
    expect(listAccessibleInternalConversations).toHaveBeenCalled();
  });

  it('exposes canWrite from conversation ACL on Internal GET', async () => {
    const { service, core } = createService();
    core.getConversation.mockResolvedValue({ id: 'g1', zone: 'INTERNAL' });
    await expect(service.getConversation('g1', 'e1')).resolves.toEqual(
      expect.objectContaining({ id: 'g1', canWrite: true }),
    );
  });

  it('runs the idempotent Channel/DM mapper without writing Channel/DM messages', async () => {
    const { service, prisma } = createService();
    await expect(service.mapLegacyInternal()).resolves.toEqual({ channels: 0, threads: 0 });
    expect(mapAllLegacyInternalToCore).toHaveBeenCalledTimes(1);
    expect(prisma.messengerChannelMessage.create).not.toHaveBeenCalled();
  });

  it('entity ensure persists Core identity and does not write Channel/DM', async () => {
    const { service, prisma, core } = createService();
    ensureProductWorkConversation.mockResolvedValue({
      id: 'prod-conv',
      zone: 'INTERNAL',
      type: 'PRODUCT',
      created: true,
    });
    core.getConversation.mockResolvedValue({ id: 'prod-conv', zone: 'INTERNAL', type: 'PRODUCT' });
    const result = await service.ensureProduct('p1', 'e1');
    expect(result.id).toBe('prod-conv');
    expect(ensureProductWorkConversation).toHaveBeenCalled();
    expect(prisma.messengerChannelMessage.create).not.toHaveBeenCalled();
    expect(prisma.messengerDirectMessage.create).not.toHaveBeenCalled();
  });

  it('still 404s CLIENT after entity ensure wiring', async () => {
    const { service, core } = createService();
    core.getConversation.mockResolvedValue({ id: 'c1', zone: 'CLIENT' });
    await expect(service.getConversation('c1', 'e1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not GET after entity access 404s ensure', async () => {
    const { service, core } = createService();
    ensureProductWorkConversation.mockRejectedValue(new NotFoundException('Product not found'));
    await expect(service.ensureProduct('p1', 'e1')).rejects.toBeInstanceOf(NotFoundException);
    expect(core.getConversation).not.toHaveBeenCalled();
  });

  it('forwards TASKS.VIEW scope into Work Space ensure', async () => {
    const { service, core } = createService();
    ensureWorkSpaceConversation.mockResolvedValue({
      id: 'ws-conv',
      zone: 'INTERNAL',
      type: 'WORKSPACE',
      created: true,
    });
    core.getConversation.mockResolvedValue({ id: 'ws-conv', zone: 'INTERNAL', type: 'WORKSPACE' });
    await service.ensureWorkSpace('ws1', 'e1', 'OWN');
    expect(ensureWorkSpaceConversation).toHaveBeenCalledWith(expect.anything(), 'ws1', 'e1', 'OWN');
  });
});
