import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadInternalMessengerBootstrap, loadClientMessengerBootstrap } from './messenger-core-bootstrap.ops';
import type { MessengerInternalAccessSnapshot } from './messenger-core-access-snapshot';
import type { MessengerGrantSnapshot } from './messenger-core-grant-epoch';

const listAccessibleInternalConversations = vi.fn();
const listAccessibleClientConversations = vi.fn();
const listInternalCollections = vi.fn();
const listClientCollections = vi.fn();
const ensureInternalFavoritesCollection = vi.fn();
const ensureClientFavoritesCollection = vi.fn();
const snapshotMessengerZoneRead = vi.fn();
const isMessengerDeltaRecoveryEnabled = vi.fn();
const { createMessengerInternalAccessSnapshot, createMessengerGrantSnapshot } = vi.hoisted(() => ({
  createMessengerInternalAccessSnapshot: vi.fn(),
  createMessengerGrantSnapshot: vi.fn(),
}));

vi.mock('./messenger-core-internal-list.ops', () => ({
  listAccessibleInternalConversations: (...args: unknown[]) =>
    listAccessibleInternalConversations(...args),
}));

vi.mock('./messenger-core-client-list.ops', () => ({
  listAccessibleClientConversations: (...args: unknown[]) =>
    listAccessibleClientConversations(...args),
}));

vi.mock('./messenger-core-collection-list.ops', () => ({
  listInternalCollections: (...args: unknown[]) => listInternalCollections(...args),
  listClientCollections: (...args: unknown[]) => listClientCollections(...args),
}));

vi.mock('./messenger-core-favorites-ensure.ops', () => ({
  ensureInternalFavoritesCollection: (...args: unknown[]) =>
    ensureInternalFavoritesCollection(...args),
  ensureClientFavoritesCollection: (...args: unknown[]) => ensureClientFavoritesCollection(...args),
}));

vi.mock('./messenger-core-revision-snapshot.ops', () => ({
  snapshotMessengerZoneRead: (...args: unknown[]) => snapshotMessengerZoneRead(...args),
}));

vi.mock('./messenger-core-recovery-flag', () => ({
  isMessengerDeltaRecoveryEnabled: () => isMessengerDeltaRecoveryEnabled(),
}));

vi.mock('./messenger-core-access-snapshot', () => ({
  createMessengerInternalAccessSnapshot: (...args: unknown[]) =>
    createMessengerInternalAccessSnapshot(...args),
}));

vi.mock('./messenger-core-grant-epoch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./messenger-core-grant-epoch')>();
  return {
    ...actual,
    createMessengerGrantSnapshot: (...args: unknown[]) => createMessengerGrantSnapshot(...args),
  };
});

const INTERNAL_ACCESS = {
  employeeId: 'e1',
  viewScope: 'ALL',
  editScope: 'ALL',
  clientReadScope: 'NONE',
  clientSendScope: 'NONE',
  zone: 'INTERNAL' as const,
};

const CLIENT_ACCESS = {
  employeeId: 'e1',
  viewScope: 'ALL',
  editScope: 'NONE',
  clientReadScope: 'ALL',
  clientSendScope: 'ALL',
  zone: 'CLIENT' as const,
};

const INTERNAL_ACL: MessengerInternalAccessSnapshot = {
  grants: { employeeId: 'e1', zone: 'INTERNAL', grants: [] },
  tasks: { allowedTaskIds: null, digest: 'TASK_VIEW_ALL' },
};

const CLIENT_GRANTS: MessengerGrantSnapshot = {
  employeeId: 'e1',
  zone: 'CLIENT',
  grants: [],
};

