import type { AiAgentState, AiCapabilityGrantState, AiCredentialState } from '@nbos/shared';
import type { ExternalAgentStatusEnum } from '@nbos/database';

export interface AgentStateSource {
  status: ExternalAgentStatusEnum;
  expiresAt: Date | null;
  /** Set once, never cleared. Revocation is terminal. */
  revokedAt: Date | null;
}

export interface CredentialStateSource {
  revokedAt: Date | null;
  expiresAt: Date | null;
}

export interface GrantStateSource {
  capabilityKey: string;
  revokedAt: Date | null;
  expiresAt: Date | null;
}

/** True when the timestamp exists and has already elapsed. */
export function isTimestampPast(value: Date | null, now: Date): boolean {
  return value !== null && value.getTime() <= now.getTime();
}

const isPast = isTimestampPast;

/**
 * Effective agent state. Revocation wins over every other signal and is derived
 * from `revokedAt` as well as the status column, so a revoked agent can never be
 * walked back to ACTIVE by writing the status alone. Time-based expiry is then
 * applied, including when the stored status is still DISABLED, so a lapsed
 * actor cannot appear merely paused. An ACTIVE or DISABLED row past `expiresAt`
 * is EXPIRED without waiting for a sweeper job.
 */
export function resolveAgentState(agent: AgentStateSource, now: Date): AiAgentState {
  if (agent.status === 'REVOKED' || agent.revokedAt !== null) {
    return 'REVOKED';
  }
  if (agent.status === 'EXPIRED' || isPast(agent.expiresAt, now)) {
    return 'EXPIRED';
  }
  if (agent.status === 'DISABLED') {
    return 'DISABLED';
  }
  return 'ACTIVE';
}

export function isAgentUsable(agent: AgentStateSource, now: Date): boolean {
  return resolveAgentState(agent, now) === 'ACTIVE';
}

/** Revocation wins over expiry so a revoked credential never looks merely stale. */
export function resolveCredentialState(
  credential: CredentialStateSource,
  now: Date,
): AiCredentialState {
  if (credential.revokedAt !== null) {
    return 'REVOKED';
  }
  if (isPast(credential.expiresAt, now)) {
    return 'EXPIRED';
  }
  return 'ACTIVE';
}

export function resolveGrantState(grant: GrantStateSource, now: Date): AiCapabilityGrantState {
  return {
    capabilityKey: grant.capabilityKey,
    revoked: grant.revokedAt !== null,
    expired: isPast(grant.expiresAt, now),
  };
}

export function isGrantActive(grant: GrantStateSource, now: Date): boolean {
  const state = resolveGrantState(grant, now);
  return !state.revoked && !state.expired;
}
