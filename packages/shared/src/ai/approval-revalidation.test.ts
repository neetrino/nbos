import { describe, expect, it } from 'vitest';
import { actorContextFromMachine } from '../actor';
import { getAiCapability } from './capability-registry';
import { assertApprovedCommit } from './approval-revalidation';
import type { AiPolicyDecision } from './policy-decision';

const ACTOR = actorContextFromMachine({
  id: 'agent-1',
  type: 'INTERNAL_AI',
  displayName: 'Messenger Agent',
});

const DIGEST = 'a'.repeat(64);

function allowDecision(): AiPolicyDecision {
  return {
    outcome: 'ALLOW',
    actorId: ACTOR.actor.id,
    actorType: ACTOR.actor.type,
    capability: getAiCapability('messenger.reply_send')!,
    matchedScope: {
      scopeType: 'RESOURCE',
      scopeId: 'conv-1',
      resourceType: 'CONVERSATION',
    },
  };
}

function evidence(overrides: Partial<Parameters<typeof assertApprovedCommit>[0]> = {}) {
  return {
    status: 'APPROVED' as const,
    expiresAt: new Date('2026-08-23T00:00:00.000Z'),
    now: new Date('2026-08-22T12:00:00.000Z'),
    storedPayloadDigest: DIGEST,
    proposedPayloadDigest: DIGEST,
    requesterActorType: ACTOR.actor.type,
    requesterActorId: ACTOR.actor.id,
    capabilityKey: 'messenger.reply_send',
    currentActorType: ACTOR.actor.type,
    currentActorId: ACTOR.actor.id,
    currentCapabilityKey: 'messenger.reply_send',
    policyDecision: allowDecision(),
    domainStateValid: true,
    ...overrides,
  };
}

describe('approval revalidation before commit', () => {
  it('allows a matching one-time approved payload', () => {
    expect(assertApprovedCommit(evidence())).toBeNull();
  });

  it('invalidates the approval when the payload digest changed', () => {
    expect(assertApprovedCommit(evidence({ proposedPayloadDigest: 'b'.repeat(64) }))).toBe(
      'PAYLOAD_CHANGED',
    );
  });

  it('refuses commit after the actor or grant is no longer ALLOW', () => {
    expect(
      assertApprovedCommit(
        evidence({ policyDecision: { outcome: 'DENY', reason: 'AGENT_DISABLED' } }),
      ),
    ).toBe('AUTHORIZATION_REVOKED');
    expect(
      assertApprovedCommit(
        evidence({ policyDecision: { outcome: 'DENY', reason: 'CAPABILITY_GRANT_REVOKED' } }),
      ),
    ).toBe('AUTHORIZATION_REVOKED');
  });

  it('refuses when domain state is no longer valid', () => {
    expect(assertApprovedCommit(evidence({ domainStateValid: false }))).toBe(
      'DOMAIN_STATE_INVALID',
    );
  });

  it('refuses a replayed approval for another actor or capability', () => {
    expect(assertApprovedCommit(evidence({ currentActorId: 'agent-other' }))).toBe(
      'ACTOR_MISMATCH',
    );
    expect(assertApprovedCommit(evidence({ currentCapabilityKey: 'messenger.reply_draft' }))).toBe(
      'CAPABILITY_MISMATCH',
    );
  });
});
