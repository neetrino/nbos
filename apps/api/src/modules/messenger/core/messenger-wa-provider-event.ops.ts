import { PrismaClient, classifyDatabaseError, type InputJsonValue } from '@nbos/database';
import type { NormalizedWhatsAppWebhook } from '../../integrations/whatsapp-gateway/whatsapp-gateway-webhook.types';
import { isRetryableWhatsAppLifecycleSkip } from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function claimWhatsAppProviderEvent(
  prisma: PrismaLike,
  event: NormalizedWhatsAppWebhook,
): Promise<{ id: string; dispatch: boolean }> {
  try {
    const created = await prisma.messengerProviderEvent.create({
      data: {
        provider: 'WHATSAPP',
        eventId: event.eventId,
        externalAccountId: event.accountId,
        eventType: event.type,
        status: 'RECEIVED',
        payload: webhookEventPayload(event),
      },
      select: { id: true },
    });
    return { id: created.id, dispatch: true };
  } catch (error) {
    if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    const existing = await prisma.messengerProviderEvent.findUnique({
      where: { provider_eventId: { provider: 'WHATSAPP', eventId: event.eventId } },
      select: { id: true, status: true },
    });
    if (!existing) throw error;
    return { id: existing.id, dispatch: existing.status === 'RECEIVED' };
  }
}

export async function markWhatsAppProviderEvent(
  prisma: PrismaLike,
  id: string,
  handled: { skipReason: string | null; conversationId?: string; messageId?: string },
): Promise<void> {
  if (isRetryableWhatsAppLifecycleSkip(handled.skipReason)) return;
  await prisma.messengerProviderEvent.update({
    where: { id },
    data: {
      status: handled.skipReason ? 'SKIPPED' : 'PROCESSED',
      skipReason: handled.skipReason,
      conversationId: handled.conversationId || null,
      messageId: handled.messageId ?? null,
      processedAt: new Date(),
    },
  });
}

function webhookEventPayload(event: NormalizedWhatsAppWebhook): InputJsonValue {
  return {
    type: event.type,
    accountId: event.accountId,
    chatId: event.chatId,
    providerMessageId: event.providerMessageId,
    fromMe: event.fromMe,
    sessionStatus: event.sessionStatus,
  };
}
