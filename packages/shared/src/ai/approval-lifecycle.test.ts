import { describe, expect, it } from 'vitest';
import {
  assertApprovalConsumableStatus,
  assertApprovalDecision,
  assertEmployeeApprover,
  effectiveApprovalStatus,
  isApprovalExpired,
  nextStatusForDecision,
} from './approval-lifecycle';

const FUTURE = new Date('2026-08-23T12:00:00.000Z');
const NOW = new Date('2026-08-22T12:00:00.000Z');
const PAST = new Date('2026-08-21T12:00:00.000Z');

describe('approval lifecycle', () => {
  it('treats a pending row past expiresAt as EXPIRED', () => {
    expect(isApprovalExpired(PAST, NOW)).toBe(true);
    expect(effectiveApprovalStatus('PENDING', PAST, NOW)).toBe('EXPIRED');
    expect(assertApprovalDecision('PENDING', 'APPROVE', PAST, NOW)).toBe('EXPIRED');
  });

  it('allows approve, reject and cancel only from PENDING', () => {
    expect(assertApprovalDecision('PENDING', 'APPROVE', FUTURE, NOW)).toBeNull();
    expect(nextStatusForDecision('APPROVE')).toBe('APPROVED');
    expect(nextStatusForDecision('REJECT')).toBe('REJECTED');
    expect(nextStatusForDecision('CANCEL')).toBe('CANCELLED');
    expect(assertApprovalDecision('APPROVED', 'REJECT', FUTURE, NOW)).toBe('NOT_PENDING');
    expect(assertApprovalDecision('CONSUMED', 'APPROVE', FUTURE, NOW)).toBe('ONE_TIME_CONSUMED');
  });

  it('consumes an approval only once', () => {
    expect(assertApprovalConsumableStatus('APPROVED', FUTURE, NOW)).toBeNull();
    expect(assertApprovalConsumableStatus('CONSUMED', FUTURE, NOW)).toBe('ONE_TIME_CONSUMED');
    expect(assertApprovalConsumableStatus('PENDING', FUTURE, NOW)).toBe('NOT_APPROVED');
    expect(assertApprovalConsumableStatus('APPROVED', PAST, NOW)).toBe('EXPIRED');
  });

  it('forbids AI self-approval', () => {
    expect(
      assertEmployeeApprover({
        requesterActorType: 'INTERNAL_AI',
        requesterActorId: 'agent-1',
        approverActorType: 'INTERNAL_AI',
        approverActorId: 'agent-1',
      }),
    ).toBe('AI_SELF_APPROVAL');
    expect(
      assertEmployeeApprover({
        requesterActorType: 'INTERNAL_AI',
        requesterActorId: 'agent-1',
        approverActorType: 'EXTERNAL_AGENT',
        approverActorId: 'other-agent',
      }),
    ).toBe('AI_SELF_APPROVAL');
    expect(
      assertEmployeeApprover({
        requesterActorType: 'INTERNAL_AI',
        requesterActorId: 'agent-1',
        approverActorType: 'USER',
        approverActorId: 'emp-1',
      }),
    ).toBeNull();
  });
});
