import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { WhatsAppGatewayHttpError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import { reconcileMessengerOutboundCommands } from './messenger-outbound-reconcile.ops';
import { dispatchWhatsAppCoreSendJob } from './messenger-wa-outbound-dispatch.ops';

const CHAT = '37499111222@c.us';
const HOUR = 60 * 60 * 1000;
const JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-c',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
};
const REPAIR_KEY = `${JOB.idempotencyKey}:repair:1`;

type Live = {
  command: {
    id: string;
    conversationId: string;
    resultMessageId: string;
    idempotencyKey: string;
    kind: string;
    status: string;
    payload: Record<string, unknown>;
    firstAttemptAt: Date | null;
    createdAt: Date;
    invalidReason: string | null;
    nextReconcileAt: Date | null;
    dispatchToken: string | null;
    dispatchClaimedAt: Date | null;
  };
  messageStatus: string;
  ref: { id: string } | null;
};

function live(input: {
  status?: string;
  messageStatus?: string;
  firstAttemptAt?: Date | null;
  repair?: boolean;
  token?: string | null;
  ref?: { id: string } | null;
}): Live {
  const firstAttemptAt = input.firstAttemptAt === undefined ? hoursAgo(2) : input.firstAttemptAt;
  return {
    command: {
      id: 'cmd-1',
      conversationId: JOB.conversationId,
      resultMessageId: JOB.messageId,
      idempotencyKey: JOB.idempotencyKey,
      kind: 'SEND_MESSAGE',
      status: input.status ?? 'PENDING',
      payload: input.repair
        ? { accountId: JOB.accountId, chatId: CHAT, repairGeneration: 1 }
        : { accountId: JOB.accountId, chatId: CHAT },
      firstAttemptAt,
      createdAt: firstAttemptAt ?? new Date(),
      invalidReason: null,
      nextReconcileAt: null,
      dispatchToken: input.token ?? null,
      dispatchClaimedAt: null,
    },
    messageStatus: input.messageStatus ?? 'QUEUED',
    ref: input.ref ?? null,
  };
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * HOUR);
}

function memoryPrisma(state: Live) {
  const command = state.command;
  return {
    $queryRaw: vi.fn(async () => [{ ...command, payload: command.payload }]),
    messengerCommand: {
      findMany: vi.fn(async () => [{ ...command, payload: command.payload }]),
      findUnique: vi.fn(async () => ({ ...command, payload: command.payload })),
      updateMany: vi.fn(async ({ data }: { data?: Record<string, unknown> }) => {
        if (command.dispatchToken) return { count: 0 };
        if (data) Object.assign(command, data);
        return { count: 1 };
      }),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(command, data);
        return { ...command };
      }),
    },
    messengerMessage: {
      findUnique: vi.fn(async () => ({
        id: JOB.messageId,
        conversationId: JOB.conversationId,
        content: 'hi',
        status: state.messageStatus,
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      })),
      updateMany: vi.fn(
        async ({ where, data }: { where: MessageWhere; data: { status: string } }) => {
          if (!messageMatches(state.messageStatus, where.status)) return { count: 0 };
          state.messageStatus = data.status;
          return { count: 1 };
        },
      ),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue({
        externalAccountId: JOB.accountId,
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    messengerMessageExternalRef: { findFirst: vi.fn(async () => state.ref) },
    auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) },
  };
}

type MessageWhere = { status?: string | { in: string[] } };

function messageMatches(current: string, status: MessageWhere['status']): boolean {
  if (typeof status === 'string') return current === status;
  if (status && 'in' in status) return status.in.includes(current);
  return true;
}

function ambiguousGateway() {
  const keys: string[] = [];
  const client = {
    sendAccountTextMessage: vi.fn(async (_config, _account, _body, key: string) => {
      keys.push(key);
      throw new WhatsAppGatewayHttpError(503, 'MESSAGE_OUTCOME_UNKNOWN', 'unknown');
    }),
  };
  const connection = {
    requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
  };
  return { client, connection, keys };
}

