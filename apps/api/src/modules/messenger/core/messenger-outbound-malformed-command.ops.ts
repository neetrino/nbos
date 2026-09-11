import type { PrismaClient } from '@nbos/database';
import { runMessengerWriteTx } from './messenger-core-revision-tx';
import {
  MESSENGER_AUDIT_EXTERNAL_SEND_INVALID,
  messengerSchedulerAuditActor,
  writeMessengerExternalSendAudit,
} from './messenger-outbound-audit';
import {
  type CanonicalWhatsAppCommand,
  isCanonicalCommandTerminal,
  tryCanonicalWhatsAppSendJob,
} from './messenger-outbound-command-canonical';
import { CLEAR_DISPATCH_CLAIM } from './messenger-outbound-command-claim';
import { lockAndAuthorizeCommand } from './messenger-outbound-command-lock';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

/**
 * Scheduler-only. Terminalizes a persisted malformed command without
 * trusting or mutating any MessengerMessage.
 */
export async function invalidateSchedulerMalformedCommand(
  prisma: PrismaLike,
  snapshot: CanonicalWhatsAppCommand,
  now = new Date(),
): Promise<boolean> {
  if (isCanonicalCommandTerminal(snapshot)) return false;
  return runMessengerWriteTx(prisma, (tx) => persistMalformedCommandInvalid(tx, snapshot, now));
}

async function persistMalformedCommandInvalid(
  prisma: PrismaLike,
  snapshot: CanonicalWhatsAppCommand,
  now: Date,
): Promise<boolean> {
  const live = await lockAndAuthorizeCommand(
    prisma,
    { id: snapshot.id, idempotencyKey: snapshot.idempotencyKey },
    { kind: 'scheduler', snapshot },
    now,
  );
  if (!live || isCanonicalCommandTerminal(live)) return false;
  if (tryCanonicalWhatsAppSendJob(live)) return false;
  await prisma.messengerCommand.update({
    where: { id: live.id },
    data: {
      status: 'FAILED',
      errorCode: MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
      invalidReason: MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
      completedAt: now,
      nextReconcileAt: null,
      ...CLEAR_DISPATCH_CLAIM,
    },
  });
  await writeMessengerExternalSendAudit(prisma, {
    messageId: live.resultMessageId ?? live.id,
    conversationId: live.conversationId ?? live.id,
    action: MESSENGER_AUDIT_EXTERNAL_SEND_INVALID,
    actor: messengerSchedulerAuditActor(),
    commandStatus: 'FAILED',
    invalidReason: MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
    errorCode: MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
  });
  return true;
}
