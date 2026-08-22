import { isEmployeeActorType, isMachineActorType, type ActorType } from '../actor';
import type { AiApprovalDecisionAction, AiApprovalStatus } from './approval-types';

export type AiApprovalLifecycleDenial =
  | 'NOT_PENDING'
  | 'NOT_APPROVED'
  | 'ALREADY_TERMINAL'
  | 'EXPIRED'
  | 'AI_SELF_APPROVAL'
  | 'APPROVER_NOT_EMPLOYEE'
  | 'ONE_TIME_CONSUMED';

const TERMINAL_STATUSES: readonly AiApprovalStatus[] = [
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'CONSUMED',
];

export function isTerminalApprovalStatus(status: AiApprovalStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isApprovalExpired(expiresAt: Date, now: Date): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function effectiveApprovalStatus(
  status: AiApprovalStatus,
  expiresAt: Date,
  now: Date,
): AiApprovalStatus {
  if ((status === 'PENDING' || status === 'APPROVED') && isApprovalExpired(expiresAt, now)) {
    return 'EXPIRED';
  }
  return status;
}

/** An AI actor cannot approve its own action, or any action. */
export function assertEmployeeApprover(params: {
  requesterActorType: ActorType;
  requesterActorId: string;
  approverActorType: ActorType;
  approverActorId: string;
}): AiApprovalLifecycleDenial | null {
  if (!isEmployeeActorType(params.approverActorType)) {
    return isMachineActorType(params.approverActorType)
      ? 'AI_SELF_APPROVAL'
      : 'APPROVER_NOT_EMPLOYEE';
  }
  if (
    isMachineActorType(params.requesterActorType) &&
    params.requesterActorId === params.approverActorId
  ) {
    return 'AI_SELF_APPROVAL';
  }
  return null;
}

export function assertApprovalDecision(
  status: AiApprovalStatus,
  action: AiApprovalDecisionAction,
  expiresAt: Date,
  now: Date,
): AiApprovalLifecycleDenial | null {
  const effective = effectiveApprovalStatus(status, expiresAt, now);
  if (effective === 'EXPIRED') {
    return 'EXPIRED';
  }
  if (isTerminalApprovalStatus(effective)) {
    return effective === 'CONSUMED' ? 'ONE_TIME_CONSUMED' : 'ALREADY_TERMINAL';
  }
  if (effective !== 'PENDING') {
    return 'NOT_PENDING';
  }
  void action;
  return null;
}

export function nextStatusForDecision(action: AiApprovalDecisionAction): AiApprovalStatus {
  if (action === 'APPROVE') {
    return 'APPROVED';
  }
  if (action === 'REJECT') {
    return 'REJECTED';
  }
  return 'CANCELLED';
}

/** Default approvals are one-time. CONSUMED cannot authorize a second commit. */
export function assertApprovalConsumableStatus(
  status: AiApprovalStatus,
  expiresAt: Date,
  now: Date,
): AiApprovalLifecycleDenial | null {
  const effective = effectiveApprovalStatus(status, expiresAt, now);
  if (effective === 'EXPIRED') {
    return 'EXPIRED';
  }
  if (effective === 'CONSUMED') {
    return 'ONE_TIME_CONSUMED';
  }
  if (effective !== 'APPROVED') {
    return 'NOT_APPROVED';
  }
  return null;
}
