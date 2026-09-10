import { PrismaClient, type MessengerMessageStatus } from '@nbos/database';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { parseWhatsAppSendCommandPayload } from './messenger-core-command-payload';
import {
  MESSENGER_COMMAND_INVALID_REASON,
  type MessengerCommandInvalidReason,
} from './messenger-outbound-reconcile.constants';
import { findClientWhatsAppMapping } from './messenger-wa-outbound.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

const RECOVER_REF_STATUSES: readonly MessengerMessageStatus[] = [
  'SENT',
  'DELIVERED',
  'READ',
  'OUTCOME_UNKNOWN',
];

export type PreparedWhatsAppCoreSend =
  | { kind: 'skip' }
  | { kind: 'repair' }
  | { kind: 'invalid'; reason: MessengerCommandInvalidReason }
  | {
      kind: 'ready';
      message: { id: string; content: string; status: MessengerMessageStatus };
      accountId: string;
      chatId: string;
      recovering: boolean;
    };

export async function prepareWhatsAppCoreSend(
  prisma: PrismaLike,
  job: WhatsAppCoreSendJobPayload,
): Promise<PreparedWhatsAppCoreSend> {
  const payload = parseWhatsAppSendCommandPayload({
    accountId: job.accountId,
    chatId: job.chatId,
  });
  if (!payload) {
    return { kind: 'invalid', reason: MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD };
  }
  const message = await prisma.messengerMessage.findUnique({
    where: { id: job.messageId },
    select: {
      id: true,
      conversationId: true,
      content: true,
      status: true,
      deletedAt: true,
      conversation: { select: { zone: true } },
    },
  });
  const invalid = classifyLoadedSendMessage(message, job.conversationId);
  if (invalid) return invalid;
  if (!message) {
    return { kind: 'invalid', reason: MESSENGER_COMMAND_INVALID_REASON.MISSING_MESSAGE };
  }
  const mapping = await findClientWhatsAppMapping(prisma, job.conversationId);
  if (!mapping) return { kind: 'invalid', reason: MESSENGER_COMMAND_INVALID_REASON.NON_WHATSAPP };
  if (
    mapping.externalAccountId !== payload.accountId ||
    mapping.externalConversationId !== payload.chatId
  ) {
    return { kind: 'invalid', reason: MESSENGER_COMMAND_INVALID_REASON.FORGED_ROUTING };
  }
  const hasRef = await hasWhatsAppOutboundRef(prisma, message.id);
  if (hasRef) return { kind: 'repair' };
  if (message.status === 'CANCELLED' || message.status === 'FAILED') return { kind: 'skip' };
  return {
    kind: 'ready',
    message: { id: message.id, content: message.content, status: message.status },
    accountId: mapping.externalAccountId,
    chatId: mapping.externalConversationId,
    recovering: !hasRef && RECOVER_REF_STATUSES.includes(message.status),
  };
}

function classifyLoadedSendMessage(
  message: {
    conversationId: string;
    deletedAt: Date | null;
    conversation: { zone: string };
  } | null,
  conversationId: string,
): Extract<PreparedWhatsAppCoreSend, { kind: 'invalid' }> | null {
  if (!message) {
    return { kind: 'invalid', reason: MESSENGER_COMMAND_INVALID_REASON.MISSING_MESSAGE };
  }
  if (message.deletedAt) {
    return { kind: 'invalid', reason: MESSENGER_COMMAND_INVALID_REASON.DELETED_MESSAGE };
  }
  if (message.conversationId !== conversationId) {
    return { kind: 'invalid', reason: MESSENGER_COMMAND_INVALID_REASON.CONVERSATION_MISMATCH };
  }
  if (message.conversation.zone !== 'CLIENT') {
    return { kind: 'invalid', reason: MESSENGER_COMMAND_INVALID_REASON.NON_CLIENT };
  }
  return null;
}

async function hasWhatsAppOutboundRef(prisma: PrismaLike, messageId: string): Promise<boolean> {
  const row = await prisma.messengerMessageExternalRef.findFirst({
    where: { messageId, provider: 'WHATSAPP' },
    select: { id: true },
  });
  return row !== null;
}
