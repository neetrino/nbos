import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import { MessengerPersistedCoreMessageBus } from '../../messenger/core/messenger-persisted-core-message-bus';
import { MessengerPersistedCoreMessageSubscriber } from '../../messenger/messenger-persisted-core-message.subscriber';
import { WhatsAppOutboundMessagesWorker } from './whatsapp-outbound-messages.worker';
import type { WhatsAppOutboundJobPayload } from './whatsapp-outbound.types';

vi.mock('./whatsapp-outbound-gap', () => ({
  waitWhatsAppOutboundGap: vi.fn(async () => undefined),
}));

vi.mock('../../messenger/core/messenger-wa-outbound-drain.ops', () => ({
  drainPendingWhatsAppCoreSends: vi.fn(async () => 0),
}));

vi.mock('../../messenger/core/messenger-core-revision-write.ops', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../messenger/core/messenger-core-revision-write.ops')>();
  return { ...actual, bumpGlobalConversationRevision: vi.fn(async () => 1n) };
});

vi.mock('../../finance/invoices/invoice-official-request', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../finance/invoices/invoice-official-request')>();
  return {
    ...actual,
    sendOfficialInvoiceRequest: vi.fn(async () => ({})),
    cancelOfficialInvoiceRequest: vi.fn(async () => undefined),
  };
});

const WINDOW_OPEN = new Date('2026-04-15T07:00:00.000Z');

describe('official_send payment-window reminder publication', () => {
  const previousRole = process.env.PROCESS_ROLE;

  beforeEach(() => {
    process.env.PROCESS_ROLE = 'all';
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(WINDOW_OPEN);
  });

  afterEach(() => {
    vi.useRealTimers();
    restoreRole(previousRole);
  });

  it('hands the persisted QUEUED reminder to the API publish path once', async () => {
    const harness = createHarness();
    harness.subscriber.onModuleInit();
    await harness.worker.process(officialSendJob());
    await harness.worker.process(officialSendJob());

    expect(harness.outbound.enqueue).toHaveBeenCalledTimes(1);
    expect(harness.outbound.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'core_client_send', chatId: 'finance@g.us' }),
      false,
    );
    expect(harness.messageCreates()).toBe(1);
    expect(harness.createdIdempotencyKey()).toBe('subscription_payment_reminder:window:inv-1');
    expect(harness.gateway.publishPersistedCoreMessage).toHaveBeenCalledTimes(1);
    expect(harness.gateway.publishPersistedCoreMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'msg-1',
        conversationId: 'conv-finance',
        status: 'QUEUED',
        provenance: 'SYSTEM',
        direction: 'OUTBOUND',
      }),
    );
    expect(harness.order).toEqual(['enqueue', 'publish']);
    harness.subscriber.onModuleDestroy();
  });
});

function officialSendJob(): Job<WhatsAppOutboundJobPayload> {
  return {
    id: 'job-official',
    data: {
      kind: 'official_send',
      chatId: 'acct@g.us',
      text: 'official',
      idempotencyKey: 'official_send:inv-1:initial',
      invoiceId: 'inv-1',
    },
  } as Job<WhatsAppOutboundJobPayload>;
}

function createHarness() {
  const state = createState();
  const prisma = reminderPrisma(state);
  const bus = new MessengerPersistedCoreMessageBus();
  const gateway = {
    publishPersistedCoreMessage: vi.fn(() => {
      state.order.push('publish');
    }),
    emitCoreConversationMessage: vi.fn(),
  };
  const outbound = {
    enqueue: vi.fn(async () => {
      state.order.push('enqueue');
    }),
    isAvailable: () => true,
  };
  const subscriber = new MessengerPersistedCoreMessageSubscriber(
    prisma as never,
    bus,
    gateway as never,
  );
  const worker = new WhatsAppOutboundMessagesWorker(
    prisma as never,
    { requireClientConfig: vi.fn(async () => ({ session: 's1' })) } as never,
    { sendTextMessage: vi.fn(async () => undefined) } as never,
    { register: vi.fn() } as never,
    undefined,
    outbound as never,
    undefined,
    bus,
  );
  return {
    worker,
    subscriber,
    outbound,
    gateway,
    order: state.order,
    messageCreates: () => state.messageCreates,
    createdIdempotencyKey: () => state.idempotencyKey,
  };
}

