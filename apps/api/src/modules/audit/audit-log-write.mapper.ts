import type { AuditActorTypeEnum, InputJsonValue } from '@nbos/database';
import {
  actorContextFromUserId,
  ActorContextError,
  legacyUserIdFromActor,
  normalizeActorContext,
  type ActorContext,
} from '@nbos/shared';
import { toAuditClientMetadataJson } from './audit-client-metadata';
import { redactAuditChanges } from './audit-changes-redact';
import type { AuditLogParams } from './audit-log.params';

export interface AuditLogCreateData {
  entityType: string;
  entityId: string;
  action: string;
  userId: string | null;
  actorType: AuditActorTypeEnum;
  actorId: string;
  onBehalfOfType: AuditActorTypeEnum | null;
  onBehalfOfId: string | null;
  channel: string | null;
  protocol: string | null;
  correlationId: string | null;
  clientMetadata: InputJsonValue | undefined;
  changes: InputJsonValue | undefined;
  ipAddress: string | undefined;
  projectId: string | undefined;
}

export function resolveAuditWriteContext(params: AuditLogParams): ActorContext {
  if (!params.actor && !params.userId) {
    throw new ActorContextError('Audit log requires actor or userId');
  }
  const context = params.actor
    ? normalizeActorContext(params.actor)
    : actorContextFromUserId(params.userId as string);
  if (
    params.actor &&
    params.userId &&
    context.actor.type === 'USER' &&
    params.userId !== context.actor.id
  ) {
    throw new ActorContextError('userId does not match USER actor id');
  }
  return context;
}

export function toAuditLogCreateData(params: AuditLogParams): AuditLogCreateData {
  const context = resolveAuditWriteContext(params);
  const onBehalfOf = context.onBehalfOf;
  return {
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    userId: legacyUserIdFromActor(context),
    actorType: context.actor.type,
    actorId: context.actor.id,
    onBehalfOfType: onBehalfOf?.type ?? null,
    onBehalfOfId: onBehalfOf?.id ?? null,
    channel: context.channel?.source ?? null,
    protocol: context.channel?.protocol ?? null,
    correlationId: context.correlationId ?? context.requestId ?? null,
    clientMetadata: toAuditClientMetadataJson(context),
    changes: redactAuditChanges(params.changes),
    ipAddress: params.ipAddress ?? context.client?.ipAddress ?? undefined,
    projectId: params.projectId,
  };
}
