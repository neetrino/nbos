import { PrismaClient } from '@nbos/database';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { parseWhatsAppSendCommandPayload } from './messenger-core-command-payload';
import {
  reconcileMessengerOutboundCommands,
  type DrainQueue,
} from './messenger-outbound-reconcile.ops';
import { scheduleWhatsAppUnknownReconcile } from './messenger-wa-outbound-complete.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

type PendingCoreSendRow = {
  conversationId: string | null;
  resultMessageId: string | null;
  idempotencyKey: string;
  payload: unknown;
};

/** Enqueue PENDING and eligible OUTCOME_UNKNOWN WhatsApp Core sends. */
export async function drainPendingWhatsAppCoreSends(
  prisma: PrismaLike,
  queue: DrainQueue,
): Promise<number> {
  const result = await reconcileMessengerOutboundCommands(prisma, queue);
  return result.enqueued;
}

/** @deprecated Use scheduleWhatsAppUnknownReconcile. completedAt stays terminal. */
export async function bumpWhatsAppUnknownReconcileClock(
  prisma: PrismaLike,
  idempotencyKey: string,
): Promise<void> {
  await scheduleWhatsAppUnknownReconcile(prisma, idempotencyKey);
}

export function parsePendingCoreSend(row: PendingCoreSendRow): WhatsAppCoreSendJobPayload | null {
  if (!row.conversationId || !row.resultMessageId) return null;
  const payload = parseWhatsAppSendCommandPayload(row.payload);
  if (!payload) return null;
  return {
    kind: 'core_client_send',
    chatId: payload.chatId,
    accountId: payload.accountId,
    messageId: row.resultMessageId,
    conversationId: row.conversationId,
    idempotencyKey: row.idempotencyKey,
  };
}
