import { describe, expect, it, vi } from 'vitest';
import {
  loadClientMessengerBootstrap,
  loadInternalMessengerBootstrap,
} from './messenger-core-bootstrap.ops';
import { instrumentPrismaDelegates, type PrismaCallSnapshot } from './messenger-prisma-call-count';

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
  viewScope: 'NONE',
  editScope: 'NONE',
  clientReadScope: 'ALL',
  clientSendScope: 'ALL',
  zone: 'CLIENT' as const,
};

const FAVORITES = {
  id: 'fav-1',
  name: 'Favorites',
  visibility: 'PERSONAL' as const,
  ownerEmployeeId: 'e1',
};

const EMPLOYEE_ALL = {
  id: 'e1',
  status: 'ACTIVE',
  departments: [],
  role: {
    permissions: [
      { scope: 'ALL', permission: { module: 'MESSENGER', action: 'VIEW' } },
      { scope: 'ALL', permission: { module: 'MESSENGER', action: 'EDIT' } },
      { scope: 'ALL', permission: { module: 'MESSENGER', action: 'CLIENT_READ' } },
      { scope: 'ALL', permission: { module: 'MESSENGER', action: 'CLIENT_SEND' } },
      { scope: 'ALL', permission: { module: 'TASKS', action: 'VIEW' } },
    ],
  },
};

const STEADY_TOTAL = 6;
const FIRST_INIT_TOTAL = 7;
const BACKFILL_TOTAL = 10;

describe('Phase 6 Messenger bootstrap provisioning call counts', () => {
  it('Internal/Client steady-state Favorites exist and have no legacy settings', async () => {
    await withDeltaOff(async () => {
      const internal = await runInternalBootstrap({ favorites: true, settingIds: [] });
      expectBootstrapCounts(internal, { total: STEADY_TOTAL, mutating: 0, raw: 1 });
      const client = await runClientBootstrap({ favorites: true, settingIds: [] });
      expectBootstrapCounts(client, { total: STEADY_TOTAL, mutating: 0, raw: 1 });
    });
  });

  it('Internal/Client first initialization creates Favorites once', async () => {
    await withDeltaOff(async () => {
      const internal = await runInternalBootstrap({ favorites: false, settingIds: [] });
      expectBootstrapCounts(internal, { total: FIRST_INIT_TOTAL, mutating: 1, raw: 1 });
      expect(internal.byPath['messengerConversationCollection.create']).toBe(1);
      const client = await runClientBootstrap({ favorites: false, settingIds: [] });
      expectBootstrapCounts(client, { total: FIRST_INIT_TOTAL, mutating: 1, raw: 1 });
    });
  });

  it('legacy favorites backfill stays bounded for 2 and 80 settings', async () => {
    await withDeltaOff(async () => {
      const two = ids(2);
      const eighty = ids(80);
      const internalSmall = await runInternalBootstrap({ favorites: true, settingIds: two });
      const internalLarge = await runInternalBootstrap({ favorites: true, settingIds: eighty });
      expectBootstrapCounts(internalSmall, { total: BACKFILL_TOTAL, mutating: 1, raw: 1 });
      expectBootstrapCounts(internalLarge, { total: BACKFILL_TOTAL, mutating: 1, raw: 1 });
      expect(internalLarge.byPath['messengerConversationCollectionItem.createMany']).toBe(1);
      const clientSmall = await runClientBootstrap({ favorites: true, settingIds: two });
      const clientLarge = await runClientBootstrap({ favorites: true, settingIds: eighty });
      expectBootstrapCounts(clientSmall, { total: BACKFILL_TOTAL, mutating: 1, raw: 1 });
      expectBootstrapCounts(clientLarge, { total: BACKFILL_TOTAL, mutating: 1, raw: 1 });
    });
  });
});

async function withDeltaOff(run: () => Promise<void>): Promise<void> {
  const previous = process.env.MESSENGER_DELTA_RECOVERY_ENABLED;
  delete process.env.MESSENGER_DELTA_RECOVERY_ENABLED;
  try {
    await run();
  } finally {
    if (previous === undefined) delete process.env.MESSENGER_DELTA_RECOVERY_ENABLED;
    else process.env.MESSENGER_DELTA_RECOVERY_ENABLED = previous;
  }
}

