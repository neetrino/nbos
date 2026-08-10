import { describe, expect, it } from 'vitest';
import {
  buildMessengerCanonicalKey,
  canSendAgainstConversationStatus,
  isConversationTypeCompatibleWithPrimaryEntity,
  isMessengerParticipantRole,
  primaryEntityTypeForConversationType,
} from './messenger-canonical.util';

describe('buildMessengerCanonicalKey', () => {
  it('builds entity keys', () => {
    expect(buildMessengerCanonicalKey('PROJECT_GENERAL', 'proj-1')).toBe('project_general:proj-1');
    expect(buildMessengerCanonicalKey('PRODUCT', 'prod-1')).toBe('product:prod-1');
    expect(buildMessengerCanonicalKey('DEAL', 'deal-1')).toBe('deal:deal-1');
    expect(buildMessengerCanonicalKey('TASK', 'task-1')).toBe('task:task-1');
  });

  it('normalizes DIRECT pair order', () => {
    const a = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const b = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    expect(buildMessengerCanonicalKey('DIRECT', b, a)).toBe(`direct:${a}:${b}`);
    expect(buildMessengerCanonicalKey('DIRECT', a, b)).toBe(`direct:${a}:${b}`);
  });

  it('rejects invalid DIRECT inputs', () => {
    expect(() => buildMessengerCanonicalKey('DIRECT', 'only-one')).toThrow(/two employee/);
    expect(() => buildMessengerCanonicalKey('DIRECT', 'same', 'same')).toThrow(/distinct/);
  });
});

describe('primary entity compatibility', () => {
  it('maps conversation types to primary entity types', () => {
    expect(primaryEntityTypeForConversationType('PROJECT_GENERAL')).toBe('PROJECT');
    expect(primaryEntityTypeForConversationType('PRODUCT')).toBe('PRODUCT');
    expect(primaryEntityTypeForConversationType('DEAL')).toBe('DEAL');
    expect(primaryEntityTypeForConversationType('TASK')).toBe('TASK');
  });

  it('validates primary link compatibility', () => {
    expect(isConversationTypeCompatibleWithPrimaryEntity('PRODUCT', 'PRODUCT')).toBe(true);
    expect(isConversationTypeCompatibleWithPrimaryEntity('PRODUCT', 'PROJECT')).toBe(false);
    expect(isConversationTypeCompatibleWithPrimaryEntity('DIRECT', 'TASK')).toBe(false);
  });
});

describe('participant role and lock policy helpers', () => {
  it('validates roles', () => {
    expect(isMessengerParticipantRole('OWNER')).toBe(true);
    expect(isMessengerParticipantRole('GUEST')).toBe(false);
  });

  it('blocks send only when LOCKED', () => {
    expect(canSendAgainstConversationStatus('ACTIVE')).toBe(true);
    expect(canSendAgainstConversationStatus('ARCHIVED')).toBe(true);
    expect(canSendAgainstConversationStatus('LOCKED')).toBe(false);
  });
});