type ReminderState = {
  message: Record<string, unknown> | null;
  command: Record<string, unknown> | null;
  jobId: string | null;
  messageCreates: number;
  idempotencyKey: string | null;
  order: string[];
};

function createState(): ReminderState {
  return {
    message: null,
    command: null,
    jobId: null,
    messageCreates: 0,
    idempotencyKey: null,
    order: [],
  };
}

function reminderPrisma(state: ReminderState) {
  return {
    invoice: { findUnique: vi.fn(async () => eligibleInvoice()) },
    whatsAppGatewayConnection: {
      findFirst: vi.fn(async () => ({ accountingGroupChatId: null })),
    },
    productCommunicationBinding: { findUnique: vi.fn(async () => financeBinding()) },
    messengerConversation: {
      findUnique: vi.fn(async () => ({ id: 'conv-finance', zone: 'CLIENT' })),
      update: vi.fn(async () => ({})),
    },
    messengerMessage: {
      findFirst: vi.fn(async () => (state.message ? { id: 'msg-1' } : null)),
      findUnique: vi.fn(async (args: { where: { id?: string } }) =>
        args.where.id === 'msg-1' ? state.message : null,
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.messageCreates += 1;
        state.idempotencyKey = String(data.idempotencyKey);
        state.message = storedMessage(data);
        return state.message;
      }),
    },
    messengerCommand: {
      findUnique: vi.fn(async () => state.command),
      createMany: vi.fn(async () => {
        state.command = storedCommand();
        return { count: 1 };
      }),
    },
    auditLog: { create: vi.fn(async () => ({ id: 'audit-1' })) },
    notificationJob: {
      findUnique: vi.fn(async () => (state.jobId ? { id: state.jobId } : null)),
      create: vi.fn(async () => {
        state.jobId = 'job-1';
        return { id: state.jobId };
      }),
    },
    notificationRule: { upsert: vi.fn(async () => ({ id: 'rule-1' })) },
    notificationEvent: { upsert: vi.fn(async () => ({ id: 'event-1' })) },
    $executeRaw: vi.fn(async () => 1),
  };
}

function storedMessage(data: Record<string, unknown>) {
  return {
    id: 'msg-1',
    replyToMessageId: null,
    threadRootMessageId: null,
    editedAt: null,
    deletedAt: null,
    createdAt: WINDOW_OPEN,
    ...data,
    attachments: [],
    mentions: [],
    referencesAsTarget: [],
    conversation: { zone: 'CLIENT' },
  };
}

function storedCommand() {
  return {
    id: 'cmd-1',
    status: 'PENDING',
    conversationId: 'conv-finance',
    resultMessageId: 'msg-1',
    kind: 'SEND_MESSAGE',
    payload: { accountId: 'acc', chatId: 'finance@g.us' },
  };
}

function financeBinding() {
  return {
    conversationId: 'conv-finance',
    conversation: {
      externalMappings: [{ externalAccountId: 'acc', externalConversationId: 'finance@g.us' }],
    },
  };
}

function eligibleInvoice() {
  return {
    id: 'inv-1',
    code: 'INV-1',
    amount: 180000,
    createdAt: new Date('2026-04-01T07:00:00.000Z'),
    dueDate: new Date('2026-04-20T00:00:00.000Z'),
    coverageStartMonth: '2026-04',
    coverageMonthCount: 1,
    taxStatus: 'TAX_FREE',
    moneyStatus: 'AWAITING_PAYMENT',
    officialInvoiceRequestSent: false,
    officialInvoiceSentAt: null,
    notificationsEnabled: true,
    paymentReminderCycle: 0,
    company: { name: 'ACME' },
    subscription: {
      name: 'Site A',
      code: 'SUB-1',
      productId: 'prod-1',
      billingDay: 15,
      notificationsEnabled: true,
      reminderLanguage: 'RU',
      product: { id: 'prod-1', name: 'Site A' },
    },
    clientServiceRecord: null,
    order: null,
  };
}

function restoreRole(previous: string | undefined): void {
  if (previous === undefined) delete process.env.PROCESS_ROLE;
  else process.env.PROCESS_ROLE = previous;
}
