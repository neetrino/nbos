import type { PrismaClient } from '@nbos/database';
import type { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { FINANCE_REMINDER_SENDER_NAME } from './messenger-core-attention.constants';
import { persistCoreMessage } from './messenger-core-message.ops';
import {
  offerWhatsAppCoreSendJob,
  whatsAppCoreSendJobFromMessage,
} from './messenger-wa-outbound.ops';
import { resolveClientDestination } from './product-communication-resolver';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type FinanceClientReminderDelivery = {
  conversationId: string;
  messageId: string;
  groupChatId: string;
};

/**
 * Persist a SYSTEM FINANCE reminder into the resolved Client conversation, then
 * enqueue Slice 8 Core outbound. Official accountant send is a different path.
 */
export async function deliverFinanceClientReminder(
  prisma: PrismaLike,
  outbound: WhatsAppOutboundQueueService | undefined,
  input: { productId: string; text: string; idempotencyKey: string },
): Promise<FinanceClientReminderDelivery | null> {
  const destination = await resolveClientDestination(prisma, input.productId, 'FINANCE');
  if (!destination) return null;
  const mapping = {
    externalAccountId: destination.accountId,
    externalConversationId: destination.groupChatId,
  };
  const message = await persistCoreMessage(
    prisma,
    {
      conversationId: destination.conversationId,
      senderId: null,
      senderNameSnapshot: FINANCE_REMINDER_SENDER_NAME,
      content: input.text,
      direction: 'OUTBOUND',
      provenance: 'SYSTEM',
      status: 'QUEUED',
      idempotencyKey: input.idempotencyKey,
    },
    [],
    { mapping },
  );
  await offerWhatsAppCoreSendJob(outbound, whatsAppCoreSendJobFromMessage(message, mapping));
  return {
    conversationId: destination.conversationId,
    messageId: message.id,
    groupChatId: destination.groupChatId,
  };
}
