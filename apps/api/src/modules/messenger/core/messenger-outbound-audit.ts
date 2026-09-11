import { actorContextFromMachine, type ActorContext } from '@nbos/shared';
import { toAuditLogCreateData } from '../../audit/audit-log-write.mapper';
import type { PrismaClient } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export const MESSENGER_AUDIT_ENTITY_MESSAGE = 'messenger_message';
export const MESSENGER_AUDIT_EXTERNAL_SEND_INTENDED = 'messenger.external_send_intended';
export const MESSENGER_AUDIT_EXTERNAL_SEND_COMPLETED = 'messenger.external_send_completed';
export const MESSENGER_AUDIT_EXTERNAL_SEND_FAILED = 'messenger.external_send_failed';
export const MESSENGER_AUDIT_EXTERNAL_SEND_UNKNOWN = 'messenger.external_send_outcome_unknown';
export const MESSENGER_AUDIT_EXTERNAL_SEND_INVALID = 'messenger.external_send_invalid';
export const MESSENGER_AUDIT_EXTERNAL_SEND_PAYLOAD_CONFLICT =
  'messenger.external_send_payload_conflict';

export const MESSENGER_AUDIT_ACTOR_SYSTEM = 'messenger.system';
export const MESSENGER_AUDIT_ACTOR_WORKER = 'messenger.outbound-worker';
export const MESSENGER_AUDIT_ACTOR_SCHEDULER = 'scheduler.messenger-outbound-reconcile';
export const MESSENGER_AUDIT_ACTOR_GATEWAY = 'messenger.whatsapp-gateway';

export function messengerSystemAuditActor(): ActorContext {
  return actorContextFromMachine({ id: MESSENGER_AUDIT_ACTOR_SYSTEM, type: 'SYSTEM' });
}

export function messengerWorkerAuditActor(): ActorContext {
  return actorContextFromMachine({ id: MESSENGER_AUDIT_ACTOR_WORKER, type: 'AUTOMATION' });
}

export function messengerSchedulerAuditActor(): ActorContext {
  return actorContextFromMachine({ id: MESSENGER_AUDIT_ACTOR_SCHEDULER, type: 'AUTOMATION' });
}

export function messengerGatewayAuditActor(): ActorContext {
  return actorContextFromMachine({ id: MESSENGER_AUDIT_ACTOR_GATEWAY, type: 'AUTOMATION' });
}

export async function writeMessengerExternalSendAudit(
  prisma: PrismaLike,
  input: {
    messageId: string;
    conversationId: string;
    action: string;
    actor?: ActorContext;
    userId?: string;
    commandStatus?: string;
    messageStatus?: string;
    errorCode?: string | null;
    invalidReason?: string | null;
  },
): Promise<void> {
  const actor = input.actor ?? (input.userId ? undefined : messengerSystemAuditActor());
  await prisma.auditLog.create({
    data: toAuditLogCreateData({
      entityType: MESSENGER_AUDIT_ENTITY_MESSAGE,
      entityId: input.messageId,
      action: input.action,
      userId: input.userId,
      actor,
      changes: {
        conversationId: input.conversationId,
        messageId: input.messageId,
        commandStatus: input.commandStatus ?? null,
        messageStatus: input.messageStatus ?? null,
        errorCode: input.errorCode ?? null,
        invalidReason: input.invalidReason ?? null,
      },
    }),
  });
}