async function runInternalBootstrap(input: {
  favorites: boolean;
  settingIds: string[];
}): Promise<PrismaCallSnapshot> {
  const counted = instrumentPrismaDelegates(bootstrapPrisma('INTERNAL', input));
  await loadInternalMessengerBootstrap(counted.prisma as never, INTERNAL_ACCESS);
  return counted.snapshot();
}

async function runClientBootstrap(input: {
  favorites: boolean;
  settingIds: string[];
}): Promise<PrismaCallSnapshot> {
  const counted = instrumentPrismaDelegates(bootstrapPrisma('CLIENT', input));
  await loadClientMessengerBootstrap(counted.prisma as never, CLIENT_ACCESS);
  return counted.snapshot();
}

function expectBootstrapCounts(
  snapshot: PrismaCallSnapshot,
  expected: { total: number; mutating: number; raw: number },
): void {
  expect(snapshot.total).toBe(expected.total);
  expect(snapshot.mutating).toBe(expected.mutating);
  expect(snapshot.raw).toBe(expected.raw);
  expect(snapshot.transactions).toBe(1);
  expect(snapshot.byPath.$executeRaw).toBe(1);
}

function ids(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `c${i}`);
}

function bootstrapPrisma(
  zone: 'INTERNAL' | 'CLIENT',
  input: { favorites: boolean; settingIds: string[] },
) {
  let stored = input.favorites ? { ...FAVORITES, zone } : null;
  return {
    $executeRaw: vi.fn().mockResolvedValue(undefined),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(undefined),
    employee: { findUnique: vi.fn().mockResolvedValue(EMPLOYEE_ALL) },
    resourceAccessGrant: { findMany: vi.fn().mockResolvedValue([]) },
    messengerUserConversationSetting: {
      findMany: vi
        .fn()
        .mockResolvedValue(input.settingIds.map((conversationId) => ({ conversationId }))),
    },
    messengerConversationCollectionItem: {
      createMany: vi.fn().mockResolvedValue({ count: input.settingIds.length }),
    },
    messengerConversationCollection: {
      findFirst: vi.fn().mockImplementation(async () => stored),
      findMany: vi.fn().mockImplementation(async () => (stored ? [stored] : [])),
      create: vi
        .fn()
        .mockImplementation(async (args: { data: typeof FAVORITES & { zone: typeof zone } }) => {
          stored = {
            id: 'fav-new',
            name: args.data.name,
            visibility: args.data.visibility,
            zone: args.data.zone,
            ownerEmployeeId: args.data.ownerEmployeeId,
          };
          return stored;
        }),
    },
    messengerConversation: {
      findMany: vi.fn().mockImplementation(async (args: { where?: unknown }) => {
        const inIds = collectWhereInIds(args.where);
        if (inIds) return inIds.map((id) => conversationRow(zone, id));
        return [conversationRow(zone, 'listed')];
      }),
    },
  };
}

function collectWhereInIds(where: unknown): string[] | null {
  if (!where || typeof where !== 'object') return null;
  const rec = where as Record<string, unknown>;
  if (rec.id && typeof rec.id === 'object' && rec.id !== null && 'in' in rec.id) {
    const value = (rec.id as { in: unknown }).in;
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : null;
  }
  if (!Array.isArray(rec.AND)) return null;
  for (const part of rec.AND) {
    const found = collectWhereInIds(part);
    if (found) return found;
  }
  return null;
}

function conversationRow(zone: 'INTERNAL' | 'CLIENT', id: string) {
  const createdAt = new Date('2026-08-01T10:00:00.000Z');
  const lastMessageAt = new Date('2026-08-30T12:00:00.000Z');
  if (zone === 'CLIENT') {
    return {
      id,
      zone,
      type: 'EXTERNAL',
      title: id,
      status: 'ACTIVE',
      canonicalKey: null,
      createdAt,
      lastMessageAt,
      messages: [
        { content: 'hello', direction: 'INBOUND', senderId: null, createdAt: lastMessageAt },
      ],
      readStates: [],
      userSettings: [],
      participants: [{ role: 'MEMBER' }],
      externalMappings: [],
      links: [],
      productCommunicationBindings: [],
      attentions: [],
    };
  }
  return {
    id,
    zone,
    type: 'INTERNAL_GROUP',
    title: id,
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt,
    lastMessageAt,
    messages: [{ content: 'hello', senderId: 'other', createdAt: lastMessageAt }],
    readStates: [],
    userSettings: [],
    participants: [],
  };
}
