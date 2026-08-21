import type { ActorContext } from '../actor';
import type { AgentGrantedScope, AiResourceTarget } from './agent-scope';
import type { AiCapabilityDefinition, AiDataClassification } from './capability-types';

export const AI_POLICY_OUTCOMES = ['ALLOW', 'DENY', 'REQUIRE_APPROVAL'] as const;

export type AiPolicyOutcome = (typeof AI_POLICY_OUTCOMES)[number];

/**
 * Internal denial reasons. Detailed enough for operators, never returned raw to
 * a machine client — `03-External-Agent-Access.md` forbids leaking the
 * existence of unauthorized records.
 */
export const AI_POLICY_DENY_REASONS = [
  'ACTOR_NOT_SUPPORTED',
  'AGENT_DISABLED',
  'AGENT_REVOKED',
  'AGENT_EXPIRED',
  'CREDENTIAL_INVALID',
  'CREDENTIAL_REVOKED',
  'CREDENTIAL_EXPIRED',
  'CAPABILITY_UNKNOWN',
  'CAPABILITY_DEPRECATED',
  'CAPABILITY_NOT_GRANTED',
  'CAPABILITY_GRANT_EXPIRED',
  'CAPABILITY_GRANT_REVOKED',
  'SCOPE_TYPE_NOT_ALLOWED',
  'RESOURCE_OUT_OF_SCOPE',
  'MODULE_RESTRICTED',
  'DATA_CLASSIFICATION_FORBIDDEN',
  'DATA_CLASSIFICATION_UNKNOWN',
  'RISK_NOT_PERMITTED',
  'RATE_LIMITED',
] as const;

export type AiPolicyDenyReason = (typeof AI_POLICY_DENY_REASONS)[number];

export const AI_AGENT_STATES = ['ACTIVE', 'DISABLED', 'REVOKED', 'EXPIRED'] as const;

export type AiAgentState = (typeof AI_AGENT_STATES)[number];

export const AI_CREDENTIAL_STATES = ['ACTIVE', 'REVOKED', 'EXPIRED', 'INVALID'] as const;

export type AiCredentialState = (typeof AI_CREDENTIAL_STATES)[number];

export interface AiCapabilityGrantState {
  capabilityKey: string;
  revoked: boolean;
  expired: boolean;
}

/**
 * Everything the evaluator is allowed to consider. Task/document/message
 * content is deliberately absent: untrusted content can never alter a decision.
 */
export interface AiPolicyRequest {
  actor: ActorContext;
  capabilityKey: string;
  capability: AiCapabilityDefinition | null;
  agentState: AiAgentState;
  credentialState: AiCredentialState;
  grant: AiCapabilityGrantState | null;
  scopes: readonly AgentGrantedScope[];
  target: AiResourceTarget;
  /** Classification of the concrete resource, when the caller knows it. */
  targetDataClassification?: AiDataClassification | null;
  /** Modules disabled for this actor by higher-level configuration. */
  restrictedModules?: readonly string[];
  /** Highest risk class this actor may invoke. Defaults to MEDIUM. */
  maxRiskClass?: AiCapabilityDefinition['risk'];
  rateLimitExceeded?: boolean;
  approvalGranted?: boolean;
}

export interface AiPolicyAllowDecision {
  outcome: 'ALLOW';
  capability: AiCapabilityDefinition;
  matchedScope: AgentGrantedScope;
}

export interface AiPolicyDenyDecision {
  outcome: 'DENY';
  reason: AiPolicyDenyReason;
}

export interface AiPolicyApprovalDecision {
  outcome: 'REQUIRE_APPROVAL';
  capability: AiCapabilityDefinition;
  matchedScope: AgentGrantedScope;
}

export type AiPolicyDecision =
  | AiPolicyAllowDecision
  | AiPolicyDenyDecision
  | AiPolicyApprovalDecision;

export function isAllowDecision(decision: AiPolicyDecision): decision is AiPolicyAllowDecision {
  return decision.outcome === 'ALLOW';
}
