import type { AiAgentState, AiCredentialState, AiScopeType } from '@nbos/shared';
import {
  resolveAgentState,
  resolveCredentialState,
  type AgentStateSource,
  type CredentialStateSource,
} from './external-agent-state';

export interface ExternalAgentView {
  id: string;
  name: string;
  description: string | null;
  state: AiAgentState;
  ownerId: string;
  createdById: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  lastUsedChannel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ExternalAgentRow = AgentStateSource & Omit<ExternalAgentView, 'state'>;

export function toExternalAgentView(agent: ExternalAgentRow, now: Date): ExternalAgentView {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    state: resolveAgentState(agent, now),
    ownerId: agent.ownerId,
    createdById: agent.createdById,
    expiresAt: agent.expiresAt,
    revokedAt: agent.revokedAt,
    lastUsedAt: agent.lastUsedAt,
    lastUsedIp: agent.lastUsedIp,
    lastUsedChannel: agent.lastUsedChannel,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  };
}

/**
 * Credential projection for admin APIs and UI.
 * `secretHash` is intentionally absent — the verifier must never leave the server.
 */
export interface AgentCredentialView {
  id: string;
  agentId: string;
  keyId: string;
  tokenPrefix: string;
  label: string | null;
  state: AiCredentialState;
  expiresAt: Date | null;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  rotatedFromId: string | null;
  createdAt: Date;
}

type AgentCredentialRow = CredentialStateSource & Omit<AgentCredentialView, 'state'>;

export function toAgentCredentialView(
  credential: AgentCredentialRow,
  now: Date,
): AgentCredentialView {
  return {
    id: credential.id,
    agentId: credential.agentId,
    keyId: credential.keyId,
    tokenPrefix: credential.tokenPrefix,
    label: credential.label,
    state: resolveCredentialState(credential, now),
    expiresAt: credential.expiresAt,
    revokedAt: credential.revokedAt,
    lastUsedAt: credential.lastUsedAt,
    rotatedFromId: credential.rotatedFromId,
    createdAt: credential.createdAt,
  };
}

/** Returned exactly once, at issuance or rotation. */
export interface IssuedAgentCredential {
  credential: AgentCredentialView;
  /** Raw bearer token. Never persisted, never logged, never audited. */
  token: string;
}

export interface AgentCapabilityGrantView {
  id: string;
  agentId: string;
  capabilityKey: string;
  reason: string | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export function toAgentCapabilityGrantView(
  grant: AgentCapabilityGrantView,
): AgentCapabilityGrantView {
  return {
    id: grant.id,
    agentId: grant.agentId,
    capabilityKey: grant.capabilityKey,
    reason: grant.reason,
    expiresAt: grant.expiresAt,
    revokedAt: grant.revokedAt,
    createdAt: grant.createdAt,
  };
}

export interface AgentResourceScopeView {
  id: string;
  agentId: string;
  scopeType: AiScopeType;
  scopeId: string;
  resourceType: string | null;
  reason: string | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export function toAgentResourceScopeView(scope: AgentResourceScopeView): AgentResourceScopeView {
  return {
    id: scope.id,
    agentId: scope.agentId,
    scopeType: scope.scopeType,
    scopeId: scope.scopeId,
    resourceType: scope.resourceType,
    reason: scope.reason,
    expiresAt: scope.expiresAt,
    revokedAt: scope.revokedAt,
    createdAt: scope.createdAt,
  };
}
