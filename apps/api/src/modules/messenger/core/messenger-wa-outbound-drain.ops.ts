import { PrismaClient } from '@nbos/database';
import {
  WHATSAPP_CORE_PENDING_DRAIN_BATCH_SIZE,
  WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX,
  WHATSAPP_CORE_UNKNOWN_RECONCILE_MS,
} from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

type DrainQueue = {
  isAvailable(): boolean;
  enqueue(payload: WhatsAppCoreSendJobPayload, wait: boolean): Promise<void>;
};

type PendingCoreSendRow = {
  conversationId: string | null;
  resultMessageId: string | null;
  idempotencyKey: string;
  payload: unknown;
};

const DRAIN_SELECT = {
  conversationId: true,
  resultMessageId: true,
  idempotencyKey: true,
  payload: true,
} as const;

/** Enqueue PENDING and eligible OUTCOME_UNKNOWN WhatsApp Core sends. */
export async function drainPendingWhatsAppCoreSends(
  prisma: PrismaLike,
  queue: DrainQueue,
): Promise<number> {
  if (!queue.isAvailable()) return 0;
  const pending = await loadPendingCoreSends(prisma);
  const pendingCount = await enqueueDrainCoreSends(queue, pending);
  const unknown = await loadUnknownCoreSends(prisma);
  const unknownCount = await enqueueUnknownCoreSends(prisma, queue, unknown);
  return pendingCount + unknownCount;
}

async function loadPendingCoreSends(prisma: PrismaLike): Promise<PendingCoreSendRow[]> {
  return prisma.messengerCommand.findMany({
    where: {
      kind: 'SEND_MESSAGE',
      status: 'PENDING',
      idempotencyKey: { startsWith: WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX },
    },
    take: WHATSAPP_CORE_PENDING_DRAIN_BATCH_SIZE,
    select: DRAIN_SELECT,
  });
}

async function loadUnknownCoreSends(prisma: PrismaLike): Promise<PendingCoreSendRow[]> {
  const cutoff = new Date(Date.now() - WHATSAPP_CORE_UNKNOWN_RECONCILE_MS);
  return prisma.messengerCommand.findMany({
    where: {
      kind: 'SEND_MESSAGE',
      status: 'OUTCOME_UNKNOWN',
      idempotencyKey: { startsWith: WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX },
      completedAt: { lte: cutoff },
      resultMessage: {
        is: { externalRefs: { none: { provider: 'WHATSAPP' } } },
      },
    },
    take: WHATSAPP_CORE_PENDING_DRAIN_BATCH_SIZE,
    select: DRAIN_SELECT,
  });
}

async function enqueueDrainCoreSends(
  queue: DrainQueue,
  rows: PendingCoreSendRow[],
): Promise<number> {
  let enqueued = 0;
  for (const row of rows) {
    const payload = parsePendingCoreSend(row);
    if (!payload) continue;
    await queue.enqueue(payload, false);
    enqueued += 1;
  }
  return enqueued;
}

async function enqueueUnknownCoreSends(
  prisma: PrismaLike,
  queue: DrainQueue,
  rows: PendingCoreSendRow[],
): Promise<number> {
  let enqueued = 0;
  for (const row of rows) {
    const payload = parsePendingCoreSend(row);
    if (!payload) continue;
    await bumpWhatsAppUnknownReconcileClock(prisma, row.idempotencyKey);
    await queue.enqueue(payload, false);
    enqueued += 1;
  }
  return enqueued;
}

/** Advance completedAt so unknown drain cannot re-enqueue every worker process(). */
export async function bumpWhatsAppUnknownReconcileClock(
  prisma: PrismaLike,
  idempotencyKey: string,
): Promise<void> {
  await prisma.messengerCommand.updateMany({
    where: { idempotencyKey, status: 'OUTCOME_UNKNOWN' },
    data: { completedAt: new Date() },
  });
}

export function parsePendingCoreSend(row: PendingCoreSendRow): WhatsAppCoreSendJobPayload | null {
  if (!row.conversationId || !row.resultMessageId) return null;
  if (!row.payload || typeof row.payload !== 'object' || Array.isArray(row.payload)) return null;
  const record = row.payload as Record<string, unknown>;
  const accountId = typeof record.accountId === 'string' ? record.accountId : '';
  const chatId = typeof record.chatId === 'string' ? record.chatId : '';
  if (!accountId || !chatId) return null;
  return {
    kind: 'core_client_send',
    chatId,
    accountId,
    messageId: row.resultMessageId,
    conversationId: row.conversationId,
    idempotencyKey: row.idempotencyKey,
  };
}
