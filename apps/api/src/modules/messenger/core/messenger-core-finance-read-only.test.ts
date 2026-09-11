import { describe, expect, it } from 'vitest';
import { evaluateMessengerCoreAccess } from './messenger-core-access';

describe('Slice 10 manual finance participant READ without SEND', () => {
  it('keeps a READ_ONLY finance invite from sending even with CLIENT_SEND ALL', () => {
    const decision = evaluateMessengerCoreAccess({
      conversationId: 'conv-finance',
      zone: 'CLIENT',
      viewScope: 'ALL',
      editScope: 'ALL',
      clientReadScope: 'ALL',
      clientSendScope: 'ALL',
      isActiveParticipant: true,
      participantRole: 'READ_ONLY',
      grantLevel: null,
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canSend).toBe(false);
    expect(decision.sendDeniedBecause).toBe('READ_ONLY');
  });
});
