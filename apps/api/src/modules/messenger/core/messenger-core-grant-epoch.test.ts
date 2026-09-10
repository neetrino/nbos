import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { messengerAuthorizationEpoch } from './messenger-core-auth-epoch';
import {
  digestMessengerGrantSet,
  loadActiveMessengerConversationGrants,
  loadMessengerGrantAclDigest,
} from './messenger-core-grant-epoch';

const CONV_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONV_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CONV_CLIENT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const BASE = {
  employeeId: 'e1',
  viewScope: 'OWN',
  editScope: 'OWN',
  clientReadScope: 'OWN',
  clientSendScope: 'NONE',
};

describe('Messenger grant ACL epoch digest', () => {
  it('is stable when the same grants are reordered', () => {
    const first = digestMessengerGrantSet([
      { conversationId: CONV_B, level: 'VIEW' },
      { conversationId: CONV_A, level: 'EDIT' },
    ]);
    const second = digestMessengerGrantSet([
      { conversationId: CONV_A, level: 'EDIT' },
      { conversationId: CONV_B, level: 'VIEW' },
    ]);
    expect(first).toBe(second);
    expect(first).not.toMatch(CONV_A);
    expect(first).not.toMatch(CONV_B);
  });

  it('changes when an active grant expires or the VIEW/EDIT level changes', () => {
    const active = digestMessengerGrantSet([
      { conversationId: CONV_A, level: 'VIEW' },
      { conversationId: CONV_B, level: 'EDIT' },
    ]);
    const expired = digestMessengerGrantSet([{ conversationId: CONV_A, level: 'VIEW' }]);
    const promoted = digestMessengerGrantSet([
      { conversationId: CONV_A, level: 'EDIT' },
      { conversationId: CONV_B, level: 'EDIT' },
    ]);
    expect(active).not.toBe(expired);
    expect(active).not.toBe(promoted);
  });

  it('does not let an Internal grant change the Client epoch', () => {
    const internalGrant = digestMessengerGrantSet([{ conversationId: CONV_A, level: 'EDIT' }]);
    const clientEmpty = digestMessengerGrantSet([]);
    const internal = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'INTERNAL',
      grantAclDigest: internalGrant,
    });
    const client = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'CLIENT',
      grantAclDigest: clientEmpty,
    });
    const clientWithInternalDigest = messengerAuthorizationEpoch({
      ...BASE,
      zone: 'CLIENT',
      grantAclDigest: internalGrant,
    });
    expect(internal).not.toBe(client);
    expect(client).not.toBe(clientWithInternalDigest);
    expect(internal).not.toMatch(CONV_A);
    expect(client).not.toMatch(CONV_A);
  });

  it('joins active grants to the requested Core zone in two set-based queries per operation', async () => {
    const grantFind = vi.fn().mockResolvedValue([
      { resourceId: CONV_A, level: 'VIEW' },
      { resourceId: CONV_CLIENT, level: 'EDIT' },
    ]);
    const conversationFind = vi.fn().mockResolvedValue([{ id: CONV_A }]);
    const prisma = {
      resourceAccessGrant: { findMany: grantFind },
      messengerConversation: { findMany: conversationFind },
    };
    const first = await loadActiveMessengerConversationGrants(prisma as never, 'e1', 'INTERNAL');
    expect(first).toEqual([{ conversationId: CONV_A, level: 'VIEW' }]);
    expect(grantFind).toHaveBeenCalledTimes(1);
    expect(conversationFind).toHaveBeenCalledTimes(1);
    expect(conversationFind.mock.calls[0]?.[0]?.where).toEqual({
      zone: 'INTERNAL',
      id: { in: [CONV_A, CONV_CLIENT] },
    });
    const where = grantFind.mock.calls[0]?.[0]?.where as {
      revokedAt: null;
      OR: unknown[];
    };
    expect(where.revokedAt).toBeNull();
    expect(where.OR).toHaveLength(2);
  });

  it('re-queries the same Prisma object after expiry, revoke, or level change', async () => {
    let rows: Array<{ resourceId: string; level: string }> = [
      { resourceId: CONV_A, level: 'VIEW' },
    ];
    const grantFind = vi.fn().mockImplementation(async () => rows);
    const conversationFind = vi.fn().mockResolvedValue([{ id: CONV_A }]);
    const prisma = {
      resourceAccessGrant: { findMany: grantFind },
      messengerConversation: { findMany: conversationFind },
    };
    const active = await loadMessengerGrantAclDigest(prisma as never, 'e1', 'INTERNAL');
    expect(grantFind).toHaveBeenCalledTimes(1);
    expect(conversationFind).toHaveBeenCalledTimes(1);

    rows = [];
    const expired = await loadMessengerGrantAclDigest(prisma as never, 'e1', 'INTERNAL');
    expect(grantFind).toHaveBeenCalledTimes(2);
    expect(expired).not.toBe(active);

    rows = [{ resourceId: CONV_A, level: 'EDIT' }];
    const promoted = await loadMessengerGrantAclDigest(prisma as never, 'e1', 'INTERNAL');
    expect(grantFind).toHaveBeenCalledTimes(3);
    expect(promoted).not.toBe(active);
    expect(promoted).not.toBe(expired);
    expect(conversationFind).toHaveBeenCalledTimes(2);
    expect(grantFind.mock.calls.length).toBe(3);
  });

  it('does not retain a process-lifetime employee-key Map', () => {
    const src = readFileSync(new URL('./messenger-core-grant-epoch.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/WeakMap|new Map|AsyncLocalStorage|TTL/);
  });

  it('skips the zone join when the employee has no active grants', async () => {
    const conversationFind = vi.fn();
    const prisma = {
      resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
      messengerConversation: { findMany: conversationFind },
    };
    expect(await loadActiveMessengerConversationGrants(prisma as never, 'e1', 'CLIENT')).toEqual([]);
    expect(conversationFind).not.toHaveBeenCalled();
  });
});
