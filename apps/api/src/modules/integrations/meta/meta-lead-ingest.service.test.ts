import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MetaLeadIngestService } from './meta-lead-ingest.service';
import type { MetaProfileService } from './meta-profile.service';
import type { ParsedMetaInboundMessage } from './meta.types';

const baseMessage: ParsedMetaInboundMessage = {
  eventId: 'mid-1',
  objectId: 'ig-account-1',
  platform: 'INSTAGRAM',
  senderId: 'sender-1',
  recipientId: 'recipient-1',
  senderName: null,
  messageText: 'Здравствуйте, хочу заказать сайт',
  timestamp: 1_700_000_000,
  pageId: 'ig-account-1',
  instagramBusinessAccountId: 'ig-account-1',
  replyToMid: null,
  attachmentTypes: [],
};

function createPrismaMock() {
  const state = {
    leads: [] as Array<{ id: string; name: string | null; contactName: string; code: string }>,
    senderIdentities: new Map<string, Record<string, unknown>>(),
    conversations: new Map<string, Record<string, unknown>>(),
    messages: new Set<string>(),
    events: new Set<string>(),
  };

  const prisma = {
    metaConnectedAccount: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'connected-1',
        platform: 'INSTAGRAM',
        pageId: 'ig-account-1',
        instagramBusinessAccountId: 'ig-account-1',
        marketingAccountId: 'marketing-1',
        displayName: 'Neetrino Instagram',
        scopes: ['instagram_business_basic', 'instagram_business_manage_messages'],
      }),
    },
    metaProviderEvent: {
      create: vi.fn().mockImplementation(async ({ data }: { data: { eventId: string } }) => {
        if (state.events.has(data.eventId)) {
          const error = new Error('unique') as Error & { code: string };
          error.code = 'P2002';
          throw error;
        }
        state.events.add(data.eventId);
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    metaSenderIdentity: {
      findUnique: vi.fn().mockImplementation(async () => null),
      upsert: vi
        .fn()
        .mockImplementation(async ({ create }: { create: Record<string, unknown> }) => {
          const key = `${String(create.platform)}:${String(create.metaConnectedAccountId)}:${String(create.senderScopedId)}`;
          const row = { id: 'sender-1', ...create };
          state.senderIdentities.set(key, row);
          return row;
        }),
    },
    metaConversation: {
      upsert: vi
        .fn()
        .mockImplementation(async ({ create }: { create: Record<string, unknown> }) => {
          const key = `${String(create.metaConnectedAccountId)}:${String(create.senderIdentityId)}`;
          const existing = state.conversations.get(key);
          if (existing) {
            return existing;
          }
          const row = { id: 'conv-1', leadId: null, ...create };
          state.conversations.set(key, row);
          return row;
        }),
      update: vi
        .fn()
        .mockImplementation(
          async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            const row = [...state.conversations.values()].find((item) => item.id === where.id);
            if (!row) throw new Error('missing conversation');
            Object.assign(row, data);
            return row;
          },
        ),
    },
    metaMessage: {
      create: vi
        .fn()
        .mockImplementation(async ({ data }: { data: { providerMessageId: string } }) => {
          if (state.messages.has(data.providerMessageId)) {
            const error = new Error('unique') as Error & { code: string };
            error.code = 'P2002';
            throw error;
          }
          state.messages.add(data.providerMessageId);
          return { id: 'msg-1' };
        }),
    },
    lead: {
      create: vi
        .fn()
        .mockImplementation(
          async ({ data }: { data: { name: string; contactName: string; code: string } }) => {
            const row = { id: `lead-${state.leads.length + 1}`, ...data };
            state.leads.push(row);
            return row;
          },
        ),
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (callback: (tx: typeof prisma) => Promise<string>) =>
        callback(prisma),
      ),
  };

  return { prisma, state };
}

function createProfileService(): MetaProfileService {
  return {
    resolveSenderProfile: vi.fn().mockResolvedValue({
      profile: {
        displayName: 'Karo Gabrielyan',
        username: 'karo_gabrielyan',
        firstName: null,
        lastName: null,
        profilePictureUrl: null,
      },
      profileFetchedAt: new Date(),
      profileFetchStatus: 'OK',
      lastProfileFetchError: null,
      identityPatch: {
        displayName: 'Karo Gabrielyan',
        username: 'karo_gabrielyan',
        firstName: null,
        lastName: null,
        profilePictureUrl: null,
      },
      fetchedNow: true,
    }),
  } as unknown as MetaProfileService;
}

describe('MetaLeadIngestService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates one lead and stores first inbound message', async () => {
    const { prisma, state } = createPrismaMock();
    const service = new MetaLeadIngestService(prisma as never, createProfileService());

    await service.ingestMessage(baseMessage);

    expect(state.leads).toHaveLength(1);
    expect(state.leads[0]?.name).toBe('Karo Gabrielyan');
    expect(state.leads[0]?.contactName).toBe('@karo_gabrielyan');
    expect(state.messages.has('mid-1')).toBe(true);
  });

  it('reuses the same lead for a second message from the same sender', async () => {
    const { prisma, state } = createPrismaMock();
    const service = new MetaLeadIngestService(prisma as never, createProfileService());

    await service.ingestMessage(baseMessage);
    prisma.metaConversation.upsert.mockImplementation(async () => ({
      id: 'conv-1',
      leadId: 'lead-1',
      metaConnectedAccountId: 'connected-1',
      senderIdentityId: 'sender-1',
    }));

    await service.ingestMessage({
      ...baseMessage,
      eventId: 'mid-2',
      messageText: 'Сколько стоит интернет-магазин?',
    });

    expect(state.leads).toHaveLength(1);
    expect(state.messages.has('mid-1')).toBe(true);
    expect(state.messages.has('mid-2')).toBe(true);
  });

  it('skips duplicate webhook events', async () => {
    const { prisma, state } = createPrismaMock();
    const service = new MetaLeadIngestService(prisma as never, createProfileService());

    await service.ingestMessage(baseMessage);
    await service.ingestMessage(baseMessage);

    expect(state.leads).toHaveLength(1);
    expect(state.messages.has('mid-1')).toBe(true);
  });
});
