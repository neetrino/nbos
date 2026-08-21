import type { ActorChannelSource } from '../actor/actor-types';

export const INTERNAL_AI_AGENT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'DISABLED',
  'ARCHIVED',
] as const;

export type InternalAiAgentStatus = (typeof INTERNAL_AI_AGENT_STATUSES)[number];

export const INTERNAL_AI_AGENT_SURFACES = [
  'EMPLOYEE_CHAT',
  'MESSENGER',
  'TASK',
  'DOCUMENT',
  'SCHEDULED',
  'SYSTEM_EVENT',
  'ADMIN_TEST',
] as const;

export type InternalAiAgentSurface = (typeof INTERNAL_AI_AGENT_SURFACES)[number];

export function isInternalAiAgentStatus(value: string): value is InternalAiAgentStatus {
  return (INTERNAL_AI_AGENT_STATUSES as readonly string[]).includes(value);
}

export function isInternalAiAgentSurface(value: string): value is InternalAiAgentSurface {
  return (INTERNAL_AI_AGENT_SURFACES as readonly string[]).includes(value);
}

/** Only ACTIVE agents may start a new execution. Pause/disable/archive block. */
export function canStartInternalAgentExecution(status: InternalAiAgentStatus): boolean {
  return status === 'ACTIVE';
}

/**
 * Maps an Internal Agent surface onto the ActorContext channel vocabulary.
 * Messenger is a first-class channel so customer-facing execution is not
 * silently recorded as `web`.
 */
export const INTERNAL_AI_SURFACE_CHANNEL: Record<InternalAiAgentSurface, ActorChannelSource> = {
  EMPLOYEE_CHAT: 'web',
  MESSENGER: 'messenger',
  TASK: 'web',
  DOCUMENT: 'web',
  SCHEDULED: 'scheduler',
  SYSTEM_EVENT: 'system',
  ADMIN_TEST: 'web',
};
