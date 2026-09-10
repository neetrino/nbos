import type { PrismaClient } from '@nbos/database';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import {
  MESSENGER_AUDIT_EXTERNAL_SEND_PAYLOAD_CONFLICT,
  messengerWorkerAuditActor,
  writeMessengerExternalSendAudit,
} from './messenger-outbound-audit';
import type { CanonicalWhatsAppCommand } from './messenger-outbound-command-canonical';

type PrismaLike = InstanceType<typeof PrismaClient>;

/** Job-scoped only. Never writes locked-command foreign ids. */
export async function recordWhatsAppSendIdentityConflict(
  prisma: PrismaLike,
  job: Pick<WhatsAppCoreSendJobPayload, 'messageId' | 'conversationId'>,
): Promise<void> {
  await writeMessengerExternalSendAudit(prisma, {
    messageId: job.messageId,
    conversationId: job.conversationId,
    action: MESSENGER_AUDIT_EXTERNAL_SEND_PAYLOAD_CONFLICT,
    actor: messengerWorkerAuditActor(),
    errorCode: 'PAYLOAD_MISMATCH',
  });
}

/** Operational warning only. Does not mutate command or message outcome. */
export async function recordWhatsAppSendPayloadConflict(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand | null,
  job: WhatsAppCoreSendJobPayload,
): Promise<void> {
  await writeMessengerExternalSendAudit(prisma, {
    messageId: command?.resultMessageId ?? job.messageId,
    conversationId: command?.conversationId ?? job.conversationId,
    action: MESSENGER_AUDIT_EXTERNAL_SEND_PAYLOAD_CONFLICT,
    actor: messengerWorkerAuditActor(),
    commandStatus: command?.status,
    errorCode: 'PAYLOAD_MISMATCH',
  });
}
