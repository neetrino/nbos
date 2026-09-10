import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadClientMessengerDelta, loadInternalMessengerDelta } from './messenger-core-delta.ops';
import { messengerAuthorizationEpoch } from './messenger-core-auth-epoch';
import { digestMessengerGrantSet } from './messenger-core-grant-epoch';
import type { MessengerInternalAccessSnapshot } from './messenger-core-access-snapshot';
import type { MessengerGrantSnapshot } from './messenger-core-grant-epoch';

const listAccessibleInternalConversationsByIds = vi.fn();
const listAccessibleClientConversationsByIds = vi.fn();
const shareLockZoneRevision = vi.fn();
const { createMessengerInternalAccessSnapshot, createMessengerGrantSnapshot } = vi.hoisted(() => ({
  createMessengerInternalAccessSnapshot: vi.fn(),
  createMessengerGrantSnapshot: vi.fn(),
}));

vi.mock('./messenger-core-internal-list.ops', () => ({
  listAccessibleInternalConversationsByIds: (...args: unknown[]) =>
    listAccessibleInternalConversationsByIds(...args),
}));

vi.mock('./messenger-core-client-list.ops', () => ({
  listAccessibleClientConversationsByIds: (...args: unknown[]) =>
    listAccessibleClientConversationsByIds(...args),
}));

vi.mock('./messenger-core-revision-write.ops', () => ({
  shareLockZoneRevision: (...args: unknown[]) => shareLockZoneRevision(...args),
}));