async function dispatch(state: Live, gateway: ReturnType<typeof ambiguousGateway>) {
  await dispatchWhatsAppCoreSendJob(
    memoryPrisma(state) as never,
    gateway.connection as never,
    gateway.client as never,
    JOB,
  );
}

describe('legacy repair transport key', () => {
  it('retries an in-window repair unknown with the same provider key', async () => {
    const started = hoursAgo(2);
    const state = live({ repair: true, firstAttemptAt: started });
    const gateway = ambiguousGateway();
    await dispatch(state, gateway);
    expect(state.command.status).toBe('OUTCOME_UNKNOWN');
    expect(state.messageStatus).toBe('OUTCOME_UNKNOWN');
    expect(state.command.payload.repairGeneration).toBe(1);
    expect(state.command.idempotencyKey).toBe(JOB.idempotencyKey);
    expect(state.command.firstAttemptAt).toEqual(started);
    await dispatch(state, gateway);
    expect(gateway.keys).toEqual([REPAIR_KEY, REPAIR_KEY]);
    expect(gateway.keys[1]).toBe(gateway.keys[0]);
  });

  it('allows one initial repair after 24h and then blocks the unknown retry', async () => {
    const started = hoursAgo(72);
    const state = live({ repair: true, firstAttemptAt: started });
    const gateway = ambiguousGateway();
    await dispatch(state, gateway);
    expect(gateway.keys).toEqual([REPAIR_KEY]);
    expect(state.command.firstAttemptAt).toEqual(started);
    await dispatch(state, gateway);
    expect(gateway.keys).toEqual([REPAIR_KEY]);
    expect(state.command.invalidReason).toBe('GATEWAY_WINDOW_EXPIRED');
  });

  it('does not call Gateway for an expired repair unknown', async () => {
    const state = live({
      repair: true,
      status: 'OUTCOME_UNKNOWN',
      messageStatus: 'OUTCOME_UNKNOWN',
      firstAttemptAt: hoursAgo(25),
    });
    const gateway = ambiguousGateway();
    await dispatch(state, gateway);
    expect(gateway.client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(state.command.invalidReason).toBe('GATEWAY_WINDOW_EXPIRED');
  });

  it('keeps a normal unknown retry on the logical key', async () => {
    const state = live({ status: 'OUTCOME_UNKNOWN', messageStatus: 'OUTCOME_UNKNOWN' });
    const gateway = ambiguousGateway();
    await dispatch(state, gateway);
    expect(gateway.keys).toEqual([JOB.idempotencyKey]);
  });

  it.each(['SENT', 'DELIVERED', 'READ'])(
    'does not send a repair generation that is already %s',
    async (messageStatus) => {
      const state = live({
        repair: true,
        status: 'OUTCOME_UNKNOWN',
        messageStatus,
        ref: { id: 'ref-1' },
      });
      const gateway = ambiguousGateway();
      await dispatch(state, gateway);
      expect(gateway.client.sendAccountTextMessage).not.toHaveBeenCalled();
    },
  );

  it('does not send while another worker holds the dispatch claim', async () => {
    const state = live({ repair: true, token: 'worker-a' });
    const gateway = ambiguousGateway();
    await dispatch(state, gateway);
    expect(gateway.client.sendAccountTextMessage).not.toHaveBeenCalled();
  });

  it('reconciles an expired repair unknown without enqueue', async () => {
    const state = live({
      repair: true,
      status: 'OUTCOME_UNKNOWN',
      messageStatus: 'OUTCOME_UNKNOWN',
      firstAttemptAt: hoursAgo(25),
    });
    state.command.nextReconcileAt = hoursAgo(1);
    const prisma = memoryPrisma(state);
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.manualReview).toBe(1);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(state.command.invalidReason).toBe('GATEWAY_WINDOW_EXPIRED');
  });
});
