import type { ActorType } from '../actor';
import type { AiPolicyDecision } from './policy-decision';
import {
  assertApprovalConsumableStatus,
  type AiApprovalLifecycleDenial,
} from './approval-lifecycle';
import type { AiApprovalStatus } from './approval-types';

export type AiApprovalCommitDenial =
  | AiApprovalLifecycleDenial
  | 'PAYLOAD_CHANGED'
  | 'ACTOR_MISMATCH'
  | 'CAPABILITY_MISMATCH'
  | 'AUTHORIZATION_REVOKED'
  | 'DOMAIN_STATE_INVALID';

export interface AiApprovalCommitEvidence {
  status: AiApprovalStatus;
  expiresAt: Date;
  now: Date;
  storedPayloadDigest: string;
  proposedPayloadDigest: string;
  requesterActorType: ActorType;
  requesterActorId: string;
  capabilityKey: string;
  currentActorType: ActorType;
  currentActorId: string;
  currentCapabilityKey: string;
  policyDecision: AiPolicyDecision;
  domainStateValid: boolean;
}

/**
 * Revalidation immediately before an approved domain commit.
 * Approval is not a permanent authorization bypass.
 */
export function assertApprovedCommit(
  evidence: AiApprovalCommitEvidence,
): AiApprovalCommitDenial | null {
  const statusDenial = assertApprovalConsumableStatus(
    evidence.status,
    evidence.expiresAt,
    evidence.now,
  );
  if (statusDenial) {
    return statusDenial;
  }
  if (
    evidence.requesterActorId !== evidence.currentActorId ||
    evidence.requesterActorType !== evidence.currentActorType
  ) {
    return 'ACTOR_MISMATCH';
  }
  if (evidence.capabilityKey !== evidence.currentCapabilityKey) {
    return 'CAPABILITY_MISMATCH';
  }
  if (evidence.storedPayloadDigest !== evidence.proposedPayloadDigest) {
    return 'PAYLOAD_CHANGED';
  }
  if (!isFreshAllowForRequester(evidence)) {
    return 'AUTHORIZATION_REVOKED';
  }
  if (!evidence.domainStateValid) {
    return 'DOMAIN_STATE_INVALID';
  }
  return null;
}

function isFreshAllowForRequester(evidence: AiApprovalCommitEvidence): boolean {
  const decision = evidence.policyDecision;
  if (decision.outcome !== 'ALLOW') {
    return false;
  }
  return (
    decision.actorId === evidence.currentActorId &&
    decision.actorType === evidence.currentActorType &&
    decision.capability.key === evidence.currentCapabilityKey
  );
}