describe('Messenger zone bootstrap', () => {
  beforeEach(() => {
    listAccessibleInternalConversations.mockReset();
    listAccessibleClientConversations.mockReset();
    listInternalCollections.mockReset();
    listClientCollections.mockReset();
    ensureInternalFavoritesCollection.mockReset();
    ensureClientFavoritesCollection.mockReset();
    snapshotMessengerZoneRead.mockReset();
    isMessengerDeltaRecoveryEnabled.mockReset().mockReturnValue(false);
    createMessengerInternalAccessSnapshot.mockReset().mockResolvedValue(INTERNAL_ACL);
    createMessengerGrantSnapshot.mockReset().mockResolvedValue(CLIENT_GRANTS);
    snapshotMessengerZoneRead.mockImplementation(async (_prisma, _zone, read) => ({
      checkpoint: '0',
      value: await read({}),
    }));
    listAccessibleInternalConversations.mockResolvedValue({
      items: [{ id: 'i1', zone: 'INTERNAL' }],
      mentionsAvailable: true,
      hasMore: false,
    });
    listInternalCollections.mockResolvedValue([
      { id: 'fav-i', zone: 'INTERNAL', name: 'Favorites' },
      { id: 'col-i', zone: 'INTERNAL', name: 'Watch' },
    ]);
    ensureInternalFavoritesCollection.mockResolvedValue({
      id: 'fav-i',
      name: 'Favorites',
      zone: 'INTERNAL',
    });
  });

  it('advertises FULL recovery and no checkpoint while the rollout flag is off', async () => {
    const result = await loadInternalMessengerBootstrap({} as never, INTERNAL_ACCESS, {
      employeeId: 'e1',
      departmentIds: [],
      viewScope: 'OWN',
    });
    expect(result.recoveryMode).toBe('FULL');
    expect(result.checkpoint).toBeNull();
    expect(result.authorizationEpoch).toBeNull();
    expect(snapshotMessengerZoneRead).not.toHaveBeenCalled();
    expect(createMessengerInternalAccessSnapshot).not.toHaveBeenCalled();
    expect(result.summaries.items).toEqual([{ id: 'i1', zone: 'INTERNAL' }]);
  });

  it('establishes a DELTA checkpoint only after the activation flag is on', async () => {
    isMessengerDeltaRecoveryEnabled.mockReturnValue(true);
    const tasksAccess = { employeeId: 'e1', departmentIds: [], viewScope: 'OWN' as const };
    const result = await loadInternalMessengerBootstrap({} as never, INTERNAL_ACCESS, tasksAccess);
    expect(ensureInternalFavoritesCollection.mock.invocationCallOrder[0]).toBeLessThan(
      snapshotMessengerZoneRead.mock.invocationCallOrder[0] ?? 0,
    );
    expect(result.recoveryMode).toBe('DELTA');
    expect(result.checkpoint).toBe('0');
    expect(result.authorizationEpoch).toMatch(/^[a-f0-9]{32}$/);
    expect(JSON.stringify(result)).not.toMatch(/messages/);
    expect(JSON.stringify(result.summaries)).not.toContain('CLIENT');
    expect(createMessengerInternalAccessSnapshot).toHaveBeenCalledTimes(1);
    expect(listAccessibleInternalConversations).toHaveBeenCalledWith(
      expect.anything(),
      'e1',
      'ALL',
      { section: 'all' },
      'ALL',
      tasksAccess,
      INTERNAL_ACL,
    );
    expect(JSON.stringify(result)).not.toMatch(/aaaaaaaa-/);
  });

  it('returns independent Client inbox summaries without Internal data or a checkpoint by default', async () => {
    listAccessibleClientConversations.mockResolvedValue({
      items: [{ id: 'c1', zone: 'CLIENT' }],
      hasMore: false,
    });
    ensureClientFavoritesCollection.mockResolvedValue({
      id: 'fav-c',
      name: 'Favorites',
      zone: 'CLIENT',
    });
    listClientCollections.mockResolvedValue([
      { id: 'fav-c', zone: 'CLIENT', name: 'Favorites' },
      { id: 'col-c', zone: 'CLIENT', name: 'Premium' },
    ]);
    const result = await loadClientMessengerBootstrap({} as never, CLIENT_ACCESS);
    expect(result.recoveryMode).toBe('FULL');
    expect(result.checkpoint).toBeNull();
    expect(result.summaries.items[0]?.zone).toBe('CLIENT');
    expect(JSON.stringify(result)).not.toContain('INTERNAL');
    expect(createMessengerGrantSnapshot).not.toHaveBeenCalled();
  });
});