vi.mock('./messenger-core-revision-tx', () => ({
  runMessengerReadTx: async (_prisma: unknown, fn: (tx: unknown) => unknown) => fn(_prisma),
  runMessengerWriteTx: async (_prisma: unknown, fn: (tx: unknown) => unknown) => fn(_prisma),
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
  clientSendScope: 'NONE',
  zone: 'CLIENT' as const,
};

const INTERNAL_ACL: MessengerInternalAccessSnapshot = {
  grants: { employeeId: 'e1', zone: 'INTERNAL', grants: [] },
  tasks: { allowedTaskIds: null, digest: 'TASK_ACL_ABSENT' },
};

const CLIENT_GRANTS: MessengerGrantSnapshot = {
  employeeId: 'e1',
  zone: 'CLIENT',
  grants: [],
};

const EMPTY_GRANT_DIGEST = digestMessengerGrantSet([]);

describe('Messenger zone delta security', () => {
  beforeEach(() => {
    listAccessibleInternalConversationsByIds.mockReset();
    listAccessibleClientConversationsByIds.mockReset();
    shareLockZoneRevision.mockReset().mockResolvedValue(10n);
    createMessengerInternalAccessSnapshot.mockReset().mockResolvedValue(INTERNAL_ACL);
    createMessengerGrantSnapshot.mockReset().mockResolvedValue(CLIENT_GRANTS);
  });

  function internalEpoch() {
    return messengerAuthorizationEpoch({
      ...INTERNAL_ACCESS,
      taskAclDigest: 'TASK_ACL_ABSENT',
      grantAclDigest: EMPTY_GRANT_DIGEST,
    });
  }

  function clientEpoch(access = CLIENT_ACCESS) {
    return messengerAuthorizationEpoch({ ...access, grantAclDigest: EMPTY_GRANT_DIGEST });
  }

  it('requires an authorization epoch match instead of returning a silent gap', async () => {
    const result = await loadInternalMessengerDelta({} as never, INTERNAL_ACCESS, undefined, {
      after: '0',
    });
    expect(result.resetRequired).toBe(true);
    expect(result.summaries).toEqual([]);
    expect(listAccessibleInternalConversationsByIds).not.toHaveBeenCalled();
  });

  it('forces reset before any delta IDs when the Task ACL digest changes', async () => {
    createMessengerInternalAccessSnapshot.mockResolvedValue({
      ...INTERNAL_ACL,
      tasks: { allowedTaskIds: null, digest: 'digest-after-removal' },
    });
    const stale = messengerAuthorizationEpoch({
      ...INTERNAL_ACCESS,
      taskAclDigest: 'digest-before-removal',
    });
    const result = await loadInternalMessengerDelta({} as never, INTERNAL_ACCESS, undefined, {
      after: '4',
      authorizationEpoch: stale,
    });
    expect(result.resetRequired).toBe(true);
    expect(result.summaries).toEqual([]);
    expect(result.removedConversationIds).toEqual([]);
    expect(result.changedConversationIds).toEqual([]);
    expect(shareLockZoneRevision).not.toHaveBeenCalled();
    expect(listAccessibleInternalConversationsByIds).not.toHaveBeenCalled();
  });

  it('forces reset before any delta IDs when an active grant expires', async () => {
    createMessengerInternalAccessSnapshot.mockResolvedValue({
      ...INTERNAL_ACL,
      grants: {
        employeeId: 'e1',
        zone: 'INTERNAL',
        grants: [{ conversationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', level: 'VIEW' }],
      },
    });
    const stale = messengerAuthorizationEpoch({
      ...INTERNAL_ACCESS,
      taskAclDigest: 'TASK_ACL_ABSENT',
      grantAclDigest: 'grant-before-expiry',
    });
    const result = await loadInternalMessengerDelta({} as never, INTERNAL_ACCESS, undefined, {
      after: '4',
      authorizationEpoch: stale,
    });
    expect(result.resetRequired).toBe(true);
    expect(result.summaries).toEqual([]);
    expect(result.removedConversationIds).toEqual([]);
    expect(shareLockZoneRevision).not.toHaveBeenCalled();
    expect(listAccessibleInternalConversationsByIds).not.toHaveBeenCalled();
  });

  it('does not load Task ACL data for Client delta', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([]) };
    listAccessibleClientConversationsByIds.mockResolvedValue([]);
    await loadClientMessengerDelta(prisma as never, CLIENT_ACCESS, {
      after: '0',
      authorizationEpoch: clientEpoch(),
    });
    expect(createMessengerInternalAccessSnapshot).not.toHaveBeenCalled();
    expect(createMessengerGrantSnapshot).toHaveBeenCalledTimes(1);
  });

  it('does not hydrate Client rows on the Internal endpoint', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        { conversationId: 'c1', revision: '3', changeKind: 'CONVERSATION', lane: 'G' },
      ]),
    };
    listAccessibleInternalConversationsByIds.mockResolvedValue([]);
    const result = await loadInternalMessengerDelta(prisma as never, INTERNAL_ACCESS, undefined, {
      after: '0',
      authorizationEpoch: internalEpoch(),
    });
    expect(listAccessibleInternalConversationsByIds).toHaveBeenCalled();
    expect(listAccessibleClientConversationsByIds).not.toHaveBeenCalled();
    expect(result.summaries).toEqual([]);
    expect(result.removedConversationIds).toEqual([]);
  });

  it('does not hydrate Internal rows on the Client endpoint', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        { conversationId: 'i1', revision: '3', changeKind: 'CONVERSATION', lane: 'G' },
      ]),
    };
    listAccessibleClientConversationsByIds.mockResolvedValue([]);
    const result = await loadClientMessengerDelta(prisma as never, CLIENT_ACCESS, {
      after: '0',
      authorizationEpoch: messengerAuthorizationEpoch({
        ...CLIENT_ACCESS,
        grantAclDigest: EMPTY_GRANT_DIGEST,
      }),
    });
    expect(listAccessibleClientConversationsByIds).toHaveBeenCalled();
    expect(listAccessibleInternalConversationsByIds).not.toHaveBeenCalled();
    expect(result.summaries).toEqual([]);
  });

  it('keeps checkpoint fixed across a page while hydrating in requested order', async () => {
    const idA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const idB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        { conversationId: idA, revision: '4', changeKind: 'CONVERSATION', lane: 'G' },
        { conversationId: idB, revision: '4', changeKind: 'READ', lane: 'T' },
        { conversationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', revision: '5', changeKind: 'CONVERSATION', lane: 'G' },
      ]),
    };
    listAccessibleInternalConversationsByIds.mockImplementation(
      async (_p: unknown, _e: string, _v: string, ids: string[]) =>
        ids.filter((id) => id === idA || id === idB).map((id) => ({ id, zone: 'INTERNAL' })),
    );
    const result = await loadInternalMessengerDelta(prisma as never, INTERNAL_ACCESS, undefined, {
      after: '0',
      pageSize: 2,
      authorizationEpoch: internalEpoch(),
    });
    expect(result.checkpoint).toBe('10');
    expect(result.hasMore).toBe(true);
    expect(result.summaries.map((row) => row.id)).toEqual([idA, idB]);
    expect(result.nextCursor).toContain(idB);
    expect(listAccessibleInternalConversationsByIds.mock.calls[0]?.[3]).toEqual([idA, idB]);
  });

  it('treats a targeted removal for another employee as absent from this query', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
    };
    listAccessibleInternalConversationsByIds.mockResolvedValue([]);
    const result = await loadInternalMessengerDelta(prisma as never, INTERNAL_ACCESS, undefined, {
      after: '0',
      authorizationEpoch: internalEpoch(),
    });
    expect(result.removedConversationIds).toEqual([]);
    expect(JSON.stringify(prisma.$queryRaw.mock.calls[0]?.[0] ?? '')).not.toMatch(/body|preview|title|secret/);
  });

  it('rejects after above the live checkpoint', async () => {
    shareLockZoneRevision.mockResolvedValue(3n);
    await expect(
      loadInternalMessengerDelta({} as never, INTERNAL_ACCESS, undefined, {
        after: '9',
        authorizationEpoch: internalEpoch(),
      }),
    ).rejects.toThrow(/Invalid revision checkpoint/);
  });

  it('rejects a continuation whose after is above the captured high-water', async () => {
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await expect(
      loadInternalMessengerDelta({} as never, INTERNAL_ACCESS, undefined, {
        after: '8',
        cursor: `5|4|${id}`,
        authorizationEpoch: internalEpoch(),
      }),
    ).rejects.toThrow(/Invalid delta cursor/);
  });

  it('rejects a continuation whose captured high-water is above the live counter', async () => {
    shareLockZoneRevision.mockResolvedValue(5n);
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await expect(
      loadInternalMessengerDelta({} as never, INTERNAL_ACCESS, undefined, {
        after: '0',
        cursor: `9|4|${id}`,
        authorizationEpoch: internalEpoch(),
      }),
    ).rejects.toThrow(/Invalid delta cursor/);
  });

  it('passes Client READ for ACL hydration and SEND only as a mapping input', async () => {
    const access = { ...CLIENT_ACCESS, clientReadScope: 'NONE', clientSendScope: 'ALL' };
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        { conversationId: 'c1', revision: '3', changeKind: 'CONVERSATION', lane: 'G' },
      ]),
    };
    listAccessibleClientConversationsByIds.mockResolvedValue([]);
    await loadClientMessengerDelta(prisma as never, access, {
      after: '0',
      authorizationEpoch: clientEpoch(access),
    });
    expect(listAccessibleClientConversationsByIds).toHaveBeenCalledWith(
      prisma,
      'e1',
      'NONE',
      'ALL',
      ['c1'],
      CLIENT_GRANTS,
    );
  });
});
