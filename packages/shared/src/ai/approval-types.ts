import type { ActorType } from '../actor';
import type { AiRiskClass } from './capability-types';

export const AI_APPROVAL_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'CONSUMED',
] as const;

export type AiApprovalStatus = (typeof AI_APPROVAL_STATUSES)[number];

export const AI_APPROVAL_DECISION_ACTIONS = ['APPROVE', 'REJECT', 'CANCEL'] as const;

export type AiApprovalDecisionAction = (typeof AI_APPROVAL_DECISION_ACTIONS)[number];

/**
 * One-time approvals expire by risk. These windows are the Phase 1 default,
 * not a reusable blanket grant. Raising them lengthens the period a captured
 * approval can still be consumed.
 */
export const AI_APPROVAL_TTL_MS: Record<AiRiskClass, number> = {
  LOW: 24 * 60 * 60 * 1_000,
  MEDIUM: 24 * 60 * 60 * 1_000,
  HIGH: 8 * 60 * 60 * 1_000,
  CRITICAL: 60 * 60 * 1_000,
};

export const AI_APPROVAL_SUMMARY_MAX_CHARS = 500;

export const AI_APPROVAL_REASON_MAX_CHARS = 500;

export const AI_APPROVAL_RESOURCE_TYPES = ['TASK', 'CONVERSATION', 'FILE', 'OTHER'] as const;

export type AiApprovalResourceType = (typeof AI_APPROVAL_RESOURCE_TYPES)[number];

export function isAiApprovalStatus(value: string): value is AiApprovalStatus {
  return (AI_APPROVAL_STATUSES as readonly string[]).includes(value);
}

export interface AiApprovalActorRef {
  actorType: ActorType;
  actorId: string;
}

export interface AiApprovalResourceRef {
  resourceType: string;
  resourceId: string;
  scopeType?: string | null;
  scopeId?: string | null;
}

/** Persistence/view contract. Full payload is never stored — only digest + summary. */
export interface AiApprovalRequestRecord {
  id: string;
  requester: AiApprovalActorRef;
  onBehalfOf: AiApprovalActorRef | null;
  capabilityKey: string;
  resource: AiApprovalResourceRef;
  payloadDigest: string;
  safePayloadSummary: string;
  riskClass: AiRiskClass;
  status: AiApprovalStatus;
  requestedAt: Date;
  expiresAt: Date;
  decidedByEmployeeId: string | null;
  decidedAt: Date | null;
  decisionReason: string | null;
  consumedAt: Date | null;
  correlationId: string | null;
}
