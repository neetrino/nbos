import type { ActorType, AiPolicyDecision } from '@nbos/shared';

export interface CreateApprovalRequestInput {
  requesterActorType: ActorType | string;
  requesterActorId: string;
  onBehalfOfActorType?: string | null;
  onBehalfOfActorId?: string | null;
  capabilityKey: string;
  resourceType: string;
  resourceId: string;
  scopeType?: string | null;
  scopeId?: string | null;
  payload: unknown;
  correlationId?: string | null;
}

export interface ApprovalCommitInput {
  approvalId: string;
  proposedPayload: unknown;
  currentActorType: ActorType;
  currentActorId: string;
  currentCapabilityKey: string;
  policyDecision: AiPolicyDecision;
  domainStateValid: boolean;
}
