import type {
  MessengerCoreAccessDecision,
  MessengerCoreAccessFacts,
} from './messenger-core-access.types';

function denyAll(
  sendDeniedBecause: MessengerCoreAccessDecision['sendDeniedBecause'],
): MessengerCoreAccessDecision {
  return { canRead: false, canWrite: false, canSend: false, sendDeniedBecause };
}

function isWriteableParticipant(facts: MessengerCoreAccessFacts): boolean {
  return facts.isActiveParticipant && facts.participantRole !== 'READ_ONLY';
}

function hasGrant(facts: MessengerCoreAccessFacts): boolean {
  return facts.grantLevel === 'VIEW' || facts.grantLevel === 'EDIT';
}

function evaluateInternal(facts: MessengerCoreAccessFacts): MessengerCoreAccessDecision {
  const canRead = facts.isActiveParticipant || facts.viewScope === 'ALL' || hasGrant(facts);
  if (!canRead) {
    return denyAll('NO_READ');
  }
  const canWrite =
    facts.editScope !== 'NONE' &&
    (isWriteableParticipant(facts) || facts.editScope === 'ALL' || facts.grantLevel === 'EDIT');
  return { canRead: true, canWrite, canSend: false, sendDeniedBecause: 'NO_SEND' };
}

function evaluateClient(facts: MessengerCoreAccessFacts): MessengerCoreAccessDecision {
  const canRead = facts.isActiveParticipant || facts.clientReadScope === 'ALL' || hasGrant(facts);
  if (!canRead) {
    return denyAll('NO_READ');
  }
  const canWrite =
    facts.editScope !== 'NONE' && (isWriteableParticipant(facts) || facts.grantLevel === 'EDIT');
  if (facts.participantRole === 'READ_ONLY') {
    return { canRead: true, canWrite: false, canSend: false, sendDeniedBecause: 'READ_ONLY' };
  }
  if (facts.clientSendScope === 'NONE') {
    return { canRead: true, canWrite, canSend: false, sendDeniedBecause: 'NO_SEND' };
  }
  return { canRead: true, canWrite, canSend: true, sendDeniedBecause: null };
}

/**
 * Conversation ACL for Messaging Core HTTP.
 * Ignores ConversationLink, Product membership, Collection membership, and attention.
 */
export function evaluateMessengerCoreAccess(
  facts: MessengerCoreAccessFacts,
): MessengerCoreAccessDecision {
  if (facts.viewScope === 'NONE') {
    return denyAll('NO_READ');
  }
  if (facts.zone === 'INTERNAL') {
    return evaluateInternal(facts);
  }
  return evaluateClient(facts);
}
