import type { ActorContext } from '@nbos/shared';
import type { PrismaClient } from '@nbos/database';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { messengerWorkerAuditActor } from './messenger-outbound-audit';
import type { CanonicalWhatsAppCommand } from './messenger-outbound-command-canonical';
import type { DispatchOwnership } from './messenger-outbound-command-claim';
import type { MessengerDeliveryStatusPublisher } from './messenger-delivery-status.types';
import { markWhatsAppCommandInvalid } from './messenger-outbound-command-invalid.ops';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export function terminalMessageSkipReason(
  status: string | undefined,
):
  | typeof MESSENGER_COMMAND_INVALID_REASON.MESSAGE_CANCELLED
  | typeof MESSENGER_COMMAND_INVALID_REASON.MESSAGE_FAILED {
  if (status === 'CANCELLED') return MESSENGER_COMMAND_INVALID_REASON.MESSAGE_CANCELLED;
  return MESSENGER_COMMAND_INVALID_REASON.MESSAGE_FAILED;
}

export async function finalizeWhatsAppTerminalMessageSkip(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: Pick<WhatsAppCoreSendJobPayload, 'messageId' | 'conversationId' | 'idempotencyKey'>,
  ownership: DispatchOwnership,
  publisher?: MessengerDeliveryStatusPublisher,
  actor: ActorContext = messengerWorkerAuditActor(),
): Promise<void> {
  const message = await prisma.messengerMessage.findUnique({
    where: { id: job.messageId },
    select: { status: true },
  });
  await markWhatsAppCommandInvalid(
    prisma,
    command,
    job,
    terminalMessageSkipReason(message?.status),
    actor,
    publisher,
    ownership,
  );
}
