import {
  actorContextFromMachine,
  actorContextFromUserId,
  isMachineActorType,
  type ActorContext,
  type ActorType,
} from '@nbos/shared';
import type { AiApprovalRequestRow } from './ai-approval-request.mapper';

export function requesterAuditActor(
  row: Pick<AiApprovalRequestRow, 'requesterActorType' | 'requesterActorId'>,
): ActorContext {
  const actorType = row.requesterActorType as ActorType;
  if (isMachineActorType(actorType)) {
    return actorContextFromMachine(
      { id: row.requesterActorId, type: actorType, displayName: 'AI actor' },
      { channel: { source: 'system' } },
    );
  }
  return actorContextFromUserId(row.requesterActorId, { channel: { source: 'web' } });
}
