import type { AiCustomerConversationScope } from './customer-facing-types';

export type AiCustomerIsolationDenial =
  | 'SCOPE_INCOMPLETE'
  | 'CHANNEL_MISMATCH'
  | 'CONVERSATION_MISMATCH'
  | 'CUSTOMER_MISMATCH'
  | 'ORGANIZATION_MISMATCH';

/**
 * Deny-by-default customer/conversation match. Guessing a conversation id
 * never authorizes another customer's records.
 */
export function assertCustomerConversationScope(
  granted: AiCustomerConversationScope,
  requested: AiCustomerConversationScope,
): AiCustomerIsolationDenial | null {
  if (!isCompleteCustomerScope(granted) || !isCompleteCustomerScope(requested)) {
    return 'SCOPE_INCOMPLETE';
  }
  if (granted.channel !== requested.channel) {
    return 'CHANNEL_MISMATCH';
  }
  if (granted.conversationId !== requested.conversationId) {
    return 'CONVERSATION_MISMATCH';
  }
  if (granted.customerId !== requested.customerId) {
    return 'CUSTOMER_MISMATCH';
  }
  if (organizationMismatch(granted.organizationId, requested.organizationId)) {
    return 'ORGANIZATION_MISMATCH';
  }
  return null;
}

export function isCompleteCustomerScope(scope: AiCustomerConversationScope): boolean {
  return Boolean(scope.channel && scope.conversationId && scope.customerId);
}

function organizationMismatch(
  granted: string | null | undefined,
  requested: string | null | undefined,
): boolean {
  if (!granted && !requested) {
    return false;
  }
  if (!granted || !requested) {
    return true;
  }
  return granted !== requested;
}
