import type { PrismaClient } from '@nbos/database';
import type { WhatsAppCoreSendJobPayload } from '../../integrations/whatsapp-gateway/whatsapp-outbound.types';
import { runMessengerWriteTx } from './messenger-core-revision-tx';
import { messengerWorkerAuditActor } from './messenger-outbound-audit';
import type { CanonicalWhatsAppCommand } from './messenger-outbound-command-canonical';
import type { MessengerDeliveryStatusPublisher } from './messenger-delivery-status.types';
import { reduceWhatsAppOutboundOutcome } from './messenger-outbound-outcome-reducer';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function repairWhatsAppRefProof(
  prisma: PrismaLike,
  command: CanonicalWhatsAppCommand,
  job: WhatsAppCoreSendJobPayload,
  publisher?: MessengerDeliveryStatusPublisher,
  actor = messengerWorkerAuditActor(),
): Promise<boolean> {
  const result = await runMessengerWriteTx(prisma, (tx) =>
    reduceWhatsAppOutboundOutcome(tx, command, job, { kind: 'proof' }, { type: 'complete' }, actor),
  );
  if (result.published) {
    await publisher?.publish({
      conversationId: job.conversationId,
      messageId: job.messageId,
      status: result.published,
      occurredAt: new Date().toISOString(),
    });
  }
  return result.won;
}
