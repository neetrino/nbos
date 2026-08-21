import type { ActorChannel, ActorContext, ActorContextInput, ActorIdentity } from './actor-context';
import {
  ACTOR_TYPE_DISPLAY_NAME,
  isActorChannelSource,
  isActorType,
  isEmployeeActorType,
  isMachineActorType,
  type ActorType,
} from './actor-types';

export class ActorContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActorContextError';
  }
}

function requiredId(value: string | undefined, field: string): string {
  const id = value?.trim();
  if (!id) {
    throw new ActorContextError(`${field} is required`);
  }
  return id;
}

function resolveDisplayName(type: ActorType, displayName: string | undefined): string {
  const trimmed = displayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : ACTOR_TYPE_DISPLAY_NAME[type];
}

function normalizeIdentity(input: ActorContextInput['actor'], field: string): ActorIdentity {
  const id = requiredId(input.id, `${field}.id`);
  if (!isActorType(input.type)) {
    throw new ActorContextError(`${field}.type is not a supported ActorType`);
  }
  return {
    id,
    type: input.type,
    displayName: resolveDisplayName(input.type, input.displayName),
  };
}

function normalizeOnBehalfOf(
  onBehalfOf: ActorContextInput['onBehalfOf'],
): ActorContext['onBehalfOf'] {
  if (!onBehalfOf) {
    return null;
  }
  return normalizeIdentity(onBehalfOf, 'onBehalfOf');
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeChannel(channel: ActorContextInput['channel']): ActorChannel | null {
  if (!channel) {
    return null;
  }
  const source = requiredId(channel.source, 'channel.source');
  if (!isActorChannelSource(source)) {
    throw new ActorContextError('channel.source is not a supported ActorChannelSource');
  }
  return { source, protocol: normalizeOptionalText(channel.protocol) };
}

/**
 * Produce a policy/audit-safe ActorContext. Rejects unknown types and empty ids.
 */
export function normalizeActorContext(input: ActorContextInput): ActorContext {
  const actor = normalizeIdentity(input.actor, 'actor');
  return {
    actor,
    organizationId: normalizeOptionalText(input.organizationId),
    onBehalfOf: normalizeOnBehalfOf(input.onBehalfOf),
    channel: normalizeChannel(input.channel),
    correlationId: normalizeOptionalText(input.correlationId),
    requestId: normalizeOptionalText(input.requestId),
    client: input.client ?? null,
  };
}

export function actorContextFromEmployee(
  employee: { id: string; firstName?: string | null; lastName?: string | null },
  extras: Omit<ActorContextInput, 'actor'> = {},
): ActorContext {
  const displayName = [employee.firstName, employee.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return normalizeActorContext({
    ...extras,
    actor: { id: employee.id, type: 'USER', displayName },
  });
}

export function actorContextFromMachine(
  actor: { id: string; type: ActorType; displayName?: string },
  extras: Omit<ActorContextInput, 'actor'> = {},
): ActorContext {
  if (!isMachineActorType(actor.type)) {
    throw new ActorContextError('Machine actor helper cannot create a USER actor');
  }
  return normalizeActorContext({
    ...extras,
    actor: { id: actor.id, type: actor.type, displayName: actor.displayName },
  });
}

export function actorContextFromUserId(
  userId: string,
  extras: Omit<ActorContextInput, 'actor'> = {},
): ActorContext {
  return normalizeActorContext({
    ...extras,
    actor: { id: userId, type: 'USER' },
  });
}

/** Legacy AuditLog.userId is set only for real employees. */
export function legacyUserIdFromActor(context: ActorContext): string | null {
  return isEmployeeActorType(context.actor.type) ? context.actor.id : null;
}
