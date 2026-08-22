import { BadRequestException } from '@nestjs/common';
import type { AiApprovalCommitDenial, AiApprovalLifecycleDenial } from '@nbos/shared';

const LIFECYCLE_MESSAGES: Record<AiApprovalLifecycleDenial, string> = {
  NOT_PENDING: 'Only a pending approval can be decided',
  NOT_APPROVED: 'Only an approved request can be consumed',
  ALREADY_TERMINAL: 'This approval is no longer pending',
  EXPIRED: 'This approval has expired',
  AI_SELF_APPROVAL: 'An AI actor cannot approve an action',
  APPROVER_NOT_EMPLOYEE: 'Only an employee may approve',
  ONE_TIME_CONSUMED: 'This approval has already been consumed',
};

const COMMIT_MESSAGES: Record<
  Exclude<AiApprovalCommitDenial, AiApprovalLifecycleDenial>,
  string
> = {
  PAYLOAD_CHANGED: 'The proposed payload no longer matches the approved digest',
  ACTOR_MISMATCH: 'The acting actor does not match the approval requester',
  CAPABILITY_MISMATCH: 'The capability does not match the approval',
  AUTHORIZATION_REVOKED: 'Actor, grant or scope is no longer valid',
  DOMAIN_STATE_INVALID: 'The current domain state no longer allows this action',
};

export function throwApprovalLifecycle(reason: AiApprovalLifecycleDenial): never {
  throw new BadRequestException(LIFECYCLE_MESSAGES[reason]);
}

export function throwApprovalCommit(reason: AiApprovalCommitDenial): never {
  if (reason in LIFECYCLE_MESSAGES) {
    throwApprovalLifecycle(reason as AiApprovalLifecycleDenial);
  }
  throw new BadRequestException(
    COMMIT_MESSAGES[reason as Exclude<AiApprovalCommitDenial, AiApprovalLifecycleDenial>],
  );
}
