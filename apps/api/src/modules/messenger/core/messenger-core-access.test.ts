import { describe, expect, it } from 'vitest';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import type { MessengerCoreAccessFacts } from './messenger-core-access.types';

const INTERNAL_MEMBER: MessengerCoreAccessFacts = {
  conversationId: 'c-int',
  zone: 'INTERNAL',
  viewScope: 'OWN',
  editScope: 'OWN',
  clientReadScope: 'NONE',
  clientSendScope: 'NONE',
  isActiveParticipant: true,
  participantRole: 'MEMBER',
  grantLevel: null,
};

const CLIENT_MEMBER: MessengerCoreAccessFacts = {
  conversationId: 'c-ext',
  zone: 'CLIENT',
  viewScope: 'OWN',
  editScope: 'OWN',
  clientReadScope: 'OWN',
  clientSendScope: 'OWN',
  isActiveParticipant: true,
  participantRole: 'MEMBER',
  grantLevel: null,
};

describe('evaluateMessengerCoreAccess Internal', () => {
  it('allows members to read and write', () => {
    const decision = evaluateMessengerCoreAccess(INTERNAL_MEMBER);
    expect(decision.canRead).toBe(true);
    expect(decision.canWrite).toBe(true);
    expect(decision.canSend).toBe(false);
  });

  it('denies Internal history to non-participants with only module VIEW OWN', () => {
    const decision = evaluateMessengerCoreAccess({
      ...INTERNAL_MEMBER,
      isActiveParticipant: false,
      participantRole: null,
    });
    expect(decision.canRead).toBe(false);
  });

  it('allows Internal read via MESSENGER VIEW ALL without membership', () => {
    const decision = evaluateMessengerCoreAccess({
      ...INTERNAL_MEMBER,
      viewScope: 'ALL',
      editScope: 'ALL',
      isActiveParticipant: false,
      participantRole: null,
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canWrite).toBe(true);
  });

  it('treats READ_ONLY membership as read without write', () => {
    const decision = evaluateMessengerCoreAccess({
      ...INTERNAL_MEMBER,
      participantRole: 'READ_ONLY',
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canWrite).toBe(false);
  });
});

describe('evaluateMessengerCoreAccess Client READ vs SEND', () => {
  it('does not grant Client READ from Internal VIEW ALL', () => {
    const decision = evaluateMessengerCoreAccess({
      ...CLIENT_MEMBER,
      viewScope: 'ALL',
      editScope: 'ALL',
      clientReadScope: 'NONE',
      clientSendScope: 'NONE',
      isActiveParticipant: false,
      participantRole: null,
    });
    expect(decision.canRead).toBe(false);
    expect(decision.sendDeniedBecause).toBe('NO_READ');
  });

  it('denies Product-developer forged Client UUID without Client READ or membership', () => {
    const decision = evaluateMessengerCoreAccess({
      conversationId: 'forged',
      zone: 'CLIENT',
      viewScope: 'OWN',
      editScope: 'OWN',
      clientReadScope: 'NONE',
      clientSendScope: 'NONE',
      isActiveParticipant: false,
      participantRole: null,
      grantLevel: null,
    });
    expect(decision.canRead).toBe(false);
  });

  it('allows Client READ from membership without implying SEND', () => {
    const decision = evaluateMessengerCoreAccess({
      ...CLIENT_MEMBER,
      clientSendScope: 'NONE',
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canSend).toBe(false);
    expect(decision.sendDeniedBecause).toBe('NO_SEND');
  });

  it('keeps READ_ONLY invite distinct from missing SEND', () => {
    const decision = evaluateMessengerCoreAccess({
      ...CLIENT_MEMBER,
      participantRole: 'READ_ONLY',
      clientSendScope: 'ALL',
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canSend).toBe(false);
    expect(decision.sendDeniedBecause).toBe('READ_ONLY');
  });

  it('does not turn a VIEW override into Client SEND', () => {
    const decision = evaluateMessengerCoreAccess({
      ...CLIENT_MEMBER,
      isActiveParticipant: false,
      participantRole: null,
      clientSendScope: 'NONE',
      grantLevel: 'VIEW',
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canSend).toBe(false);
    expect(decision.sendDeniedBecause).toBe('NO_SEND');
  });

  it('does not turn an EDIT override into Client SEND', () => {
    const decision = evaluateMessengerCoreAccess({
      ...CLIENT_MEMBER,
      isActiveParticipant: false,
      participantRole: null,
      clientSendScope: 'NONE',
      grantLevel: 'EDIT',
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canWrite).toBe(true);
    expect(decision.canSend).toBe(false);
    expect(decision.sendDeniedBecause).toBe('NO_SEND');
  });

  it('treats CLIENT_READ ALL as a read ceiling, not write', () => {
    const decision = evaluateMessengerCoreAccess({
      conversationId: 'c-ext',
      zone: 'CLIENT',
      viewScope: 'OWN',
      editScope: 'OWN',
      clientReadScope: 'ALL',
      clientSendScope: 'NONE',
      isActiveParticipant: false,
      participantRole: null,
      grantLevel: null,
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canWrite).toBe(false);
    expect(decision.canSend).toBe(false);
  });

  it('does not use Internal EDIT ALL as a Client write bypass', () => {
    const decision = evaluateMessengerCoreAccess({
      conversationId: 'c-ext',
      zone: 'CLIENT',
      viewScope: 'ALL',
      editScope: 'ALL',
      clientReadScope: 'ALL',
      clientSendScope: 'NONE',
      isActiveParticipant: false,
      participantRole: null,
      grantLevel: null,
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canWrite).toBe(false);
    expect(decision.canSend).toBe(false);
  });
});
